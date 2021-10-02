import { DateTime } from "luxon";
import { Playlist } from "../../types/playlist";
import yaml from "../yaml";

export default (playlist: Playlist): boolean => {
  const config = yaml.getConfig();
  return (
    playlist.lastUpdateDate &&
    DateTime.fromISO(playlist.lastUpdateDate) >
      DateTime.fromISO(playlist.lastCommitDate) &&
    DateTime.now() >
      DateTime.fromISO(playlist.lastCommitDate).plus({
        seconds: config.playlistUpdateFrequency,
      })
  );
};
