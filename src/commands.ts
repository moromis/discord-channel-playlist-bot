import { Command } from "./command";
import { AuthorizeCommand } from "./commands/authorize";
import { ForceUserPlaylistUpdateCommand } from "./commands/forceUpdate";
import { HelpCommand } from "./commands/help";
import { ListPlaylistCommand } from "./commands/listPlaylist";
import { ListSongsCommand } from "./commands/listSongs";
import { RegisterTokenCommand } from "./commands/registerToken";
import { SubscribeCommand } from "./commands/subscribe";
import { UnsubscribeCommand } from "./commands/unsubscribe";
import { logger } from "./logger";

export const Commands: { [commandName: string]: Command } = {
  authorize: AuthorizeCommand,
  help: HelpCommand,
  "register-token": RegisterTokenCommand,
  subscribe: SubscribeCommand,
  unsubscribe: UnsubscribeCommand,
  "force-update": ForceUserPlaylistUpdateCommand,
  "list-playlist": ListPlaylistCommand,
  "list-songs": ListSongsCommand,
};

export const getCommand = (commandName: string): Command | null => {
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
