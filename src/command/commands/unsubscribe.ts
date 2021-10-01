import * as Discord from "discord.js";
import * as _ from "lodash";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { getSpotifyUserId } from "../../services/spotifyService";
import { Command } from "../../types/command";
import { SpotifyUser } from "../../types/spotifyUser";
import { Subscription } from "../../types/subscription";

export const strings = Constants.Strings.Commands.Unsubscribe;

export const UnsubscribeCommand: Command = (message: Discord.Message) => {
  const spotifyUserId = getSpotifyUserId(message.author.id);

  if (!spotifyUserId) {
    message.channel.send(strings.notSubscribed, { reply: message.author });
    return Promise.reject(`No known Spotify user ID for ${message.author.id}`);
  }

  const channelId = message.channel.id;
  const subs = store.get<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions
  );
  const ids: SpotifyUser.Id[] = subs[channelId] || [];

  if (!_.includes(ids, spotifyUserId)) {
    message.channel.send(strings.notSubscribed, { reply: message.author });
  } else {
    message.channel.send(strings.successResponse, { reply: message.author });
    store.mutate<Subscription.Collection>(
      Constants.DataStore.Keys.subscriptions,
      (collection) => {
        collection = collection || {};
        return {
          ...collection,
          [channelId]: collection[channelId]
            ? _.remove(collection[channelId], spotifyUserId)
            : [],
        };
      }
    );
  }
  return Promise.resolve();
};
