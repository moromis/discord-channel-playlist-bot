import {
  ChannelLogsQueryOptions,
  Message,
  TextBasedChannels,
} from "discord.js";
import { DateTime } from "luxon";
import { concat, last } from "ramda";
import { Command } from "../../types/command";
import { messageManager } from "../../utils/discord/MessageManager";
import discordUtils from "../../utils/discordUtils";
import { logger } from "../../utils/logger";

const getMessages = async (
  discordChannel: TextBasedChannels,
  options: ChannelLogsQueryOptions = {}
): Promise<null | Message[]> => {
  let results: Message[] = null;
  await discordChannel.messages.fetch(options).then((messages) => {
    results = Array.from(messages.values());
  });
  return Promise.resolve(results);
};

const getMessagesAndProcess = async (
  discordChannel: TextBasedChannels,
  dateString: string
): Promise<void> => {
  const jsDate = DateTime.fromJSDate(new Date(dateString));
  let latestResult: Message | void = {
    createdTimestamp: Date.now(),
  } as Message;
  // accumulate messages
  let allResults = [] as Message[];
  do {
    const results = await getMessages(discordChannel, {
      limit: 100,
      ...(latestResult ? { before: latestResult.id } : {}),
    }).catch((e) => logger.error(e));
    allResults = concat(allResults, results);
    latestResult = last<Message>(results);
    logger.info("latest: ", latestResult);
  } while (
    latestResult &&
    DateTime.fromISO(new Date(latestResult.createdTimestamp).toISOString()) >
      jsDate
  );
  logger.info("total messages fetched: ", allResults.length);
  await Promise.all(
    allResults.map((m) => discordUtils.extractAndProcessTracks(m))
  );
  return Promise.resolve();
};

const getHistorical: Command = async (message: Message, date?: string) => {
  const discordChannel = message.channel;
  // Get all managed channel playlists
  await messageManager.send(
    "Finding tasty tracks from the past...",
    discordChannel
  );
  // Go backwards in message history till we reach the date we're going till
  await getMessagesAndProcess(
    discordChannel,
    date ? date : DateTime.now().minus({ days: 7 }).toISO()
  ).catch((e) => messageManager.error(e, discordChannel));
  return Promise.resolve();
};

export default getHistorical;
