import { Command } from "../../types/command";
import AuthorizeCommand from "./authorize";
import { ForceUserPlaylistUpdateCommand } from "./forceUpdate";
import getHistorical from "./getHistorical";
import { HelpCommand } from "./help";
import { ListPlaylistCommand } from "./listPlaylist";
import { ListSongsCommand } from "./listSongs";
import { RegisterTokenCommand } from "./registerToken";
import { SubscribeCommand } from "./subscribe";
import { UnsubscribeCommand } from "./unsubscribe";

const Commands: { [commandName: string]: Command } = {
  authorize: AuthorizeCommand,
  help: HelpCommand,
  "register-token": RegisterTokenCommand,
  subscribe: SubscribeCommand,
  unsubscribe: UnsubscribeCommand,
  "force-update": ForceUserPlaylistUpdateCommand,
  "list-playlist": ListPlaylistCommand,
  "list-songs": ListSongsCommand,
  "get-historical": getHistorical,
};

export default Commands;
