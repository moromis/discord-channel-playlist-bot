import * as Discord from "discord.js";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { Command } from "../../types/command";
import { ChannelPlaylistCollection, Playlist } from "../../types/playlist";
import createPlaylistObject from "../../utils/common/createPlaylistObject";
import { isChannelSubscribedTo } from "../../utils/dataUtils";
import { logger } from "../../utils/logger";
import spotifyUtils from "../../utils/spotifyUtils";

export const ForceUserPlaylistUpdateCommand: Command = async (
  message: Discord.Message
) => {
  // make sure someone is subscribed.
  if (!isChannelSubscribedTo(message.channel.id)) {
    const rejectionMessage = Constants.Strings.noSubscriptions;
    message.channel.send(rejectionMessage);
    return Promise.reject(rejectionMessage);
  }
  message.channel.send("Forcing update...");
  const channelId = message.channel.id;
  const channelPlaylistCollection =
    store.get<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection
    ) || {};
  const channelPlaylist: Playlist = channelPlaylistCollection[channelId];

  if (channelPlaylist) {
    logger.info("Does have playlist: ", JSON.stringify(channelPlaylist));
    try {
      await spotifyUtils.updateChannelPlaylist(
        channelPlaylist,
        message.channel
      );
    } catch (e) {
      logger.error("Error: ", e);
      message.channel.send(`Error: ${e.message ? e.message : e}`);
    }
  } else {
    logger.info(
      "Doesn't have playlist (how is this possible btw?): ",
      JSON.stringify(channelPlaylist)
    );
    const channelPlaylistCollection = store.get<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection
    );
    const playlist = createPlaylistObject(
      message.channel as Discord.TextChannel
    );
    store.set<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection,
      {
        ...channelPlaylistCollection,
        [playlist.channelId]: playlist,
      }
    );
    ForceUserPlaylistUpdateCommand(message);
  }
  return Promise.resolve();
};
