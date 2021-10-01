import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import SpotifyWebApi from "spotify-web-api-node";
import { Auth } from "./types/auth";

export default (() => {
  const auth = <Auth>yaml.load(readFileSync("auth.yml", "utf8"));
  return new SpotifyWebApi({
    clientId: auth.spotify.clientId,
    clientSecret: auth.spotify.clientSecret,
    redirectUri: auth.spotify.redirectUri,
  });
})();
