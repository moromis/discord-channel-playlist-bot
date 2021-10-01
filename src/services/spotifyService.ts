import _ from "lodash";
import Constants from "../constants";
import { store } from "../dataStore";
import { SpotifyUser } from "../types/spotifyUser";
import { PlaylistCollection, UserData } from "../types/userData";

export const getSpotifyUserId = (discordId: string): string =>
  (store.get<SpotifyUser.LookupMap>(
    Constants.DataStore.Keys.spotifyUserLookupMap
  ) || {})[discordId];

export function getSpotifyPlaylists(userId: string): PlaylistCollection {
  const userDataStore = _.clone(
    store.get<UserData.Collection>(Constants.DataStore.Keys.userData) || {}
  );
  let userData = userDataStore[userId];

  if (!userData) {
    userData = userDataStore[userId] = {};
  }

  if (!userData.playlists) {
    userData.playlists = {};
  }

  return userData.playlists;
}

export default {
  getSpotifyUserId,
  getSpotifyPlaylists,
};
