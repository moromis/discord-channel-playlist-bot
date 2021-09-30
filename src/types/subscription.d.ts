import { SpotifyUser } from "./spotifyUser";

export namespace Subscription {
  export interface Collection {
    [channelId: string]: SpotifyUser.Id[];
  }
}
