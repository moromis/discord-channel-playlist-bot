import * as Discord from "discord.js";
import * as _ from "lodash";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { Command } from "../../types/command";
import { ChannelPlaylistCollection } from "../../types/playlist";

export const Strings = Constants.Strings.Commands.Authorize;

export const ListSongsCommand: Command = (message: Discord.Message) => {
  const channelPlaylistCollection = _.clone(
    store.get<ChannelPlaylistCollection>(
      Constants.DataStore.Keys.channelPlaylistCollection
    ) || {}
  );
  const songs = channelPlaylistCollection[message.channel.id]?.songUris;
  const userId = message.author.id;
  if (songs) {
    const links = songs
      .slice(0, 3)
      .map(
        (songUri) => `https://open.spotify.com/track/${songUri.split(":")[2]}`
      );

    message.channel.send(
      `Here's the ${links.length} most recent songs in the playlist.
${links.join("\n")}`,
      {
        reply: userId,
      }
    );
  } else {
    message.channel.send("I don't know about any songs in this channel yet.", {
      reply: userId,
    });
  }
  return Promise.resolve();
};
