import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import { DateTime } from "luxon";
import { Config } from "../../types/config";
import { Playlist } from "../../types/playlist";

export default (playlist: Playlist): boolean => {
  const config = <Config>yaml.load(readFileSync("config.yml", "utf8"));
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
