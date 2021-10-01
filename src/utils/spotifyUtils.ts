import * as Discord from "discord.js";
import * as _ from "lodash";
import * as moment from "moment";
import * as config from "../../config.json";
import Constants, { SpotifyAuthenticationErrors } from "../constants";
import { store } from "../dataStore";
import { logger } from "../logger";
import { spotifyClient } from "../spotify";
import { Playlist } from "../types/playlist";
import { SpotifyUser } from "../types/spotifyUser";
import { Subscription } from "../types/subscription";
import { UserAuth, UserAuthType } from "../types/userAuth";
import { PlaylistCollection, UserData } from "../types/userData";
import { getChannelPlaylistId } from "./dataUtils";
import playlistUtils from "./playlistUtils";

function createAuthorizationUrl(): string {
  return spotifyClient.createAuthorizeURL(["playlist-modify-public"], "");
}

async function refreshAccessToken(auth: UserAuthType): Promise<void> {
  spotifyClient.setAccessToken(auth.accessToken);
  spotifyClient.setRefreshToken(auth.refreshToken);

  let data;
  try {
    data = await spotifyClient.refreshAccessToken();
  } catch (e) {
    logger.error(`Error refreshing access token: ${JSON.stringify(e)}`);
    return Promise.reject(e);
  }

  auth.accessToken = data.body.access_token;
  auth.expirationDate = moment()
    .add(data.body.expires_in, "seconds")
    .toISOString();
  return Promise.resolve();
}

async function authenticateAsUser(userId: SpotifyUser.Id): Promise<void> {
  const authCollection = store.get<UserAuth.Collection>(
    Constants.DataStore.Keys.userAuthCollection
  );
  const record: UserAuthType = authCollection[userId];

  if (!record) {
    return Promise.reject(SpotifyAuthenticationErrors.NOT_AUTHORIZED);
  }

  if (moment().isAfter(record.expirationDate)) {
    try {
      // Refresh the user's access token
      await refreshAccessToken(record);

      // Update the store
      store.set<UserAuth.Collection>(
        Constants.DataStore.Keys.userAuthCollection,
        authCollection
      );
    } catch (_e) {
      return Promise.reject(SpotifyAuthenticationErrors.INVALID_TOKEN);
    }
  }

  spotifyClient.setAccessToken(record.accessToken);
  spotifyClient.setRefreshToken(record.refreshToken);
  return Promise.resolve();
}

function getUserPlaylists(userId: string): PlaylistCollection {
  const userDataStore = _.clone(
    store.get<UserData.Collection>(Constants.DataStore.Keys.userData) || {}
  );
  // store.set<UserData.Collection>(
  //   Constants.DataStore.Keys.userData,
  //   userDataStore
  // );

  let userData = userDataStore[userId];

  if (!userData) {
    userData = userDataStore[userId] = {};
  }

  if (!userData.playlists) {
    userData.playlists = {};
  }

  return userData.playlists;
}

const createNewSpotifyPlaylist =
  (
    userDataStore: UserData.Collection,
    spotifyUserId: SpotifyUser.Id,
    playlist: Playlist
  ) =>
  async (): Promise<void> => {
    const playlistName = `${playlist.channelName} - ${config.playlistName}`;
    if (!(playlist.channelId in userDataStore[spotifyUserId])) {
      try {
        const response = await spotifyClient.createPlaylist(playlistName);
        const spotifyPlaylistId = response.body.id;
        store.mutate<UserData.Collection>(
          Constants.DataStore.Keys.userData,
          (userData) => ({
            ...userData,
            [spotifyUserId]: {
              playlists: {
                ...userData[spotifyUserId].playlists,
                [playlist.channelId]: spotifyPlaylistId,
              },
            },
          })
        );
      } catch (e) {
        logger.error(
          `Error creating playlist for Spotify user ${spotifyUserId}: ${JSON.stringify(
            e
          )}`
        );
        return Promise.reject(e);
      }
    }
    return Promise.resolve();
  };

async function updateChannelPlaylist(
  playlist: Playlist,
  channel: Discord.Message["channel"]
): Promise<void> {
  const subscriptions = store.get<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions
  );
  const channelSubs = subscriptions[channel.id] || [];
  logger.info("subscribed to this channel playlist: ", channelSubs.join(", "));

  if (channelSubs) {
    for (const spotifyUserId of channelSubs) {
      await updateChannelPlaylistForUser(spotifyUserId, playlist, channel);
    }
  } else {
    return Promise.reject("No one is subscribed to this channel");
  }

  return Promise.resolve();
}

