export interface Playlist {
  channelId: string;
  channelName: string;
  songUris: string[];
  lastCommitDate: string;
  lastUpdateDate?: string;
}

export interface ChannelPlaylistCollection {
  [channelId: string]: Playlist;
}
