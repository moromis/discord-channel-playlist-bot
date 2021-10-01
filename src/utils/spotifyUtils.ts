import * as Discord from "discord.js";
import * as _ from "lodash";
import Constants from "../constants";
import { store } from "../dataStore";
import spotifyClient from "../spotifyClient";
import { Playlist } from "../types/playlist";
import { SpotifyUser } from "../types/spotifyUser";
import { Subscription } from "../types/subscription";
import createPlaylistObject from "./common/createPlaylistObject";
import { getChannelPlaylistId } from "./dataUtils";
import { logger } from "./logger";
import authenticateAsUser from "./spotify/authenticateAsUser";
import createNewPlaylist from "./spotify/createNewPlaylist";

async function updateChannelPlaylist(
  playlist: Playlist,
  channel: Discord.Message["channel"]
): Promise<void> {
  const subscriptions = store.get<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions
  );
  const channelSubs = subscriptions[channel.id] || [];
  logger.info("subscribed to this channel playlist: ", channelSubs.join(", "));

  if (channelSubs && !_.isEmpty(channelSubs)) {
    for (const spotifyUserId of channelSubs) {
      await updateChannelPlaylistForUser(spotifyUserId, playlist, channel);
    }
  } else {
    return Promise.reject(Constants.Strings.noSubscriptions);
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
    logger.error(`Error authenticating as Spotify user ${spotifyUserId}: ${e}`);
    return Promise.reject(
      `updateChannelPlaylistForUser - Failed to authenticate Spotify user ${spotifyUserId}.`
    );
  }

  let _playlist = playlist;
  // Second thing's second, check if the playlist exists at all
  if (_.isNil(_playlist)) {
    _playlist = createPlaylistObject(channel as Discord.TextChannel);
    await createNewPlaylist(spotifyUserId, _playlist);
  }

  const playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
  if (_.isNil(playlistId) || _.isEmpty(playlistId)) {
    logger.error("we should never be here right?");
    await createNewPlaylist(spotifyUserId, _playlist);
  }

  // Check if the last used playlist exists
  try {
    await spotifyClient.getPlaylist(
      getChannelPlaylistId(channel.id, spotifyUserId)
    );
  } catch (e) {
    return Promise.reject(
      `Couldn't get playlist for Spotify user ${spotifyUserId}: ${JSON.stringify(
        e
      )}`
    );
  }

  // Get the tracks currently on the user's playlist
  let playlistTracksResponse;
  try {
    playlistTracksResponse = await spotifyClient.getPlaylistTracks(
      getChannelPlaylistId(channel.id, spotifyUserId)
    );
  } catch (e) {
    return Promise.reject(
      `Couldn't get playlist tracks for Spotify user ${spotifyUserId}: ${JSON.stringify(
        e
      )}`
    );
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
    }
  }

  // Add the channel's playlist to the user's playlist
  if (_playlist && _playlist.songUris && _playlist.songUris.length) {
    channel.send(`Uploading ${_playlist.songUris.length} songs`);
  }
  try {
    const playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
    await spotifyClient.addTracksToPlaylist(playlistId, _playlist.songUris);
    channel.send(Constants.Strings.successfulPush);
  } catch (e) {
    logger.error(
      `Error adding tracks to playlist for Spotify user ${spotifyUserId}: ${e}`
    );
    return Promise.reject(
      new Error(
        `Unable to add to playlist. Has anything been added since the last update?`
      )
    );
  }

  return Promise.resolve();
}

export default {
  updateChannelPlaylistForUser,
  updateChannelPlaylist,
};
