import { ChannelPlaylistCollection } from "./playlist";
import { SpotifyUser } from "./spotifyUser";
import { Subscription } from "./subscription";
import { UserAuth } from "./userAuth";
import { UserData } from "./userData";

export interface DataStoreShape {
  userAuthCollection: UserAuth.Collection;
  spotifyUserLookupMap: SpotifyUser.LookupMap;
  subscriptions: Subscription.Collection;
  userData: UserData.Collection;
  channelPlaylistCollection: ChannelPlaylistCollection;
}
