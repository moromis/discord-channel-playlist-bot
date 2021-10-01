import * as Discord from "discord.js";
import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import * as moment from "moment";
import { Config } from "../types/config";
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
  const config = <Config>yaml.load(readFileSync("config.yml", "utf8"));
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
