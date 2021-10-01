import * as Discord from "discord.js";
import * as _ from "lodash";
import { Command } from "../command";
import Constants from "../constants";
import spotifyUtils from "../utils/spotifyUtils";

export const Strings = Constants.Strings.Commands.Authorize;

export const AuthorizeCommand: Command = (message: Discord.Message) => {
  message.channel.send(
    _.template(Strings.successResponse)({
      authorizationUrl: spotifyUtils.createAuthorizationUrl(),
    }),
    { reply: message.author }
  );
  return Promise.resolve();
};