async function updateChannelPlaylistForUser(
  spotifyUserId: SpotifyUser.Id,
  playlist: Playlist,
  channel: Discord.Message["channel"]
): Promise<void> {
  // Authenticate as the user
  try {
    await authenticateAsUser(spotifyUserId);
  } catch (e) {
    logger.error(
      `Error authenticating as Spotify user ${spotifyUserId}: ${JSON.stringify(
        e
      )}`
    );
    return Promise.reject(
      `updateChannelPlaylist - Failed to authenticate Spotify user ${spotifyUserId}.`
    );
  }

  const userDataStore =
    store.get<UserData.Collection>(Constants.DataStore.Keys.userData) || {};

  let _playlist = playlist;
  // Second thing's second, check if the playlist exists at all
  if (_.isNil(_playlist)) {
    _playlist = playlistUtils.create(channel as Discord.TextChannel);
    await createNewSpotifyPlaylist(userDataStore, spotifyUserId, _playlist)();
  }

  const makePlaylist = createNewSpotifyPlaylist(
    userDataStore,
    spotifyUserId,
    _playlist
  );

  const playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
  if (_.isNil(playlistId) || _.isEmpty(playlistId)) {
    logger.error("we should never be here right?");
    makePlaylist();
  }

  // Check if the last used playlist exists
  try {
    await spotifyClient.getPlaylist(
      getChannelPlaylistId(channel.id, spotifyUserId)
    );
  } catch (e) {
    logger.warn(
      `Trouble getting existing playlist for Spotify user ${spotifyUserId}: ${JSON.stringify(
        e
      )}`
    );

    // Playlist doesn't exist, so make a new one
    await makePlaylist();
  }

  // Get the tracks currently on the user's playlist
  let playlistTracksResponse;
  try {
    playlistTracksResponse = await spotifyClient.getPlaylistTracks(
      getChannelPlaylistId(channel.id, spotifyUserId)
    );
  } catch (e) {
    logger.warn(
      `Trouble getting playlist tracks for Spotify user ${spotifyUserId}: ${JSON.stringify(
        e
      )}`
    );

    // Playlist messed up, so make a new one
    // @kevin Sep 30 2021: Why?
    await makePlaylist();
  }

  // Remove all tracks from the user's playlist
  let tracksToRemove = [];
  if (playlistTracksResponse) {
    tracksToRemove = playlistTracksResponse.body.items.map((item) => ({
      uri: item.track.uri,
    }));
  }
  if (!_.isEmpty(tracksToRemove)) {
    try {
      await spotifyClient.removeTracksFromPlaylist(
        getChannelPlaylistId(channel.id, spotifyUserId),
        tracksToRemove
      );
    } catch (e) {
      logger.warn(
        `Trouble removing existing playlist tracks for Spotify user ${spotifyUserId}: ${JSON.stringify(
          e
        )}`
      );

      // Playlist messed up, so make a new one
      // @kevin Sep 30 2021: Why?
      await makePlaylist();
    }
  }

  // Add the channel's playlist to the user's playlist
  logger.info(
    "does the playlist have song URIs? ",
    _playlist && _playlist.songUris ? _playlist.songUris.join(", ") : "No."
  );
  if (_playlist && _playlist.songUris && _playlist.songUris.length) {
    channel.send(`Uploading ${_playlist.songUris.length} songs`);
  }
  try {
    const playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
    logger.info(playlistId, JSON.stringify(_playlist.songUris));
    await spotifyClient.addTracksToPlaylist(playlistId, _playlist.songUris);
  } catch (e) {
    logger.error(
      `Error adding tracks to playlist for Spotify user ${spotifyUserId}: ${e}`
    );

    // Playlist messed up, so make a new one
    // @kevin Sep 30 2021: Why?
    await makePlaylist();

    return Promise.reject(
      new Error(
        `Unable to add to playlist. Has anything been added since the last update?`
      )
    );
  }

  return Promise.resolve();
}

function encodeUri(track: string): string {
  return `spotify:track:${track}`;
}

export default {
  createAuthorizationUrl,
  encodeUri,
  updateChannelPlaylistForUser,
  updateChannelPlaylist,
  getUserPlaylists,
};
