import { Message } from "discord.js";

export default async (content: string, message: Message): Promise<Message> => {
  return message.channel.send({
    content,
    reply: { messageReference: message },
  });
};
