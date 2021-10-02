import { TextChannel } from "discord.js";
import { DateTime } from "luxon";
import { isEmpty } from "ramda";
import Constants from "../constants";
import { store } from "../dataStore";
import { ChannelPlaylistCollection, Playlist } from "../types/playlist";
import checkIfUpdateRequired from "../utils/common/checkIfUpdateRequired";
import createPlaylistObject from "../utils/common/createPlaylistObject";
import { messageManager } from "../utils/discord/MessageManager";
import { logger } from "../utils/logger";
import updateChannelPlaylist from "../utils/spotify/updateChannelPlaylist";
import yaml from "../utils/yaml";
import { discordClient } from "./setupDiscordClient";

// How many times the server should check for playlist updates, in seconds
const TICKS_PER_SECOND = 1;

const watchForChannelPlaylistUpdates = async (): Promise<void> => {
  const config = yaml.getConfig();

  // Check for updates on the given tick interval
  setTimeout(watchForChannelPlaylistUpdates, 1000 / TICKS_PER_SECOND);

  // Get all managed channel playlists
  const channelPlaylistCollection = store.get<ChannelPlaylistCollection>(
    Constants.DataStore.Keys.channelPlaylistCollection
  );
  const commitPlaylistChanges = () =>
    store.set<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection,
      channelPlaylistCollection
    );

  for (const key in channelPlaylistCollection) {
    const playlist: Playlist = channelPlaylistCollection[key];

    // Check if enough time has elapsed to commit this channel's playlist to each subscribed user's Spotify account
    if (playlist && checkIfUpdateRequired(playlist)) {
      const channel = (await discordClient.channels.fetch(
        playlist.channelId
      )) as TextChannel;

      if (!isEmpty(playlist.songUris)) {
        // Update the last commit date
        channelPlaylistCollection[key].lastCommitDate = DateTime.now().toISO();
        commitPlaylistChanges();

        // Send notification (if enabled)
        if (channel && config.messageOnPlaylistCommit) {
          await messageManager.send(
            Constants.Strings.Notifications.messageOnPlaylistCommit,
            channel
          );
        }

        logger.log(`Updating playlist for "${playlist.channelName}"`);

        // Update the users playlists
        try {
          await updateChannelPlaylist(playlist, channel);
          await messageManager.cleanup(true);
        } catch (e) {
          logger.error(
            `Error updating playlist for channel "${playlist.channelName}": `
          );
          messageManager.cleanup(false);
          await messageManager.error(e, channel);
        }
      }

      if (!config.keepOldPlaylistSongs) {
        // Re-initialize the list and remove all previous songs
        channelPlaylistCollection[key] = createPlaylistObject(channel);
        commitPlaylistChanges();
      }

      // Update one playlist per tick
      break;
    }
  }

  return Promise.resolve();
};

export default watchForChannelPlaylistUpdates;
