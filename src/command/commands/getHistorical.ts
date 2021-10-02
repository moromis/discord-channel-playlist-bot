import {
  ChannelLogsQueryOptions,
  Message,
  TextBasedChannels,
} from "discord.js";
import { DateTime } from "luxon";
import { flatten, last } from "ramda";
import { compact } from "ramda-adjunct";
import { Command } from "../../types/command";
import { messageManager } from "../../utils/discord/MessageManager";
import discordUtils from "../../utils/discordUtils";
import { logger } from "../../utils/logger";

const getMessagesAndProcess = async (
  discordChannel: TextBasedChannels,
  options: ChannelLogsQueryOptions = {}
): Promise<null | Message> => {
  let latest: Message = null;
  await discordChannel.messages
    .fetch(options)
    .then(async (messages) => {
      latest = last(Array.from(messages.values()));
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
  return Promise.resolve(latest);
};

const getHistorical: Command = async (message: Message, date?: string) => {
  const discordChannel = message.channel;
  // Get all managed channel playlists
  await messageManager.send(
    "Finding tasty tracks from the past...",
    discordChannel
  );
  if (date) {
    // Go backwards in message history till we reach the passed date
    const jsDate = DateTime.fromJSDate(new Date(date));
    let latestResult: Message | void = {
      createdTimestamp: Date.now(),
    } as Message;
    // TODO: wrong, don't process till we have all the messages, otherwise it updates the playlist
    //       every time we fetch...
    do {
      latestResult = await getMessagesAndProcess(discordChannel, {
        limit: 100,
        ...(latestResult ? { before: latestResult.id } : {}),
      }).catch((e) => logger.error(e));
      logger.info("latest: ", latestResult);
    } while (
      latestResult &&
      DateTime.fromISO(new Date(latestResult.createdTimestamp).toISOString()) >
        jsDate
    );
  } else {
    await getMessagesAndProcess(discordChannel);
  }
  return Promise.resolve();
};

export default getHistorical;
