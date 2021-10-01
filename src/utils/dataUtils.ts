import { getSubscriptions } from "../services/subscriptionsService";
import { getUserPlaylists } from "../services/userDataService";

export const isChannelSubscribedTo = (channelId: string): boolean => {
  const subscriptions = getSubscriptions();
  return subscriptions ? Object.keys(subscriptions).includes(channelId) : false;
};

export const getChannelPlaylistId = (
  channelId: string,
  spotifyUserId: string
): string | null => {
  const playlists = getUserPlaylists(spotifyUserId);
  return playlists?.[channelId] || null;
};
