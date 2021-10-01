import * as Discord from "discord.js";
import { includes } from "ramda";
import Constants from "../../constants";
import { getSpotifyUserId } from "../../services/spotifyService";
import subscriptionsService, {
  getSubscriptions,
} from "../../services/subscriptionsService";
import { Command } from "../../types/command";
import { SpotifyUser } from "../../types/spotifyUser";
import sendReply from "../../utils/discord/sendReply";
import { logger } from "../../utils/logger";

export const Strings = Constants.Strings.Commands.Subscribe;

export const SubscribeCommand: Command = async (message: Discord.Message) => {
  const channelId = message.channel.id;
  const discordUserId = message.author.id;
  const spotifyUserId = getSpotifyUserId(discordUserId);

  if (!spotifyUserId) {
    await sendReply(
      `${Strings.unregisteredUserId[1]}\r\n${Strings.unregisteredUserId[2]}`,
      message
    );
    return Promise.reject(`No known Spotify user ID for ${discordUserId}`);
  }

  const subs = getSubscriptions();
  const ids: SpotifyUser.Id[] = subs[channelId] || [];

  if (includes(spotifyUserId)(ids)) {
    await sendReply(Strings.alreadySubscribed, message);
  } else {
    logger.info(`New subscription: ${message.member.displayName}`);
    await sendReply(Strings.successResponse, message);
    subscriptionsService.addSubscription(channelId, spotifyUserId);
  }
  return Promise.resolve();
};
