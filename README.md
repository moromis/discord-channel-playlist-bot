# discord-channel-playlist-bot

A Discord bot that allows users to receive a weekly Spotify playlist made up of songs posted to a specific Discord channel over that time.

## How it works

The bot has several commands that can be issued to it by directly mentioning the bot in a public channel or via a direct message with the bot. A user must first issue the `authorize` command to the bot. The user will be given a link to follow to authorize the bot to manage channel playlist subscriptions on their Spotify account. Once the user has messaged the resulting token back to the bot to complete authorization, they will be able to issue the `subscribe` command on any channel the bot has access to. Once subscribed, the bot will create a playlist on the user's Spotify account, and will update it with music posted to the subscribed channel every week (or whatever time period you define in [`config.yml`](#configyml)).

## Getting started

### Prerequisites

You must setup a Discord bot on your account. You must also create a Spotify developer app to gain access to the Spotify API.

#### Setup a Discord bot on your Discord account

You must setup a Discord bot on your account. If you're unfamiliar with this process, a guide can be found [here](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token). Once you've setup the bot, you must set the `discord.token` value in your [`auth.yml` file](#authyml) with the token for the bot you created.

#### Setup a Spotify Developer app on your Spotify account

You must create a Spotify developer app to gain access to the Spotify API. Simply go to the [Spotify for Developers dashboard](https://developer.spotify.com/dashboard/applications), sign in, and click the button to create a new app. Copy the client ID and client secret to the `spotify.clientId` and `spotify.clientSecret` values respectively in your [`auth.yml` file](#authyml).

Once created, click the app, and click the `Edit Settings` button. From there you should see an input field to add a `Redirect URI`. Add and save your redirect URI here, as well as to your [`auth.yml` file](#authyml) as `spotify.redirectUri`. For more information about redirect URIs, see the [authorization](#authorization) section.

### Configuration

There are two files that can be configured for the bot, `auth.yml` and `config.yml`.

#### `auth.yml`

This file is required for your bot to work. Rename the `auth.placeholder.json` file that comes with the project to `auth.yml` and replace the placeholder values with the Discord token and Spotify client credentials from the [prerequisite](#prerequisites) step above.

Here's an example configuration. Please note that these values must be replaced with your own valid configuration values:

```yaml
discord:
  token: "ODkzMTUxNzcyNjExMzM0MjY3.YVXSaA.FWWndBpoBDcPev5CFjp7bCzl0Qs"
spotify:
  clientId: "c5498223bccb4aaaa889c81259eac0b3"
  clientSecret: "44f426cfffffff45999498f1040e3bdc"
  redirectUri: "https://js.do/code/231611"
```

#### `config.yml`

This file contains configurable values that change the behavior of the bot. Rename the `config.placeholder.json` file that comes with the project to `config.yml` and replace the placeholder values if you'd like to.

##### Playlist behavior

By default, the bot is configured to update user's channel playlists every week. Songs from the previous week will be deleted, much like the Discover Weekly playlist from Spotify. You can change this behavior by setting the `keepOldPlaylistSongs` property to `true`. By also changing `playlistUpdateFrequency` to `1`, you can make the bot continuously pump songs to the playlist as soon as they are posted in Discord, making the playlist function as an archive of all songs posted to that channel.

##### Properties

**`messageOnPlaylistChange`** - Whether or not the bot should send a message to the channel when a new song is posted on the channel. Defaults to `false`.

**`messageOnPlaylistCommit`** - Whether or not the bot should send a message to the channel when Spotify user playlists are being updated for the channel. Defaults to `false`.

**`keepOldPlaylistSongs`** - Whether or not the bot should keep songs that were previously posted to the playlist. Defaults to `false`.

**`playlistUpdateFrequency`** - How often Spotify user playlists should be updated for any subscribed channel, in seconds. Defaults to `604800` (1 week).

**`playlistName`** - The name of the playlists created by this bot. Defaults to `"Weekly Playlist"`. (**Note**: The server name and channel name being subscribed to will be automatically prepended to this value).

**`dataStoreLocation`** - Where to store user authorization and playlist/subscription data. Defaults to `"data/store.json"`.

### Authorization

A key part of this bot's functionality comes from being able to create and manage a Spotify playlist for each user that wants to subscribe to a channel's playlist. In order to do this, your Spotify client app (the bot) needs to be granted permission to manage the user's public playlists. When a user issues the `authorize` command to the bot, they will be given a URL that prompts them to give the bot these permissions via a secure Spotify login page. When the user grants the bot these permissions, Spotify issues the app a token that grants access to the relevant playlist management APIs for that user.

#### Setting up a `redirectUri` target for the authorization flow

In this type of OAuth authentication flow, the app is given the authorization token via a query parameter passed to a `redirectUri`. This URI is typically a link to your app so that the user is seamlessly transitioned back to the app they are authorizing. With a Discord bot, however, there is no web-facing URL available to redirect to. This means we need an alternate way of getting the authorization token.

The bot accepts tokens via a direct message (DM) on Discord, but we need a way to show the token to the user so that they can message it to the bot. The simplest way to accomplish this is to setup a webpage that simply parses the token from the URL and displays it to the user with instructions on how to send it to the bot via a private DM to the bot in Discord. This webpage becomes your `redirectUri`.

If you want to avoid having to setup and host a custom page for your bot, it's also possible to write a basic Javascript app on a JS code runner website and then set it as your `redirectUri`. You can see an example [here](https://js.do/code/231611), which uses code hosted on [js.do](https://js.do) to show the user the authorization token and tells them to DM it to the bot via Discord.

It would be possible to modify the bot to integrate with an external, web-facing service that would automatically notify the bot with the user's authorization token. This is currently not supported out of the box.

## Running the bot

First, install the dependencies:

```bash
npm install
```

Then start the bot:

```bash
npm run start
```

## Using the bot

The bot accepts several different commands. To trigger a command from chat, reply to the bot with a mention (i.e. `@BotName`) and then the name of the command. The accepted commands are as follows:

- **`authorize`** - Triggers the bot to reply to the user with an authorization URL to grant the bot access to Spotify. For more information about authorization, see the [authorization](#authorization) section.

- **`register-token` _`[auth-token]`_** - Tells the bot to register the user with the given `auth-token`. For more information about authorization, see the [authorization](#authorization) section.

> **IMPORTANT NOTE**: While the auth token won't grant direct or permanent access to a user's Spotify account, it is reccommended to send the auth token privately to the bot via a direct message.

- **`subscribe`** - Subscribes the user to the current channel's playlist.

- **`unsubscribe`** - Unsubscribes the user from the current channel's playlist.

- **`help`** - Provides basic info about the bot and a list of available commands.
