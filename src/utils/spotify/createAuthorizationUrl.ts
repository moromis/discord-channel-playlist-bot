import spotifyClient from "../../spotifyClient";

export default (redirectUri: string): string => {
  return spotifyClient.createAuthorizeURL(
    ["playlist-modify-public"],
    redirectUri
  );
};
