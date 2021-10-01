import * as Discord from "discord.js";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { getSpotifyUserId } from "../../services/spotifyService";
import { Command } from "../../types/command";
import { UserData } from "../../types/userData";
import sendReply from "../../utils/discord/sendReply";

export const ListPlaylistCommand: Command = async (
  message: Discord.Message
) => {
  // Get all managed channel playlists
  const spotifyUserId = getSpotifyUserId(message.author.id);
  const userData =
    store.get<UserData.Collection>(Constants.DataStore.Keys.userData) || {};
  const channelId = message.channel.id;
  const playlists = userData[spotifyUserId]?.playlists;
  if (playlists && playlists[channelId]) {
    await sendReply(
      `Looks like you have a playlist for this channel. Here it is:\nhttps://open.spotify.com/playlist/${
        playlists[message.channel.id]
      }`,
      message
    );
  } else {
    await sendReply("You don't have a playlist for this channel yet.", message);
  }
  return Promise.resolve();
};
