import * as Discord from "discord.js";
import * as _ from "lodash";
import * as config from "../../config.json";
import Constants from "../constants";
import { store } from "../dataStore";
import { ChannelPlaylistCollection, Playlist } from "../types/playlist";
import playlistUtils from "./playlistUtils";
import spotifyUtils from "./spotifyUtils";

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
      channelPlaylistCollection[channel.id] || playlistUtils.create(channel);

    // Add all Spotify URIs from the message to the playlist
    channelPlaylist.songUris.push(
      ...trackUris.map((uri) => spotifyUtils.encodeUri(uri))
    );
    channelPlaylist.lastUpdateDate = new Date().toISOString();

    // Update the collection
    channelPlaylistCollection[channel.id] = channelPlaylist;
    store.set<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection,
      channelPlaylistCollection
    );

    if (config.messageOnPlaylistChange) {
      channel.send(Constants.Strings.Notifications.messageOnPlaylistChange);
    }
  }

  return trackUris;
}

export default { extractTracks, extractAndProcessTracks, processTracks };
