import * as Discord from "discord.js";
import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import * as _ from "lodash";
import Constants from "../constants";
import { store } from "../dataStore";
import { Config } from "../types/config";
import { ChannelPlaylistCollection, Playlist } from "../types/playlist";
import createPlaylistObject from "./common/createPlaylistObject";

export const SPOTIFY_URL_REGEX =
  /^(?:https?:\/\/)?open\.spotify\.com\/track\/([^?\s]+)(\?[^\s]+)?$/i;

export const discordClient: Discord.Client = new Discord.Client();

function extractTracks(message: Discord.Message): string[] {
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

function extractAndProcessTracks(message: Discord.Message): string[] {
  return processTracks(
    message.channel as Discord.TextChannel,
    extractTracks(message)
  );
}

function processTracks(
  channel: Discord.TextChannel,
  trackUris: string[]
): string[] {
  if (!_.isEmpty(trackUris)) {
    const channelPlaylistCollection =
      store.get<ChannelPlaylistCollection>(
        Constants.DataStore.Keys.channelPlaylistCollection
      ) || {};
    const channelPlaylist: Playlist =
      channelPlaylistCollection[channel.id] || createPlaylistObject(channel);

    // Add all Spotify URIs from the message to the playlist
    const oldUris = _.clone(channelPlaylist.songUris);
    channelPlaylist.songUris = _.uniq([
      ...oldUris,
      ...trackUris.map((uri) => `spotify:track:${uri}`),
    ]);
    channelPlaylist.lastUpdateDate = new Date().toISOString();

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
