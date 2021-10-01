import { Command } from "../types/command";
import { logger } from "../utils/logger";
import Commands from "./commands";

const getCommand = (commandName: string): Command | null => {
  if (Commands[commandName]) {
    return Commands[commandName];
  } else {
    // first try to find a match where the command starts with what we've been given
    let match = Object.keys(Commands).find((key) =>
      key.startsWith(commandName)
    );
    // if we can't find a match that way, then we'll see if anything includes it at all
    if (!match) {
      match = Object.keys(Commands).find((key) => key.includes(commandName));
    }
    if (Commands[match]) {
      return Commands[match];
    } else {
      logger.error("Command not found: ", commandName);
      return null;
    }
  }
};

export default getCommand;
