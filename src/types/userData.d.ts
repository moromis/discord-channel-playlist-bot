export type PlaylistId = string;

export interface PlaylistCollection {
  [channelId: string]: PlaylistId;
}

type UserDataType = {
  playlists?: PlaylistCollection;
};

export namespace UserData {
  export interface Collection {
    [userId: string]: UserDataType;
  }
}
