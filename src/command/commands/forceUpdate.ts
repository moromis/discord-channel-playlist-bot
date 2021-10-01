import * as Discord from "discord.js";
import * as _ from "lodash";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { logger } from "../../logger";
import { Command } from "../../types/command";
import { ChannelPlaylistCollection, Playlist } from "../../types/playlist";
import { Subscription } from "../../types/subscription";
import playlistUtils from "../../utils/baseUtils";
import spotifyUtils from "../../utils/spotifyUtils";

export const Strings = Constants.Strings.Commands.ForceUserPlaylistUpdate;

export const ForceUserPlaylistUpdateCommand: Command = async (
  message: Discord.Message
) => {
  // make sure someone is subscribed.
  const subs = store.get<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions
  );
  if (_.isEmpty(subs[message.channel.id])) {
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
      message.channel.send(Strings.successResponse);
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
    const playlist = playlistUtils.create(
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
