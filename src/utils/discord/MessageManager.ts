import { Message, TextBasedChannels } from "discord.js";
import { equals, isNil } from "ramda";
import { logger } from "../logger";

type AcceptableChannels = TextBasedChannels;

interface MessageManagerInterface {
  cleanup(allOk: boolean, userMessage?: Message): void;
  send(message: string, channel: AcceptableChannels): Promise<void>;
  reply(response: string, message: Message): Promise<void>;
  loadingMessage(channel: AcceptableChannels): Promise<void>;
}

export class MessageManager implements MessageManagerInterface {
  // private reactCache: MessageReaction = null;
  private userMessageCache: Message = null;
  private cache: Message = null;
  private loadingCache: Message = null;

  public async send(
    message: string,
    channel: AcceptableChannels
  ): Promise<void> {
    logger.info("sending: ", message);
    if (this.cache === null) {
      const discordMessage = await channel.send(message);
      this.cache = discordMessage;
    } else {
      await this.cache.edit(message).catch((e) => {
        // swallow errors, it might be that we're not in sync
        logger.error(e);
      });
    }
  }

  public async error(
    message: string,
    channel: AcceptableChannels
  ): Promise<void> {
    logger.info("sending error: ", message);
    await channel.send(
      `\`\`\`diff
ERROR:
- ${String(message).replaceAll("\n", "\n- ")}
\`\`\``
    );
  }

  public async reply(response: string, message: Message): Promise<void> {
    logger.info("replying with: ", response);
    if (message) {
      await message.reply(response).catch((e) => {
        this.error(e, message.channel);
      });
    }
  }

  // Testing animations via editing a message on an interval
  public async loadingMessage(channel: AcceptableChannels): Promise<void> {
    if (this.loadingCache === null) {
      const discordMessage = await channel.send(".");
      this.loadingCache = discordMessage;
    }
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    // eslint-disable-next-line no-constant-condition
    while (2 === 2) {
      const newMessage =
        this.loadingCache.content.length >= 10
          ? "."
          : this.loadingCache.content + ".";
      this.loadingCache = await this.loadingCache.edit(newMessage);
      await sleep(500);
    }
  }

  private async clearCache(): Promise<void> {
    this.cache = null;
    this.loadingCache = null;
  }

  public async cleanup(allOk: boolean, userMessage?: Message): Promise<void> {
    if (this.userMessageCache !== userMessage && !isNil(userMessage)) {
      this.userMessageCache = userMessage;
    }
    if (allOk) {
      if (this.cache) {
        if (equals(this.cache.id, this.userMessageCache.id)) {
          await this.error(
            "Cached message and user message are the same. Very bad.",
            this.userMessageCache.channel
          );
          return Promise.reject();
        }
        await this.cache.delete().catch(async (e) => {
          if (this.userMessageCache) {
            await this.error(e, userMessage.channel);
          }
        });
      }
      if (this.userMessageCache) {
        // TODO: fix, permissions issue. Alternatively just
        //       fix command reactions preceding index uploading the playlist... maybe?
        // if (this.reactCache) {
        //   logger.info("removing previous reaction");
        //   await this.reactCache.remove();
        // }
        await this.userMessageCache
          .react("✅")
          // .then((reaction) => {
          //   this.reactCache = reaction;
          // })
          .catch(async (e) => {
            await this.error(e, this.userMessageCache.channel);
          });
      }
    } else {
      logger.info("got false for allOk");
      if (this.userMessageCache) {
        // TODO: fix, permissions issue. Alternatively just
        //       fix command reactions preceding index uploading the playlist... maybe?
        // if (this.reactCache) {
        //   logger.info("removing previous reaction");
        //   await this.reactCache.remove();
        // }
        await this.userMessageCache
          .react("🚫")
          // .then((reaction) => {
          //   this.reactCache = reaction;
          // })
          .catch(async (e) => {
            await this.error(e, this.userMessageCache.channel);
          });
      }
    }
    await this.clearCache();
  }
}

export const messageManager: MessageManager = new MessageManager();
