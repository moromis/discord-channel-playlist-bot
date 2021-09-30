import { Command } from "./command";
import { AuthorizeCommand } from "./commands/authorize";
import { ForceUserPlaylistUpdateCommand } from "./commands/force-user-playlist-update";
import { HelpCommand } from "./commands/help";
import { RegisterTokenCommand } from "./commands/register-token";
import { SubscribeCommand } from "./commands/subscribe";
import { UnsubscribeCommand } from "./commands/unsubscribe";

export const Commands: { [commandName: string]: Command } = {
    "authorize": AuthorizeCommand,
    "help": HelpCommand,
    "register-token": RegisterTokenCommand,
    "subscribe": SubscribeCommand,
    "unsubscribe": UnsubscribeCommand,
    "force-update": ForceUserPlaylistUpdateCommand
};