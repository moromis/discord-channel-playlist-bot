#!/usr/bin/env node

import { discordClient, DiscordHelpers } from "./discord";
import { Commands } from "./commands";
import { logger } from "./logger";
import * as _ from "lodash";
import * as Discord from "discord.js";
import * as moment from "moment";
import { Auth } from "./models/auth";
import { store } from "./data-store";
import { ChannelPlaylistCollection } from "./models/channel-playlist-collection";
import { Config } from "./models/config";
import { SpotifyHelpers } from "./spotify";
import { Playlist } from "./models/playlist";
import { DataStore, Strings } from "./constants";

const auth: Auth = require("../auth.json");
const config: Config = require("../config.json");

export function main() {
    // login
    discordClient.login(auth.discord.token);

    discordClient.on("ready", () => {
        logger.info(`Logged in as ${discordClient.user.tag}`);

        checkChannelListStatus();
    });
    
    discordClient.on("message", (message) => {
        if (message.author.id !== discordClient.user.id) {
            checkMessage(message);
        }
    });
}

export function checkMessage(message: Discord.Message) {
    const isBotMention: boolean = message.mentions.users.some(user => user.tag === discordClient.user.tag);

    if (isBotMention) {
        const [, command, ...args] = message.content.split(/\s+/);
        const commandFn = Commands[command];

        // Execute the command if it exists
        if (commandFn) {
            commandFn(message, ...args);
        }
        else {
            const errorPrefixes = Strings.CommandError.Prefixes;
            message.channel.send(`${errorPrefixes[Math.floor(Math.random() * errorPrefixes.length)]} ${Strings.CommandError.Response}`);
        }
    }
    else {
        if (message.channel instanceof Discord.TextChannel) {
            // Check for new tracks from users in the channel
            DiscordHelpers.checkForTracks(message);
        } else if (message.channel instanceof Discord.DMChannel) {
            // If this is a DM, assume someone is registering a token
            Commands["register-token"](message, message.content);
        }
    }
}

async function checkChannelListStatus(): Promise<void> {
    const channelPlaylistCollection = store.get<ChannelPlaylistCollection>(DataStore.Keys.channelPlaylistCollection) || {};
    for (const key in channelPlaylistCollection){
        const playlist: Playlist = channelPlaylistCollection[key];
    
        if (playlist.lastCommitDate && moment().isAfter(moment(playlist.lastCommitDate).add(config.playlistUpdateFrequency, "seconds"))) {
            const channel = discordClient.channels.find(c => c.id === playlist.channelId) as Discord.TextChannel;

            if (!_.isEmpty(playlist.songUris)) {
                if (channel && config.messageOnPlaylistCommit) {
                    channel.send(Strings.Notifications.messageOnPlaylistCommit);
                }

                try {
                    await SpotifyHelpers.updateChannelPlaylist(playlist);
                } catch (e) {
                    logger.error(e);
                    continue;
                }
            }

            // Re-initialize the channel's playlist
            channelPlaylistCollection[key] = Playlist.create(channel);
            store.set<ChannelPlaylistCollection>(DataStore.Keys.channelPlaylistCollection, channelPlaylistCollection);
        }
    }

    // Check for updates every 1000ms
    setTimeout(checkChannelListStatus, 1000);
    return Promise.resolve();
}

////

// Start the bot
main();