import * as Discord from "discord.js";
import * as _ from "lodash";
import { Command } from "../command";
import Constants from "../constants";
import { store } from "../dataStore";
import { SpotifyUser } from "../types/spotifyUser";
import { Subscription } from "../types/subscription";

export const Strings = Constants.Strings.Commands.Unsubscribe;

export const UnsubscribeCommand: Command = (message: Discord.Message) => {
  const spotifyUserId = (store.get<SpotifyUser.LookupMap>(
    Constants.DataStore.Keys.spotifyUserLookupMap
  ) || {})[message.author.id];

  if (!spotifyUserId) {
    message.channel.send(Strings.notSubscribed, { reply: message.author });
    return;
  }

  let didUnsubscribe = true;

  store.mutate<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions,
    (collection) => {
      collection = collection || {};

      const channelId = message.channel.id;
      let idList: SpotifyUser.Id[] = collection[channelId] || [];

      if (!_.includes(idList, spotifyUserId)) {
        message.channel.send(Strings.notSubscribed, { reply: message.author });

        didUnsubscribe = false;
        return collection;
      }

      // Remove the user's Spotify ID from the subscription list
      idList = _.remove(idList, spotifyUserId);

      collection[channelId] = idList;
      return collection;
    }
  );

  if (didUnsubscribe) {
    message.channel.send(Strings.successResponse, { reply: message.author });
  }
};
