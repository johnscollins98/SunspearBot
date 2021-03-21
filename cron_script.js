require('dotenv').config();
const { Client } = require('discord.js');
const { commands } = require('./utils/Commands');
const client = new Client();

client.on('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag}`)
    const guild = client.guilds.resolve(process.env.DISCORD_GUILD_ID);
    if (!guild) throw "Can't find guild";
    
    const channel = guild.channels.resolve(process.env.NOTIFICATION_CHANNEL_ID);
    if (!channel) throw "Can't find channel";

    await commands({
      content: "^requiredActions",
      author: { id: process.env.TO_TAG },
      channel,
      guild
    }, client)
  } catch (err) {
    console.error(err);
  } finally {
    client.destroy();
  }
});

client.login(process.env.BOT_TOKEN);