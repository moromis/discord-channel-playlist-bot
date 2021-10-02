import { Message, TextChannel } from "discord.js";
import { curry, drop, isEmpty, isNil, prepend, take } from "ramda";
import Constants, { SpotifyAuthenticationErrors } from "../constants";
import { store } from "../dataStore";
import spotifyClient from "../spotifyClient";
import { Playlist } from "../types/playlist";
import { SpotifyUser } from "../types/spotifyUser";
import { Subscription } from "../types/subscription";
import createPlaylistObject from "./common/createPlaylistObject";
import { getChannelPlaylistId } from "./dataUtils";
import { messageManager } from "./discord/MessageManager";
import { logger } from "./logger";
import authenticateAsUser from "./spotify/authenticateAsUser";
import createNewPlaylist from "./spotify/createNewPlaylist";

async function updateChannelPlaylist(
  playlist: Playlist,
  channel: Message["channel"]
): Promise<void> {
  const subscriptions = store.get<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions
  );
  const channelSubs = subscriptions[channel.id] || [];
  logger.info("subscribed to this channel playlist: ", channelSubs.join(", "));

  if (channelSubs && !isEmpty(channelSubs)) {
    for (const spotifyUserId of channelSubs) {
      await updateChannelPlaylistForUser(
        spotifyUserId,
        playlist,
        channel
      ).catch((e) => {
        return Promise.reject(e);
      });
    }
  } else {
    return Promise.reject(Constants.Strings.noSubscriptions);
  }

  return Promise.resolve();
}

async function updateChannelPlaylistForUser(
  spotifyUserId: SpotifyUser.Id,
  playlist: Playlist,
  channel: Message["channel"]
): Promise<void> {
  // Authenticate as the user
  await authenticateAsUser(spotifyUserId).catch((e) => {
    logger.error(`Error authenticating as Spotify user ${spotifyUserId}: ${e}`);
    return Promise.reject(SpotifyAuthenticationErrors.NOT_AUTHORIZED);
  });

  let _playlist = playlist;
  // Second thing's second, check if the playlist exists at all
  if (isNil(_playlist)) {
    _playlist = createPlaylistObject(channel as TextChannel);
    await createNewPlaylist(spotifyUserId, _playlist);
  }

  const playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
  if (isNil(playlistId) || isEmpty(playlistId)) {
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
  if (!isEmpty(tracksToRemove)) {
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
      // return Promise.reject(e);
    }
  }

  // Add the channel's playlist to the user's playlist
  if (_playlist && _playlist.songUris && _playlist.songUris.length) {
    await messageManager.send(
      `Uploading ${_playlist.songUris.length} song(s)`,
      channel
    );
  }
  try {
    const playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
    // Spotify only allows 100 tracks to be added to a playlist at a time, so we batch into
    // that amount and then upload each batch
    const subdivide = curry(function group(n, list) {
      return isEmpty(list)
        ? []
        : prepend(take(n, list), group(n, drop(n, list)));
    });
    const batchedSongUris = subdivide(100, _playlist.songUris) as string[][];
    batchedSongUris.forEach(async (songUris, index) => {
      await messageManager.send(
        `Pushing batch ${index + 1} of ${batchedSongUris.length}`,
        channel
      );
      await spotifyClient.addTracksToPlaylist(playlistId, songUris);
    });
    await messageManager.send(Constants.Strings.successfulPush, channel);
  } catch (e) {
    const error = `Error adding tracks to playlist for Spotify user ${spotifyUserId}: ${e}`;
    logger.error(error);
    return Promise.reject(new Error(error));
  }

  return Promise.resolve();
}

export default {
  updateChannelPlaylistForUser,
  updateChannelPlaylist,
};
