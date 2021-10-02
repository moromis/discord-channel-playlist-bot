- add initial setup function to initialize and default data store
- DRY subscribe/unsubscribe
- auto-subscribe sometimes, based on intent?

- read https://discordjs.guide/#before-you-begin
- https://discordjs.guide/interactions/registering-slash-commands.html#guild-commands

- type store so that it knows about its contents and automatically infers the return type of get etc.
  - alternatively, look into
- replace `commands` with [ApplicationCommandManager](https://discord.js.org/#/docs/main/stable/class/ApplicationCommandManager)?
- if playlist becomes "corrupt", i.e. doesn't exist or something like that, delete entry in store and create a new one
- if we don't replace commands, add descriptions to them
- if we make a new playlist, give deleting the old one a shot
- fix reacting to old command when a song is posted
