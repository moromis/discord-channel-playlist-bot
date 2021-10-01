import moment from "moment";
import Constants, { SpotifyAuthenticationErrors } from "../../constants";
import { store } from "../../dataStore";
import spotifyClient from "../../spotifyClient";
import { SpotifyUser } from "../../types/spotifyUser";
import { UserAuth, UserAuthType } from "../../types/userAuth";
import { logger } from "../logger";

async function refreshAccessToken(auth: UserAuthType): Promise<void> {
  spotifyClient.setAccessToken(auth.accessToken);
  spotifyClient.setRefreshToken(auth.refreshToken);

  let data;
  try {
    data = await spotifyClient.refreshAccessToken();
  } catch (e) {
    logger.error(`Error refreshing access token: ${JSON.stringify(e)}`);
    return Promise.reject(e);
  }

  auth.accessToken = data.body.access_token;
  auth.expirationDate = moment()
    .add(data.body.expires_in, "seconds")
    .toISOString();
  return Promise.resolve();
}

export default async (spotifyUserId: SpotifyUser.Id): Promise<void> => {
  const authCollection = store.get<UserAuth.Collection>(
    Constants.DataStore.Keys.userAuthCollection
  );
  const record: UserAuthType = authCollection[spotifyUserId];

  if (!record) {
    return Promise.reject(SpotifyAuthenticationErrors.NOT_AUTHORIZED);
  }

  if (moment().isAfter(record.expirationDate)) {
    try {
      // Refresh the user's access token
      await refreshAccessToken(record);

      // Update the store
      store.set<UserAuth.Collection>(
        Constants.DataStore.Keys.userAuthCollection,
        authCollection
      );
    } catch (_e) {
      return Promise.reject(SpotifyAuthenticationErrors.INVALID_TOKEN);
    }
  }

  spotifyClient.setAccessToken(record.accessToken);
  spotifyClient.setRefreshToken(record.refreshToken);
  return Promise.resolve();
};
