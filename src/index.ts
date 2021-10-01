#!/usr/bin/env node

import { DMChannel, Message, TextChannel } from "discord.js";
import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import { DateTime } from "luxon";
import { isEmpty } from "ramda";
import Commands from "./command/commands";
import getCommand from "./command/getCommand";
import Constants from "./constants";
import { store } from "./dataStore";
import { Auth } from "./types/auth";
import { Config } from "./types/config";
import { ChannelPlaylistCollection, Playlist } from "./types/playlist";
import checkIfUpdateRequired from "./utils/common/checkIfUpdateRequired";
import createPlaylistObject from "./utils/common/createPlaylistObject";
import { isChannelSubscribedTo } from "./utils/dataUtils";
import discordUtils, { discordClient } from "./utils/discordUtils";
import { logger } from "./utils/logger";
import spotifyUtils from "./utils/spotifyUtils";

// How many times the server should check for playlist updates, in seconds
const TICKS_PER_SECOND = 1;

export function main(): void {
  const auth = <Auth>yaml.load(readFileSync("auth.yml", "utf8"));

  discordClient.on("error", logger.error);

  // login
  discordClient.login(auth.discord.token);

  discordClient.on("ready", () => {
    logger.info(`Logged in as ${discordClient.user.tag}`);

    // Manage all channels' playlists
    checkChannelListStatus();
  });

  discordClient.on("message", async (message) => {
    // Analyze each user message that comes in
    if (message.author.id !== discordClient.user.id) {
      await checkMessage(message);
    }
  });
}

export async function checkMessage(message: Message): Promise<void> {
  const isBotMention: boolean = message.mentions.users.some(
    (user) => user.tag === discordClient.user.tag
  );

  if (isBotMention) {
    const [, command, ...args] = message.content.split(/\s+/);
    const commandFn = getCommand(command.replaceAll("!", ""));
    // Execute the command if it exists
    if (commandFn) {
      logger.info(`Executing command: ${command}`);
      try {
        await commandFn(message, ...args);
      } catch (e) {
        logger.error(e);
      }
    } else {
      logger.info(
        `Tried executing command: ${command}, but failed -- no command found (try \`!help\`)`
      );
      const errorPrefixes = Constants.Strings.CommandError.Prefixes;
      message.channel.send(
        `${errorPrefixes[Math.floor(Math.random() * errorPrefixes.length)]} ${
          Constants.Strings.CommandError.Response
        }`
      );
    }
  } else {
    const [command, ...args] = message.content.split(/\s+/);
    const commandFn = getCommand(command.replaceAll("!", ""));
    if (message.channel instanceof TextChannel) {
      if (command.charAt(0) === "!") {
        // Execute the command if it exists
        if (commandFn) {
          try {
            await commandFn(message, ...args);
          } catch (e) {
            logger.error(e);
          }
        } else {
          const errorPrefixes = Constants.Strings.CommandError.Prefixes;
          message.channel.send(
            `${
              errorPrefixes[Math.floor(Math.random() * errorPrefixes.length)]
            } ${Constants.Strings.CommandError.Response}`
          );
        }
        return;
      }

      // Only monitor channels that are subscribed to
      if (isChannelSubscribedTo(message.channel.id)) {
        // Check for new tracks from users in the channel
        const songUris = discordUtils.extractAndProcessTracks(message);
        if (songUris.length) {
          logger.info(`I found some tasty tracks!\n${songUris.join(", ")}`);
        }
      }
    } else if (message.channel instanceof DMChannel) {
      if (commandFn) {
        commandFn(message, ...args);
      } else {
        // If this is a DM, assume someone is registering a token
        Commands["register-token"](message, message.content);
      }
    }
  }
}

async function checkChannelListStatus(): Promise<void> {
  const config = <Config>yaml.load(readFileSync("config.yml", "utf8"));

  // Check for updates on the given tick interval
  setTimeout(checkChannelListStatus, 1000 / TICKS_PER_SECOND);

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
          channel.send(Constants.Strings.Notifications.messageOnPlaylistCommit);
        }

        logger.log(`Updating playlist for "${playlist.channelName}"`);

        // Update the users playlists
        try {
          await spotifyUtils.updateChannelPlaylist(playlist, channel);
        } catch (e) {
          logger.error(
            `Error updating playlist for channel "${playlist.channelName}": `
          );
          channel.send(e);
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
}

// Start the bot
main();
