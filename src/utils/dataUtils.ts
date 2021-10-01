import _ from "lodash";
import { getSubscriptions } from "../services/subscriptionsService";
import { getUserPlaylists } from "../services/userDataService";
import { logger } from "./logger";

export const isChannelSubscribedTo = (channelId: string): boolean => {
  const subscriptions = getSubscriptions() || {};
  logger.info(
    _.findKey(subscriptions, channelId),
    !_.isEmpty(subscriptions[channelId])
  );
  return (
    _.has(subscriptions, channelId) && !_.isEmpty(subscriptions[channelId])
  );
};

export const getChannelPlaylistId = (
  channelId: string,
  spotifyUserId: string
): string | null => {
  const playlists = getUserPlaylists(spotifyUserId);
  return playlists?.[channelId] || null;
};
