import * as Discord from "discord.js";
import { includes, reject } from "ramda";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { getSpotifyUserId } from "../../services/spotifyService";
import { Command } from "../../types/command";
import { SpotifyUser } from "../../types/spotifyUser";
import { Subscription } from "../../types/subscription";
import { messageManager } from "../../utils/discord/MessageManager";

export const strings = Constants.Strings.Commands.Unsubscribe;

export const UnsubscribeCommand: Command = async (message: Discord.Message) => {
  const spotifyUserId = getSpotifyUserId(message.author.id);

  if (!spotifyUserId) {
    await messageManager.reply(strings.notSubscribed, message);
    return Promise.reject(`No known Spotify user ID for ${message.author.id}`);
  }

  const channelId = message.channel.id;
  const subs = store.get<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions
  );
  const ids: SpotifyUser.Id[] = subs[channelId] || [];

  if (!includes(spotifyUserId)(ids)) {
    await messageManager.reply(strings.notSubscribed, message);
  } else {
    await messageManager.reply(strings.successResponse, message);
    store.mutate<Subscription.Collection>(
      Constants.DataStore.Keys.subscriptions,
      (collection) => {
        collection = collection || {};
        return {
          ...collection,
          [channelId]: collection[channelId]
            ? reject((val) => val === spotifyUserId, collection[channelId])
            : [],
        };
      }
    );
  }
  return Promise.resolve();
};
