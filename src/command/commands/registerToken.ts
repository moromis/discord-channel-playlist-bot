import * as Discord from "discord.js";
import { DateTime } from "luxon";
import Constants, { MENTION_REGEX } from "../../constants";
import { store } from "../../dataStore";
import spotifyClient from "../../spotifyClient";
import { Command } from "../../types/command";
import { SpotifyUser } from "../../types/spotifyUser";
import { UserAuth } from "../../types/userAuth";
import { messageManager } from "../../utils/discord/MessageManager";
import { logger } from "../../utils/logger";

export const Strings = Constants.Strings.Commands.RegisterToken;

export const RegisterTokenCommand: Command = async (
  message: Discord.Message,
  authCode: string
) => {
  // figure out what/where our auth code is
  const messageWithoutMention = message.content.replace(MENTION_REGEX, "");
  const _authCode = authCode ? authCode : messageWithoutMention;

  if (!_authCode) {
    await messageManager.reply(Strings.missingToken, message);
    return Promise.reject();
  }

  // Retrieve an access token and a refresh token
  let data;
  try {
    data = await spotifyClient.authorizationCodeGrant(_authCode);
  } catch (e) {
    await messageManager.reply(Strings.invalidToken, message);

    logger.error(e);
    return Promise.reject(e);
  }

  const accessToken: string = data.body.access_token;
  const refreshToken: string = data.body.refresh_token;
  const expirationDate: string = DateTime.now()
    .plus({ seconds: data.body.expires_in })
    .toISO();

  // Set the access token on the API object to use it in later calls
  spotifyClient.setAccessToken(accessToken);
  spotifyClient.setRefreshToken(refreshToken);

  let meResponse;
  try {
    meResponse = await spotifyClient.getMe();
  } catch (e) {
    await messageManager.error(Strings.invalidToken, message.channel);

    logger.error(e);
    return Promise.reject(e);
  }

  const spotifyUserId: SpotifyUser.Id = meResponse.body.id;

  // Store the token for the user
  store.mutate<UserAuth.Collection>(
    Constants.DataStore.Keys.userAuthCollection,
    (collection) => {
      collection = collection || {};
      collection[spotifyUserId] = {
        accessToken,
        refreshToken,
        expirationDate,
      };

      return collection;
    }
  );

  // Update the Spotify user lookup table
  store.mutate<SpotifyUser.LookupMap>(
    Constants.DataStore.Keys.spotifyUserLookupMap,
    (map) => {
      map = map || {};
      map[message.author.id] = spotifyUserId;
      return map;
    }
  );

  await messageManager.reply(Strings.successResponse, message);
  return Promise.resolve();
};
