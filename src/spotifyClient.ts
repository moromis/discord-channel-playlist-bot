import SpotifyWebApi from "spotify-web-api-node";
import yaml from "./utils/yaml";

export default (() => {
  const auth = yaml.getAuthConfig();
  return new SpotifyWebApi({
    clientId: auth.spotify.clientId,
    clientSecret: auth.spotify.clientSecret,
    redirectUri: auth.spotify.redirectUri,
  });
})();
