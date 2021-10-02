import { DMChannel, Message } from "discord.js";
import Commands from "../command/commands";
import getCommand from "../command/getCommand";
import { MENTION_REGEX } from "../constants";
import isChannelSubscribedTo from "../utils/data/isChannelSubscribedTo";
import { messageManager } from "../utils/discord/MessageManager";
import discordUtils from "../utils/discordUtils";
import { logger } from "../utils/logger";
import { discordClient } from "./setupDiscordClient";

// TODO: test this function
const runCommand = async (message: Message): Promise<boolean> => {
  let allOk = true;
  // first, remove the mention if there is one
  const messageWithoutMention = message.content.replace(MENTION_REGEX, "");
  // then remove an exclamation mark if it's the first character in the string
  const messageWithotInitialBang =
    messageWithoutMention.charAt(0) === "!"
      ? messageWithoutMention.slice(1)
      : messageWithoutMention;
  // split the message into command and args based on whitespace
  const [command, ...args] = messageWithotInitialBang.split(/\s+/);
  // see if the command matches any known commands (otherwise assume we want to register an auth token)
  const maybeCommandFn = getCommand(command) || Commands["register-token"];
  // run the command
  await maybeCommandFn(message, ...args)
    .catch((e) => {
      allOk = false;
      logger.error(e);
    })
    .finally(async () => {
      await messageManager.cleanup(allOk, message);
    });

  return allOk;
};

export default async (message: Message): Promise<void> => {
  // the paths of this file are:

  // if bot is mentioned:
  // ---- run command that follows
  // if we see text preceded by !, with ! being the first character
  // ---- run command that follows !
  // if we're in a DM channel
  // ---- run command
  // in all cases and following commands if they occur (but should only occur after a command is run and should
  // also receive the result of the command -- its allOk), check the message
  // for Spotify links and parse/exec... or maybe don't do this if a command is run? That might solve things.

  // one more thing, if we don't find the command, but we believe there should be one, try just running register-token

  // that's it!
  const isBotMention: boolean = message.mentions.users.some(
    (user) => user.tag === discordClient.user.tag
  );

  if (
    isBotMention ||
    message.content.startsWith("!") ||
    message.channel instanceof DMChannel
  ) {
    // run command
    runCommand(message);
  } else {
    // check for spotify links
    if (isChannelSubscribedTo(message.channel.id)) {
      // Check for new tracks from users in the channel
      const songUris = await discordUtils.extractAndProcessTracks(message);
      if (songUris.length) {
        logger.info(`I found some tasty tracks!\n${songUris.join(", ")}`);
      }
    }
  }
};
