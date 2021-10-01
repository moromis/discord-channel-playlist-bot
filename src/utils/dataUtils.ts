import * as _ from "lodash";
import Constants from "../constants";
import { store } from "../dataStore";
import { SpotifyUser } from "../types/spotifyUser";
import { Subscription } from "../types/subscription";
import { UserData } from "../types/userData";

export const getSpotifyUserId = (id: string): string =>
  (store.get<SpotifyUser.LookupMap>(
    Constants.DataStore.Keys.spotifyUserLookupMap
  ) || {})[id];

export const isChannelSubscribedTo = (channelId: string): boolean => {
  const subscriptions = store.get<Subscription.Collection>(
    Constants.DataStore.Keys.subscriptions
  );

  return subscriptions ? Object.keys(subscriptions).includes(channelId) : false;
};

export const getChannelPlaylistId = (
  channelId: string,
  spotifyUserId: string
): string => {
  const userData = _.clone(
    store.get<UserData.Collection>(Constants.DataStore.Keys.userData) || {}
  );
  const playlists = userData[spotifyUserId]?.playlists;
  if (playlists) {
    return playlists[channelId];
  }
  return "";
};
