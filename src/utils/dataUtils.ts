import Constants from "../constants";
import { store } from "../dataStore";
import { Subscription } from "../types/subscription";

function isChannelSubscribedTo(channelId: string): boolean {
  const subscriptions = store.get<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions
  );

  return subscriptions ? Object.keys(subscriptions).includes(channelId) : false;
}

export default { isChannelSubscribedTo };
