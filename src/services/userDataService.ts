import * as _ from "lodash";
import Constants from "../constants";
import { store } from "../dataStore";
import { PlaylistCollection, UserData } from "../types/userData";

export const getUserData = (): UserData.Collection => {
  return _.clone(
    store.get<UserData.Collection>(Constants.DataStore.Keys.userData) || {}
  );
};

export function getUserPlaylists(spotifyUserId: string): PlaylistCollection {
  const userDataStore = getUserData();
  return _.get(userDataStore, [spotifyUserId, "playlists"], {});
}
