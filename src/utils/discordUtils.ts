import { Message, TextBasedChannels, TextChannel } from "discord.js";
import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import { DateTime } from "luxon";
import { clone, isEmpty, uniq } from "ramda";
import Constants, { SPOTIFY_URL_REGEX } from "../constants";
import { store } from "../dataStore";
import { Config } from "../types/config";
import { ChannelPlaylistCollection, Playlist } from "../types/playlist";
import createPlaylistObject from "./common/createPlaylistObject";
import { messageManager } from "./discord/MessageManager";

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

async function extractAndProcessTracks(message: Message): Promise<string[]> {
  const results = await processTracks(message.channel, extractTracks(message));
  return results;
}

async function processTracks(
  channel: TextBasedChannels,
  trackUris: string[]
): Promise<string[]> {
  if (!isEmpty(trackUris)) {
    const channelPlaylistCollection =
      store.get<ChannelPlaylistCollection>(
        Constants.DataStore.Keys.channelPlaylistCollection
      ) || {};
    const channelPlaylist: Playlist =
      channelPlaylistCollection[channel.id] ||
      createPlaylistObject(channel as TextChannel);

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
      await messageManager.send(
        Constants.Strings.Notifications.messageOnPlaylistChange,
        channel
      );
    }
  }

  return trackUris;
}

export default { extractTracks, extractAndProcessTracks, processTracks };
