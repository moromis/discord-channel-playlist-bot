import * as Discord from "discord.js";
import * as _ from "lodash";
import Constants from "../../constants";
import { getSpotifyUserId } from "../../services/spotifyService";
import subscriptionsService, {
  getSubscriptions,
} from "../../services/subscriptionsService";
import { Command } from "../../types/command";
import { SpotifyUser } from "../../types/spotifyUser";

export const Strings = Constants.Strings.Commands.Subscribe;

export const SubscribeCommand: Command = (message: Discord.Message) => {
  const channelId = message.channel.id;
  const discordUserId = message.author.id;
  const spotifyUserId = getSpotifyUserId(discordUserId);

  if (!spotifyUserId) {
    message.channel.send(
      `${Strings.unregisteredUserId[1]}\r\n${Strings.unregisteredUserId[2]}`,
      { reply: message.author }
    );
    return Promise.reject(`No known Spotify user ID for ${discordUserId}`);
  }

  const subs = getSubscriptions();
  const ids: SpotifyUser.Id[] = subs[channelId] || [];

  if (_.includes(ids, spotifyUserId)) {
    message.channel.send(Strings.alreadySubscribed, {
      reply: message.author,
    });
  } else {
    message.channel.send(Strings.successResponse, { reply: message.author });
    subscriptionsService.addSubscription(channelId, discordUserId);
  }
  return Promise.resolve();
};
