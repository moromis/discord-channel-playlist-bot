import * as SpotifyWebApi from "spotify-web-api-node";
import * as auth from "../auth.json";

export const spotifyClient = new SpotifyWebApi({
  clientId: auth.spotify.clientId,
  clientSecret: auth.spotify.clientSecret,
  redirectUri: auth.spotify.redirectUri,
});
