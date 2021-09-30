import * as Discord from "discord.js";
import { Command } from "../command";
import Constants from "../constants";
import { store } from "../dataStore";
import { logger } from "../logger";
import { ChannelPlaylistCollection, Playlist } from "../types/playlist";
import spotifyUtils from "../utils/spotifyUtils";

export const Strings = Constants.Strings.Commands.ForceUserPlaylistUpdate;

export const ForceUserPlaylistUpdateCommand: Command = async (
  message: Discord.Message
) => {
  const channelPlaylistCollection =
    store.get<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection
    ) || {};
  const channelPlaylist: Playlist =
    channelPlaylistCollection[message.channel.id];

  if (channelPlaylist) {
    await spotifyUtils.updateChannelPlaylist(channelPlaylist);

    message.channel.send(Strings.successResponse);
  } else {
    logger.info(
      `Channel playlist doesn't exist: ${channelPlaylist} in ${channelPlaylistCollection}`
    );
  }
  return Promise.resolve();
};
