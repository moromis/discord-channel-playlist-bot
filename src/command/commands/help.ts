import * as Discord from "discord.js";
import Commands from ".";
import Constants from "../../constants";
import { Command } from "../../types/command";
import sendReply from "../../utils/discord/sendReply";

export const Strings = Constants.Strings.Commands.Help;

export const HelpCommand: Command = async (message: Discord.Message) => {
  const commandList = Object.keys(Commands)
    .map((key) => `\`${key}\``)
    .join("\n");
  const messageContent = `${Strings.generalHelp}
    
${Strings.availableCommands}
${commandList}
PS: You can use the first letter of any of the commands preceded by an exclamation point: e.g. \`!a\``;

  await sendReply(messageContent, message);
  return Promise.resolve();
};
