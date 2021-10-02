import { getUserPlaylists } from "../../services/userDataService";

const getChannelPlaylistId = (
    channelId: string,
    spotifyUserId: string
  ): string | null => {
    const playlists = getUserPlaylists(spotifyUserId);
    return playlists?.[channelId] || null;
  };
  
  export default getChannelPlaylistId;