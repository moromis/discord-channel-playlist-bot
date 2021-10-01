import _ from "lodash";
import { getSubscriptions } from "../services/subscriptionsService";
import { getUserPlaylists } from "../services/userDataService";

export const isChannelSubscribedTo = (channelId: string): boolean => {
  const subscriptions = getSubscriptions() || {};
  return (
    _.findKey(subscriptions, channelId) && !_.isEmpty(subscriptions[channelId])
  );
};

export const getChannelPlaylistId = (
  channelId: string,
  spotifyUserId: string
): string | null => {
  const playlists = getUserPlaylists(spotifyUserId);
  return playlists?.[channelId] || null;
};
