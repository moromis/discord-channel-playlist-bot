// REGEX
export const MENTION_REGEX = /<@.*?>\s+/;

export const SPOTIFY_URL_REGEX =
  /^(?:https?:\/\/)?open\.spotify\.com\/track\/([^?\s]+)(\?[^\s]+)?$/i;

// STRINGS
export enum SpotifyAuthenticationErrors {
  UNKNOWN = "-1",
  NOT_AUTHORIZED = "Unable to authenticate. If you haven't authorized this app yet, please run `!authorize`",
  INVALID_TOKEN = "Invalid token",
}

const DataStore = {
  defaultStoreLocation: "data/store.json",
  Keys: {
    channelPlaylistCollection: "channelPlaylistCollection",
    userAuthCollection: "userAuthCollection",
    spotifyUserLookupMap: "spotifyUserLookupMap",
    subscriptions: "subscriptions",
    userData: "userData",
  },
};

const Common = {
  helpInstructions: "For help, **@Mention** me and say `help`.",
  authInstructions: "**@Mention** me and say `authorize`",
};

const Help = {
  generalHelp: `
This bot allows you to subscribe to music posted to any Discord channel from Spotify. A playlist will be periodically created on your Spotify account with all of the tracks posted to this channel in that time.

To get started, you will need to authorize me to manage the playlist via Spotify. To do this, ${Common.authInstructions}.`,
  availableCommands: "Available commands:",
};

const RegisterToken = {
  missingToken: `
Please provide a valid Spotify authorization token to be registered.
${Common.helpInstructions}
  `,
  invalidToken: `
Uh oh... your token appears to be invalid. To receive a valid token, ${Common.authInstructions}.
${Common.helpInstructions},
  `,
  successResponse:
    "You're all set! You can now **@Mention** me in any channel and say `subscribe` to have me manage a weekly playlist for that channel.",
};

const Strings = {
  noTracks:
    "I don't know about any songs in this channel yet. Post some Spotify links or use the `get-historical` command",
  noSubscriptions:
    "No one is subscribed to this channel. (hint: type !s to subscribe)",
  successfulPush: "Successfully published to Spotify!",
  Common,
  Commands: {
    RegisterToken,
    Help,
    Subscribe: {
      unregisteredUserId: {
        1: `You need to authorize me to manage your channel playlists via Spotify before you can subscribe. To authorize, ${Common.authInstructions}.`,
        2: Common.helpInstructions,
      },
      alreadySubscribed:
        "You are already subscribed to this channel's playlist.",
      successResponse:
        "You have subscribed to this channel's Spotify playlist. You will receive a new playlist periodically with music submitted to this channel.",
    },
    Unsubscribe: {
      notSubscribed:
        "You are not currently subscribed to this channel's playlist.",
      successResponse:
        "You have unsubscribed from this channel's Spotify playlist. You will no longer receive playlist updates for this channel.",
    },
  },
  CommandError: {
    Prefixes: [
      "I don't know what that is, I've never seen that.",
      "Beep boop, I'm just a bot.",
      "What?",
      "Cool.",
    ],
    Response: "You can say `help` to see a list of commands.",
  },
  Notifications: {
    messageOnPlaylistCommit:
      "Spotify playlists for this channel are being updated. Get ready!",
    messageOnPlaylistChange: "Your track(s) have been added to the playlist.",
  },
};

export default {
  DataStore,
  Strings,
};
