import * as Discord from "discord.js";
import * as _ from "lodash";
import { Command } from "../command";
import Constants from "../constants";
import { store } from "../dataStore";
import { SpotifyUser } from "../types/spotifyUser";
import { Subscription } from "../types/subscription";

export const Strings = Constants.Strings.Commands.Subscribe;

export const SubscribeCommand: Command = (message: Discord.Message) => {
  const spotifyUserId = (store.get<SpotifyUser.LookupMap>(
    Constants.DataStore.Keys.spotifyUserLookupMap
  ) || {})[message.author.id];

  if (!spotifyUserId) {
    message.channel.send(
      `${Strings.unregisteredUserId[1]}\r\n${Strings.unregisteredUserId[2]}`,
      { reply: message.author }
    );
    return;
  }

  let didSubscribe = true;

  store.mutate<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions,
    (collection) => {
      collection = collection || {};

      const channelId = message.channel.id;
      const idList: SpotifyUser.Id[] = collection[channelId] || [];

      if (_.includes(idList, spotifyUserId)) {
        message.channel.send(Strings.alreadySubscribed, {
          reply: message.author,
        });

        didSubscribe = false;
        return collection;
      }

      // Add the user's Spotify ID to the subscription list
      idList.push(spotifyUserId);

      collection[channelId] = idList;
      return collection;
    }
  );

  if (didSubscribe) {
    message.channel.send(Strings.successResponse, { reply: message.author });
  }
};
