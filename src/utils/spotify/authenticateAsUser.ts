import { DateTime } from "luxon";
import Constants, { SpotifyAuthenticationErrors } from "../../constants";
import { store } from "../../dataStore";
import authService from "../../services/authService";
import spotifyClient from "../../spotifyClient";
import { SpotifyUser } from "../../types/spotifyUser";
import { UserAuth, UserAuthType } from "../../types/userAuth";
import { logger } from "../logger";

async function refreshAccessToken(auth: UserAuthType): Promise<{
  accessToken: string;
  refreshToken: string;
  expirationDate: string;
}> {
  spotifyClient.setAccessToken(auth.accessToken);
  spotifyClient.setRefreshToken(auth.refreshToken);

  let data;
  try {
    data = await spotifyClient.refreshAccessToken();
  } catch (e) {
    logger.error(`Error refreshing access token: ${JSON.stringify(e)}`);
    return Promise.reject(e);
  }

  const accessToken = data.body.access_token;
  const expirationDate = DateTime.now()
    .plus({ seconds: data.body.expires_in })
    .toISO();
  const refreshToken = data.body.refresh_token;
  return Promise.resolve({ accessToken, refreshToken, expirationDate });
}

export default async (spotifyUserId: SpotifyUser.Id): Promise<void> => {
  const authStore = authService.getAuthStore();
  const record: UserAuthType = authStore[spotifyUserId];

  if (!record) {
    return Promise.reject(SpotifyAuthenticationErrors.NOT_AUTHORIZED);
  }

  if (DateTime.now() > DateTime.fromISO(record.expirationDate)) {
    try {
      // Refresh the user's access token
      const { accessToken, refreshToken, expirationDate } =
        await refreshAccessToken(record);

      // Update the store
      store.mutate<UserAuth.Collection>(
        Constants.DataStore.Keys.userAuthCollection,
        (collection) => ({
          ...collection,
          [spotifyUserId]: {
            accessToken,
            refreshToken,
            expirationDate,
          },
        })
      );
      record.accessToken = accessToken;
      record.expirationDate = expirationDate;
    } catch (_e) {
      return Promise.reject(SpotifyAuthenticationErrors.INVALID_TOKEN);
    }
  }

  spotifyClient.setAccessToken(record.accessToken);
  spotifyClient.setRefreshToken(record.refreshToken);
  return Promise.resolve();
};
