import _ from "lodash";
import Constants from "../constants";
import { store } from "../dataStore";
import { Subscription } from "../types/subscription";

export const getSubscriptions = (): Subscription.Collection => {
  return _.clone(
    store.get<Subscription.Collection>(
      Constants.DataStore.Keys.subscriptions
    ) || {}
  );
};
