import * as Discord from "discord.js";
import { readFileSync } from "fs";
import yaml from "js-yaml";
import * as _ from "lodash";
import Constants from "../../constants";
import { Auth } from "../../types/auth";
import { Command } from "../../types/command";
import createAuthorizationUrl from "../../utils/spotify/createAuthorizationUrl";

export const Strings = Constants.Strings.Commands.Authorize;

const AuthorizeCommand: Command = (message: Discord.Message) => {
  const auth = <Auth>yaml.load(readFileSync("auth.yml", "utf8"));
  message.channel.send(
    _.template(Strings.successResponse)({
      authorizationUrl: createAuthorizationUrl(auth.spotify.redirectUri),
    }),
    { reply: message.author }
  );
  return Promise.resolve();
};

export default AuthorizeCommand;
