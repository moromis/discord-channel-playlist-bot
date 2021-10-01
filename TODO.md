- add initial setup function to initialize and default data store
- add optional time in seconds arg for force-update to recrawl
- DRY subscribe/unsubscribe
- auto-subscribe sometimes, based on intent?

- read https://discordjs.guide/#before-you-begin
- https://discordjs.guide/interactions/registering-slash-commands.html#guild-commands

- type store so that it knows about its contents and automatically infers the return type of get etc.
  - alternatively, look into
- replace `commands` with [ApplicationCommandManager](https://discord.js.org/#/docs/main/stable/class/ApplicationCommandManager)?
