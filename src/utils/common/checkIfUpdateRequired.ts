import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import moment from "moment";
import { Config } from "../../types/config";
import { Playlist } from "../../types/playlist";

export default (playlist: Playlist): boolean => {
  const config = <Config>yaml.load(readFileSync("config.yml", "utf8"));
  return (
    playlist.lastUpdateDate &&
    moment(playlist.lastUpdateDate).isAfter(playlist.lastCommitDate) &&
    moment().isAfter(
      moment(playlist.lastCommitDate).add(
        config.playlistUpdateFrequency,
        "seconds"
      )
    )
  );
};
