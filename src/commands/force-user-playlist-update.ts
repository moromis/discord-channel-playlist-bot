import * as Discord from "discord.js";
import { Command } from "../command";
import { Constants, DataStore } from "../constants";
import { store } from "../data-store";
import { logger } from "../logger";
import { ChannelPlaylistCollection } from "../models/channel-playlist-collection";
import { Playlist } from "../models/playlist";
import { SpotifyHelpers } from "../spotify";

export const Strings = Constants.Strings.Commands.ForceUserPlaylistUpdate;

export const ForceUserPlaylistUpdateCommand: Command = async (
  message: Discord.Message
) => {
  const channelPlaylistCollection =
    store.get<ChannelPlaylistCollection>(
      DataStore.Keys.channelPlaylistCollection
    ) || {};
  const channelPlaylist: Playlist =
    channelPlaylistCollection[message.channel.id];

  if (channelPlaylist) {
    await SpotifyHelpers.updateChannelPlaylist(channelPlaylist);

    message.channel.send(Strings.successResponse);
  } else {
    logger.info(
      `Channel playlist doesn't exist: ${channelPlaylist} in ${channelPlaylistCollection}`
    );
  }
  return Promise.resolve();
};
