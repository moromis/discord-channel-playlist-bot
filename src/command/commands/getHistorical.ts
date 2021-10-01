import * as Discord from "discord.js";
import _ from "lodash";
import { Command } from "../../types/command";
import discordUtils from "../../utils/discordUtils";

const getHistorical: Command = async (message: Discord.Message) => {
  const discordChannel = message.channel;
  // Get all managed channel playlists
  discordChannel.send("Finding tasty tracks from the past...");
  try {
    const messages = await discordChannel.fetchMessages({ limit: 100 });
    _.compact(Array.from(messages.values())).forEach((m) =>
      discordUtils.extractAndProcessTracks(m)
    );
  } catch (e) {
    return Promise.reject(e);
  }
  return Promise.resolve();
};

export default getHistorical;
