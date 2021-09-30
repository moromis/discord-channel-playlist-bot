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
import { UserAuth } from "../types/userAuth";
import { PlaylistCollection, UserData } from "../types/userData";

function createAuthorizationUrl(): string {
  return spotifyClient.createAuthorizeURL(["playlist-modify-public"]);
}

async function refreshAccessToken(auth: UserAuth): Promise<void> {
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
  const record: UserAuth = authCollection[userId];

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

async function createUserPlaylist(
  userId: SpotifyUser.Id,
  name: string
): Promise<string> {
  let response;
  try {
    response = await spotifyClient.createPlaylist(userId, name);
  } catch (e) {
    logger.error(
      `Error creating playlist for Spotify user ${userId}: ${JSON.stringify(e)}`
    );
    return Promise.reject(e);
  }

  return Promise.resolve(response.body.id);
}

async function updateChannelPlaylist(playlist: Playlist): Promise<void> {
  const subscriptions = store.get<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions
  );
  const channelSubs = subscriptions[playlist.channelId];

  for (const userId of channelSubs) {
    try {
      await updateChannelPlaylistForUser(userId, playlist);
    } catch (e) {
      logger.warn(
        `Trouble updating one or more user playlists: ${JSON.stringify(e)}`
      );
    }
  }

  return Promise.resolve();
}

async function updateChannelPlaylistForUser(
  userId: SpotifyUser.Id,
  playlist: Playlist
): Promise<void> {
  const userDataStore =
    store.get<UserData.Collection>(Constants.DataStore.Keys.userData) || {};

  function userPlaylists(): PlaylistCollection {
    let userData = userDataStore[userId];

    if (!userData) {
      userData = userDataStore[userId] = {};
    }

    if (!userData.playlists) {
      userData.playlists = {};
    }

    return userData.playlists;
  }

  function userPlaylistId(): string {
    return userPlaylists()[playlist.channelId];
  }

  async function makeList(): Promise<void> {
    userPlaylists()[playlist.channelId] = await createUserPlaylist(
      userId,
      `${playlist.channelName} - ${config.playlistName}`
    );
    store.set<UserData.Collection>(
      Constants.DataStore.Keys.userData,
      userDataStore
    );
    return Promise.resolve();
  }

  // Authenticate as the user
  try {
    await authenticateAsUser(userId);
  } catch (e) {
    logger.error(
      `Error authenticating as Spotify user ${userId}: ${JSON.stringify(e)}`
    );
    return Promise.reject(
      `updateChannelPlaylist - Failed to authenticate Spotify user ${userId}.`
    );
  }

  // Check if the last used playlist exists
  try {
    await spotifyClient.getPlaylist(userPlaylistId());
  } catch (e) {
    logger.warn(
      `Trouble getting existing playlist for Spotify user ${userId}: ${JSON.stringify(
        e
      )}`
    );

    // Playlist doesn't exist, so make a new one
    await makeList();
  }

  // Get the tracks currently on the user's playlist
  let playlistTracksResponse;
  try {
    playlistTracksResponse = await spotifyClient.getPlaylistTracks(
      userPlaylistId()
    );
  } catch (e) {
    logger.warn(
      `Trouble getting playlist tracks for Spotify user ${userId}: ${JSON.stringify(
        e
      )}`
    );

    // Playlist messed up, so make a new one
    await makeList();
  }

  // Remove all tracks from the user's playlist
  const tracksToRemove = playlistTracksResponse.body.items.map((item) => ({
    uri: item.track.uri,
  }));
  if (!_.isEmpty(tracksToRemove)) {
    try {
      await spotifyClient.removeTracksFromPlaylist(
        userPlaylistId(),
        tracksToRemove
      );
    } catch (e) {
      logger.warn(
        `Trouble removing existing playlist tracks for Spotify user ${userId}: ${JSON.stringify(
          e
        )}`
      );

      // Playlist messed up, so make a new one
      await makeList();
    }
  }

  // Add the channel's playlist to the user's playlist
  try {
    await spotifyClient.addTracksToPlaylist(
      userPlaylistId(),
      playlist.songUris
    );
  } catch (e) {
    logger.error(
      `Error adding tracks to playlist for Spotify user ${userId}: ${JSON.stringify(
        e
      )}`
    );

    // Playlist messed up, so make a new one
    await makeList();

    return Promise.reject(
      `updateChannelPlaylist - Failed to add playlist tracks from channel for Spotify user ${userId}.`
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
};
