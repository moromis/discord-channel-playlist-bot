import { has, isEmpty } from "ramda";
import { getSubscriptions } from "../services/subscriptionsService";
import { getUserPlaylists } from "../services/userDataService";

export const isChannelSubscribedTo = (channelId: string): boolean => {
  const subscriptions = getSubscriptions() || {};
  return has(channelId, subscriptions) && !isEmpty(subscriptions[channelId]);
};

export const getChannelPlaylistId = (
  channelId: string,
  spotifyUserId: string
): string | null => {
  const playlists = getUserPlaylists(spotifyUserId);
  return playlists?.[channelId] || null;
};
