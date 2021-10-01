import Discord from "discord.js";
import { Playlist } from "../../types/playlist";

export default (channel: Discord.TextChannel): Playlist => {
  return {
    channelId: channel.id,
    channelName: `${channel.guild.name} #${channel.name}`,
    songUris: [],
    lastCommitDate: new Date().toISOString(),
  };
};
