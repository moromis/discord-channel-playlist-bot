import * as Discord from "discord.js";
import { readFileSync } from "fs";
import yaml from "js-yaml";
import { Auth } from "../../types/auth";
import { Command } from "../../types/command";
import { messageManager } from "../../utils/discord/MessageManager";
import createAuthorizationUrl from "../../utils/spotify/createAuthorizationUrl";

const authorizeMessageTemplateFunc = (url) => `
To authorize me to manage your channel playlists, follow this link: ${url}
Please note that you **must** send me the authorization token you receive via a direct message.`;

const AuthorizeCommand: Command = async (message: Discord.Message) => {
  const auth = <Auth>yaml.load(readFileSync("auth.yml", "utf8"));
  await messageManager.reply(
    authorizeMessageTemplateFunc(
      createAuthorizationUrl(auth.spotify.redirectUri)
    ),
    message
  );
  return Promise.resolve();
};

export default AuthorizeCommand;
