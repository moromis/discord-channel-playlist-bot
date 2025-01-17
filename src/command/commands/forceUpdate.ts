import { Message, TextChannel } from "discord.js";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { Command } from "../../types/command";
import { ChannelPlaylistCollection, Playlist } from "../../types/playlist";
import createPlaylistObject from "../../utils/common/createPlaylistObject";
import isChannelSubscribedTo from "../../utils/data/isChannelSubscribedTo";
import { messageManager } from "../../utils/discord/MessageManager";
import { logger } from "../../utils/logger";
import updateChannelPlaylist from "../../utils/spotify/updateChannelPlaylist";

export const ForceUserPlaylistUpdateCommand: Command = async (
  message: Message
) => {
  await messageManager.send("Forcing update...", message.channel);
  return doUpdate(message);
};

const doUpdate: Command = async (message: Message) => {
  // make sure someone is subscribed.
  if (!isChannelSubscribedTo(message.channel.id)) {
    const rejectionMessage = Constants.Strings.noSubscriptions;
    await messageManager.error(rejectionMessage, message.channel);
    return Promise.reject(rejectionMessage);
  }
  const channelId = message.channel.id;
  const channelPlaylistCollection =
    store.get<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection
    ) || {};
  const channelPlaylist: Playlist = channelPlaylistCollection[channelId];

  if (channelPlaylist) {
    logger.info("Does have playlist: ", JSON.stringify(channelPlaylist));
    try {
      await updateChannelPlaylist(channelPlaylist, message.channel);
    } catch (e) {
      logger.error("Error: ", e);
      await messageManager.error(
        `Error: ${e.message ? e.message : e}`,
        message.channel
      );
    }
  } else {
    logger.info(
      "Doesn't have playlist (how is this possible btw?): ",
      JSON.stringify(channelPlaylist)
    );
    const channelPlaylistCollection = store.get<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection
    );
    const playlist = createPlaylistObject(message.channel as TextChannel);
    store.set<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection,
      {
        ...channelPlaylistCollection,
        [playlist.channelId]: playlist,
      }
    );
    doUpdate(message);
  }
  return Promise.resolve();
};
