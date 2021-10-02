import { Message, TextChannel } from "discord.js";
import { isEmpty, isNil } from "ramda";
import Constants, { SpotifyAuthenticationErrors } from "../constants";
import { store } from "../dataStore";
import spotifyClient from "../spotifyClient";
import { Playlist } from "../types/playlist";
import { SpotifyUser } from "../types/spotifyUser";
import { Subscription } from "../types/subscription";
import createPlaylistObject from "./common/createPlaylistObject";
import getChannelPlaylistId from "./data/getChannelPlaylistId";
import { messageManager } from "./discord/MessageManager";
import { logger } from "./logger";
import authenticateAsUser from "./spotify/authenticateAsUser";
import createNewPlaylist from "./spotify/createNewPlaylist";
import uploadToSpotify from "./spotify/uploadToSpotify";

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

  let playlistId = getChannelPlaylistId(channel.id, spotifyUserId);

  if (isNil(playlistId) || isEmpty(playlistId)) {
    await createNewPlaylist(spotifyUserId, _playlist);
    playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
  }

  // Check if the last used playlist exists
  await spotifyClient.getPlaylist(playlistId).catch((e) => {
    logger.info(
      `Couldn't get playlist for Spotify user ${spotifyUserId}: ${JSON.stringify(
        e
      )}`
    );
  });

  // Get the tracks currently on the user's playlist
  let playlistTracksResponse;
  try {
    playlistTracksResponse = await spotifyClient.getPlaylistTracks(playlistId);
    logger.info("tracks: ", playlistTracksResponse);
  } catch (e) {
    return Promise.reject(
      `Couldn't get playlist tracks for Spotify user ${spotifyUserId}: ${JSON.stringify(
        e
      )}`
    );
  }

  // Remove all tracks from the user's playlist
  if (playlistTracksResponse && !isEmpty(playlistTracksResponse.body.items)) {
    const tracksToRemove = playlistTracksResponse.body.items.map((item) => ({
      uri: item.track.uri,
    }));
    const response = await spotifyClient
      .removeTracksFromPlaylist(playlistId, tracksToRemove)
      .catch(async (e) => {
        if (e.body.error.status === 403) {
          logger.info("creating a new playlist");
          await createNewPlaylist(spotifyUserId, _playlist);
          playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
        }
        logger.warn(
          `Trouble removing existing playlist tracks for Spotify user ${spotifyUserId}: ${JSON.stringify(
            e
          )}`
        );
        // return Promise.reject(e);
      });
    logger.info("remove: ", response);
  }

  // Add the channel's playlist to the user's playlist
  if (_playlist && _playlist.songUris && _playlist.songUris.length) {
    await messageManager.send(
      `Uploading ${_playlist.songUris.length} song(s)`,
      channel
    );
    // upload the tracks to spotify
    await uploadToSpotify(_playlist, spotifyUserId, channel);
    await messageManager.send(Constants.Strings.successfulPush, channel);
  } else {
    await messageManager.send(Constants.Strings.noTracks, channel);
  }

  return Promise.resolve();
}

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

export default {
  updateChannelPlaylistForUser,
  updateChannelPlaylist,
};
