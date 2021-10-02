import { TextChannel } from "discord.js";
import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import { DateTime } from "luxon";
import { isEmpty } from "ramda";
import Constants from "../constants";
import { store } from "../dataStore";
import { Config } from "../types/config";
import { ChannelPlaylistCollection, Playlist } from "../types/playlist";
import checkIfUpdateRequired from "../utils/common/checkIfUpdateRequired";
import createPlaylistObject from "../utils/common/createPlaylistObject";
import { messageManager } from "../utils/discord/MessageManager";
import { logger } from "../utils/logger";
import spotifyUtils from "../utils/spotifyUtils";
import { discordClient } from "./setupDiscordClient";

// How many times the server should check for playlist updates, in seconds
const TICKS_PER_SECOND = 1;

const updateChannelPlaylist = async (): Promise<void> => {
  const config = <Config>yaml.load(readFileSync("config.yml", "utf8"));

  // Check for updates on the given tick interval
  setTimeout(updateChannelPlaylist, 1000 / TICKS_PER_SECOND);

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
          await spotifyUtils.updateChannelPlaylist(playlist, channel);
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

export default updateChannelPlaylist;
