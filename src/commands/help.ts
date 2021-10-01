import * as Discord from "discord.js";
import * as _ from "lodash";
import { Command } from "../command";
import { Commands } from "../commands";
import Constants from "../constants";

export const Strings = Constants.Strings.Commands.Help;

export const HelpCommand: Command = (message: Discord.Message) => {
  const commandList = _.reduce(
    Commands,
    (str, _command, name) => str + `\`${name}\`\r\n`,
    ""
  );

  message.channel.send(
    `${Strings.generalHelp[1]}

${Strings.generalHelp[2]}
    
${Strings.availableCommands}
${commandList}
PS: You can use the first letter of any of the commands preceded by an exclamation point: e.g. \`!a\``,
    { reply: message.author }
  );
  return Promise.resolve();
};
