import { append } from "ramda";
import Constants from "../constants";
import { store } from "../dataStore";
import { Subscription } from "../types/subscription";

export const getSubscriptions = (): Subscription.Collection => {
  return (
    store.get<Subscription.Collection>(
      Constants.DataStore.Keys.subscriptions
    ) || {}
  );
};

export const addSubscription = (
  channelId: string,
  spotifyUserId: string
): void => {
  store.mutate<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions,
    (collection) => {
      collection = collection || {};
      return {
        ...collection,
        [channelId]: collection[channelId]
          ? append(spotifyUserId, collection[channelId])
          : [spotifyUserId],
      };
    }
  );
};

export default {
  getSubscriptions,
  addSubscription,
};
