import * as Discord from "discord.js";
import { compact } from "ramda-adjunct";
import { Command } from "../../types/command";
import discordUtils from "../../utils/discordUtils";

const getHistorical: Command = async (message: Discord.Message) => {
  const discordChannel = message.channel;
  // Get all managed channel playlists
  discordChannel.send("Finding tasty tracks from the past...");
  try {
    const messages = await discordChannel.messages.fetch({ limit: 100 });
    compact(Array.from(messages.values())).forEach((m) =>
      discordUtils.extractAndProcessTracks(m)
    );
  } catch (e) {
    return Promise.reject(e);
  }
  return Promise.resolve();
};

export default getHistorical;
