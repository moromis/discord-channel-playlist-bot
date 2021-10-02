import { Client, DMChannel, Intents, TextChannel } from "discord.js";
import { env } from "process";
import { logger } from "../utils/logger";
import yaml from "../utils/yaml";
import checkMessage from "./checkDiscordMessage";
import watchForChannelPlaylistUpdates from "./watchForChannelPlaylistUpdates";

export const discordClient: Client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
  partials: ["CHANNEL"],
});

export default (): void => {
  // load the auth file
  const auth = yaml.getAuthConfig();

  discordClient.on("error", logger.error);

  // login
  discordClient.login(auth.discord.token);

  discordClient.on("ready", () => {
    logger.info(`Logged in as ${discordClient.user.tag}`);

    // Manage all channels' playlists
    watchForChannelPlaylistUpdates();
  });

  discordClient.on("message", async (message) => {
    // Analyze each user message that comes in
    const channel = <TextChannel>message.channel;
    if (
      (!env.LOCAL ||
        (channel && channel.name && channel.name.includes("test")) ||
        message.channel instanceof DMChannel) &&
      message.author.id !== discordClient.user.id
    ) {
      await checkMessage(message);
    }
  });
};
