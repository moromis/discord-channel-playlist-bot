import * as Discord from "discord.js";
import * as moment from "moment";
import * as config from "../../config.json";
import { Playlist } from "../types/playlist";

function create(channel: Discord.TextChannel): Playlist {
  return {
    channelId: channel.id,
    channelName: `${channel.guild.name} #${channel.name}`,
    songUris: [],
    lastCommitDate: new Date().toISOString(),
  };
}

function requiresUpdate(playlist: Playlist): boolean {
  return (
    playlist.lastUpdateDate &&
    moment(playlist.lastUpdateDate).isAfter(playlist.lastCommitDate) &&
    moment().isAfter(
      moment(playlist.lastCommitDate).add(
        config.playlistUpdateFrequency,
        "seconds"
      )
    )
  );
}

export default {
  create,
  requiresUpdate,
};
