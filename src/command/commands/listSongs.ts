import * as Discord from "discord.js";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { Command } from "../../types/command";
import { ChannelPlaylistCollection } from "../../types/playlist";
import { messageManager } from "../../utils/discord/MessageManager";

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

    await messageManager.reply(
      `Here's the ${links.length} most recent songs in the playlist.
${links.join("\n")}`,
      message
    );
  } else {
    await messageManager.reply(Constants.Strings.noTracks, message);
  }
  return Promise.resolve();
};
