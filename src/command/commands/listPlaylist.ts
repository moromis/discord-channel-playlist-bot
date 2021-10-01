import * as Discord from "discord.js";
import * as _ from "lodash";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { getSpotifyUserId } from "../../services/spotifyService";
import { Command } from "../../types/command";
import { UserData } from "../../types/userData";

export const Strings = Constants.Strings.Commands.Authorize;

export const ListPlaylistCommand: Command = (message: Discord.Message) => {
  // Get all managed channel playlists
  const spotifyUserId = getSpotifyUserId(message.author.id);
  const userData = _.clone(
    store.get<UserData.Collection>(Constants.DataStore.Keys.userData) || {}
  );
  const channelId = message.channel.id;
  const userId = message.author.id;
  const playlists = userData[spotifyUserId]?.playlists;
  if (playlists && playlists[channelId]) {
    message.channel.send(
      `Looks like you have a playlist for this channel. Here it is:\nhttps://open.spotify.com/playlist/${
        playlists[message.channel.id]
      }`,
      {
        reply: userId,
      }
    );
  } else {
    message.channel.send("You don't have a playlist for this channel yet.", {
      reply: userId,
    });
  }
  return Promise.resolve();
};
