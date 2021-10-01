import * as Discord from "discord.js";
import * as _ from "lodash";
import { Command } from "../command";
import Constants from "../constants";
import { store } from "../dataStore";
import { SpotifyUser } from "../types/spotifyUser";
import { Subscription } from "../types/subscription";
import { getSpotifyUserId } from "../utils/dataUtils";

export const Strings = Constants.Strings.Commands.Subscribe;

export const SubscribeCommand: Command = (message: Discord.Message) => {
  const spotifyUserId = getSpotifyUserId(message.author.id);

  if (!spotifyUserId) {
    message.channel.send(
      `${Strings.unregisteredUserId[1]}\r\n${Strings.unregisteredUserId[2]}`,
      { reply: message.author }
    );
    return Promise.reject(`No known Spotify user ID for ${message.author.id}`);
  }

  const channelId = message.channel.id;
  const subs =
    store.get<Subscription.Collection>(
      Constants.DataStore.Keys.subscriptions
    ) || [];
  const ids: SpotifyUser.Id[] = subs[channelId] || [];

  if (_.includes(ids, spotifyUserId)) {
    message.channel.send(Strings.alreadySubscribed, {
      reply: message.author,
    });
  } else {
    message.channel.send(Strings.successResponse, { reply: message.author });
    store.mutate<Subscription.Collection>(
      Constants.DataStore.Keys.subscriptions,
      (collection) => {
        collection = collection || {};
        return {
          ...collection,
          [channelId]: collection[channelId]
            ? _.concat(collection[channelId], spotifyUserId)
            : [],
        };
      }
    );
  }
  return Promise.resolve();
};
