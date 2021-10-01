import { Client, Intents, Message, TextChannel } from "discord.js";
import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import { DateTime } from "luxon";
import { clone, isEmpty, uniq } from "ramda";
import Constants from "../constants";
import { store } from "../dataStore";
import { Config } from "../types/config";
import { ChannelPlaylistCollection, Playlist } from "../types/playlist";
import createPlaylistObject from "./common/createPlaylistObject";

export const SPOTIFY_URL_REGEX =
  /^(?:https?:\/\/)?open\.spotify\.com\/track\/([^?\s]+)(\?[^\s]+)?$/i;

export const discordClient: Client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
});

function extractTracks(message: Message): string[] {
  // Extract are any Spotify songs in this message
  return message.content
    .split(/\s+/)
    .reduce<string[]>((uriList: string[], token: string) => {
      const regexMatch = SPOTIFY_URL_REGEX.exec(token);

      if (regexMatch && regexMatch.length > 1) {
        uriList.push(regexMatch[1]);
      }

      return uriList;
    }, []);
}

function extractAndProcessTracks(message: Message): string[] {
  return processTracks(message.channel as TextChannel, extractTracks(message));
}

function processTracks(channel: TextChannel, trackUris: string[]): string[] {
  if (!isEmpty(trackUris)) {
    const channelPlaylistCollection =
      store.get<ChannelPlaylistCollection>(
        Constants.DataStore.Keys.channelPlaylistCollection
      ) || {};
    const channelPlaylist: Playlist =
      channelPlaylistCollection[channel.id] || createPlaylistObject(channel);

    // Add all Spotify URIs from the message to the playlist
    const oldUris = clone(channelPlaylist.songUris);
    channelPlaylist.songUris = uniq([
      ...oldUris,
      ...trackUris.map((uri) => `spotify:track:${uri}`),
    ]);
    channelPlaylist.lastUpdateDate = DateTime.now().toISO();

    // Update the collection
    channelPlaylistCollection[channel.id] = channelPlaylist;
    store.set<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection,
      channelPlaylistCollection
    );

    const config = <Config>yaml.load(readFileSync("config.yml", "utf8"));
    if (config.messageOnPlaylistChange) {
      channel.send(Constants.Strings.Notifications.messageOnPlaylistChange);
    }
  }

  return trackUris;
}

export default { extractTracks, extractAndProcessTracks, processTracks };
