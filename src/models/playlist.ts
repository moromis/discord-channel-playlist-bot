import * as Discord from "discord.js";

export interface Playlist {
    channelId: string;
    channelName: string;
    songUris: string[];
    lastCommitDate: string;
}

export namespace Playlist {
    export function create(channel: Discord.TextChannel): Playlist {
        return {
            channelId: channel.id,
            channelName: `${channel.guild.name} #${channel.name}`,
            songUris: [],
            lastCommitDate: new Date().toISOString()
        };
    }
}