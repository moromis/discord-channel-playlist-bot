import { path } from "ramda";
import Constants from "../constants";
import { store } from "../dataStore";
import { PlaylistCollection, UserData } from "../types/userData";

export const getUserData = (): UserData.Collection => {
  return (
    store.get<UserData.Collection>(Constants.DataStore.Keys.userData) || {}
  );
};

export function getUserPlaylists(spotifyUserId: string): PlaylistCollection {
  const userDataStore = getUserData();
  return path([spotifyUserId, "playlists"], userDataStore) || {};
}
