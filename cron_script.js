require('dotenv').config();
const { Client } = require('discord.js');
const { commands } = require('./utils/Commands');
const client = new Client();
const mongoose = require("mongoose");


// DB connection
const dbUri = process.env.ATLAS_URI;
mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.once('open', async () => {
  console.log('MongoDB database connection established successfully.');
  client.login(process.env.BOT_TOKEN);
});

client.on('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag}`)
    const guild = client.guilds.resolve(process.env.DISCORD_GUILD_ID);
    if (!guild) throw "Can't find guild";
    
    const channel = guild.channels.resolve(process.env.NOTIFICATION_CHANNEL_ID);
    if (!channel) throw "Can't find channel";

    const author = guild.member(process.env.TO_TAG);

    await commands({
      content: `<@${client.user.id}> requiredActions`,
      author,
      channel,
      guild
    }, client)
  } catch (err) {
    console.error(err);
  } finally {
    client.destroy();
    connection.close();
  }
});