import * as Discord from "discord.js";
import { flatten } from "ramda";
import { compact } from "ramda-adjunct";
import { Command } from "../../types/command";
import { messageManager } from "../../utils/discord/MessageManager";
import discordUtils from "../../utils/discordUtils";

const getHistorical: Command = async (
  message: Discord.Message,
  date?: string
) => {
  const discordChannel = message.channel;
  // Get all managed channel playlists
  await messageManager.send(
    "Finding tasty tracks from the past...",
    discordChannel
  );
  if (date) {
    // ...
  } else {
    await discordChannel.messages
      .fetch({ limit: 100 })
      .then(async (messages) => {
        await Promise.all(
          Array.from(messages.values()).map((m) =>
            discordUtils.extractAndProcessTracks(m)
          )
        )
          .catch((e) => {
            return Promise.reject(e);
          })
          .then(async (res) => {
            const results = compact(flatten(res));
            if (results.length === 0) {
              await messageManager.error("Nothing found.", discordChannel);
              return Promise.reject("Nothing found");
            }
            return Promise.resolve();
          });
      })
      .catch((e) => {
        return Promise.reject(e);
      });
  }
  return Promise.resolve();
};

export default getHistorical;
