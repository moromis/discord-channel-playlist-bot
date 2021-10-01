import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import Constants from "../../constants";
import { store } from "../../dataStore";
import { getUserData } from "../../services/userDataService";
import spotifyClient from "../../spotifyClient";
import { Config } from "../../types/config";
import { Playlist } from "../../types/playlist";
import { SpotifyUser } from "../../types/spotifyUser";
import { UserData } from "../../types/userData";
import { logger } from "../logger";

export default async (
  spotifyUserId: SpotifyUser.Id,
  playlist: Playlist
): Promise<void> => {
  const config = <Config>yaml.load(readFileSync("config.yml", "utf8"));
  const playlistName = `${playlist.channelName} - ${config.playlistName}`;
  const prevUserData = getUserData();
  if (
    !prevUserData[spotifyUserId] ||
    !(playlist.channelId in prevUserData[spotifyUserId])
  ) {
    try {
      const response = await spotifyClient.createPlaylist(playlistName);
      const spotifyPlaylistId = response.body.id;
      // we set here in preference to mutating as we may not havae playlists set up yet
      store.set<UserData.Collection>(Constants.DataStore.Keys.userData, {
        ...prevUserData,
        [spotifyUserId]: {
          playlists: {
            ...(prevUserData[spotifyUserId]?.playlists
              ? prevUserData[spotifyUserId].playlists
              : {}),
            [playlist.channelId]: spotifyPlaylistId,
          },
        },
      });
    } catch (e) {
      logger.error(
        `Error creating playlist for Spotify user ${spotifyUserId}: ${JSON.stringify(
          e
        )}`
      );
      return Promise.reject(e);
    }
  }
  return Promise.resolve();
};
