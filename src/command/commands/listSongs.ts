import * as Discord from "discord.js";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { Command } from "../../types/command";
import { ChannelPlaylistCollection } from "../../types/playlist";
import sendReply from "../../utils/discord/sendReply";

export const ListSongsCommand: Command = async (message: Discord.Message) => {
  const channelPlaylistCollection =
    store.get<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection
    ) || {};
  const songs = channelPlaylistCollection[message.channel.id]?.songUris;
  if (songs) {
    const links = songs
      .slice(0, 3)
      .map(
        (songUri) => `https://open.spotify.com/track/${songUri.split(":")[2]}`
      );

    await sendReply(
      `Here's the ${links.length} most recent songs in the playlist.
${links.join("\n")}`,
      message
    );
  } else {
    await sendReply(
      "I don't know about any songs in this channel yet. (maybe try `get-historical`)",
      message
    );
  }
  return Promise.resolve();
};
