import { TextBasedChannels } from "discord.js";
import { curry, drop, isEmpty, prepend, take } from "ramda";
import spotifyClient from "../../spotifyClient";
import { Playlist } from "../../types/playlist";
import getChannelPlaylistId from "../data/getChannelPlaylistId";
import { messageManager } from "../discord/MessageManager";
import { logger } from "../logger";
import createNewPlaylist from "./createNewPlaylist";

const uploadToSpotify = async (
  playlist: Playlist,
  spotifyUserId: string,
  channel: TextBasedChannels,
  recalled = false
): Promise<void> => {
  // Spotify only allows 100 tracks to be added to a playlist at a time, so we batch into
  // that amount and then upload each batch
  const subdivide = curry(function group(n, list) {
    return isEmpty(list) ? [] : prepend(take(n, list), group(n, drop(n, list)));
  });
  const batchedSongUris = subdivide(100, playlist.songUris) as string[][];
  batchedSongUris.forEach(async (songUris, index) => {
    await messageManager.send(
      `Pushing batch ${index + 1} of ${batchedSongUris.length}`,
      channel
    );
    let playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
    await spotifyClient
      .addTracksToPlaylist(playlistId, songUris)
      .catch(async (e) => {
        if (e.body.error.status === 403 && !recalled) {
          logger.info("creating a new playlist");
          await createNewPlaylist(spotifyUserId, playlist);
          playlistId = getChannelPlaylistId(channel.id, spotifyUserId);
          await uploadToSpotify(playlist, spotifyUserId, channel, true);
          return Promise.resolve();
        }
        if (recalled) {
          const error = `Error adding tracks to playlist for Spotify user ${spotifyUserId}: ${e}`;
          logger.error(error);
          return Promise.reject(new Error(error));
        }
      });
  });
};

export default uploadToSpotify;
