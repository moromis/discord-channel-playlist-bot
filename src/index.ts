#!/usr/bin/env node

import * as Discord from "discord.js";
import * as _ from "lodash";
import * as moment from "moment";
import { Commands } from "./commands";
import { DataStore, Strings } from "./constants";
import { store } from "./data-store";
import { discordClient, DiscordHelpers } from "./discord";
import { logger } from "./logger";
import { Auth } from "./models/auth";
import { ChannelPlaylistCollection } from "./models/channel-playlist-collection";
import { Config } from "./models/config";
import { Playlist } from "./models/playlist";
import { SpotifyHelpers } from "./spotify";
import { DataUtils } from "./utils/data-utils";

const auth: Auth = require("../auth.json");
const config: Config = require("../config.json");

// How many times the server should check for playlist updates, in seconds
const TICKS_PER_SECOND = 1;

export function main() {
  discordClient.on("error", logger.error);

  // login
  discordClient.login(auth.discord.token);

  discordClient.on("ready", () => {
    logger.info(`Logged in as ${discordClient.user.tag}`);

    // Manage all channels' playlists
    checkChannelListStatus();
  });

  discordClient.on("message", (message) => {
    // Analyze each user message that comes in
    if (message.author.id !== discordClient.user.id) {
      checkMessage(message);
    }
  });
}

export function checkMessage(message: Discord.Message) {
  const isBotMention: boolean = message.mentions.users.some(
    (user) => user.tag === discordClient.user.tag
  );

  if (isBotMention) {
    const [, command, ...args] = message.content.split(/\s+/);
    const commandFn = Commands[command];

    // Execute the command if it exists
    if (commandFn) {
      logger.info(`Executing command: ${command}`);
      commandFn(message, ...args);
    } else {
      logger.info(
        `Tried executing command: ${command}, but failed -- no command found in ${Commands}`
      );
      const errorPrefixes = Strings.CommandError.Prefixes;
      message.channel.send(
        `${errorPrefixes[Math.floor(Math.random() * errorPrefixes.length)]} ${
          Strings.CommandError.Response
        }`
      );
    }
  } else {
    if (message.channel instanceof Discord.TextChannel) {
      // Only monitor channels that are subscribed to
      if (DataUtils.isChannelSubscribedTo(message.channel.id)) {
        // Check for new tracks from users in the channel
        DiscordHelpers.extractAndProcessTracks(message);
      }
    } else if (message.channel instanceof Discord.DMChannel) {
      // If this is a DM, assume someone is registering a token
      Commands["register-token"](message, message.content);
    }
  }
}

async function checkChannelListStatus(): Promise<void> {
  // Check for updates on the given tick interval
  setTimeout(checkChannelListStatus, 1000 / TICKS_PER_SECOND);

  // Get all managed channel playlists
  const channelPlaylistCollection = _.clone(
    store.get<ChannelPlaylistCollection>(
      DataStore.Keys.channelPlaylistCollection
    ) || {}
  );
  const commitPlaylistChanges = () =>
    store.set<ChannelPlaylistCollection>(
      DataStore.Keys.channelPlaylistCollection,
      channelPlaylistCollection
    );

  for (const key in channelPlaylistCollection) {
    const playlist: Playlist = channelPlaylistCollection[key];

    // Check if enough time has elapsed to commit this channel's playlist to each subscribed user's Spotify account
    if (playlist && Playlist.requiresUpdate(playlist)) {
      const channel = discordClient.channels.find(
        (c) => c.id === playlist.channelId
      ) as Discord.TextChannel;

      if (!_.isEmpty(playlist.songUris)) {
        // Update the last commit date
        channelPlaylistCollection[key].lastCommitDate = moment().toISOString();
        commitPlaylistChanges();

        // Send notification (if enabled)
        if (channel && config.messageOnPlaylistCommit) {
          channel.send(Strings.Notifications.messageOnPlaylistCommit);
        }

        logger.log(`Updating playlist for "${playlist.channelName}"`);

        // Update the users playlists
        try {
          await SpotifyHelpers.updateChannelPlaylist(playlist);
        } catch (e) {
          logger.error(
            `Error updating playlist for channel "${playlist.channelName}": `
          );
          logger.error(e);
        }
      }

      if (!config.keepOldPlaylistSongs) {
        // Re-initialize the list and remove all previous songs
        channelPlaylistCollection[key] = Playlist.create(channel);
        commitPlaylistChanges();
      }

      // Update one playlist per tick
      break;
    }
  }

  return Promise.resolve();
}

////

// Start the bot
main();
