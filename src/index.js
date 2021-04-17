require('dotenv').config();
const mongoose = require('mongoose');

const { Client, Message } = require('discord.js');

const { commands } = require('./utils/Commands');
const client = new Client();

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

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
    status: 'online',
    activity: {
      name: 'MEN-TION ME FOR PRE-FIX.',
      type: 'PLAYING',
    },
  });
});

client.on('guildMemberAdd', (member) => {
  if (member.guild.id === process.env.DISCORD_GUILD_ID) {
    member.send(
      `Hello, ${member.displayName} and welcome to **${member.guild.name}**! 🌞

Please send your account name in <#538466476667961354> so that we can invite you.

While you wait for an officer to invite you please check out the following channels:
- <#427078611548372997> to read our rules.
- <#825385900841107476> to see our events.
- <#710094018670755930> to assign yourself roles for specific content.`
    );

    const channel = member.guild.channels.resolve(
      process.env.WELCOME_CHANNEL_ID
    );
    if (channel) {
      channel.send(
        `Hello, ${member} welcome 🌞! Please send your GW2 account name in <#${channel.id}> and we'll get you invited ASAP!`
      );
    }
  }
});

client.on('message', async (msg) => {
  if (msg.author.bot) return;

  funResponses(msg);
  commands(msg, client);
});

/**
 * Fun discord responses!
 *
 * @param {Message} msg
 */
const funResponses = (msg) => {
  if (msg.content.match(/[o|0]+h*[,|.|\s]*my*f*[,|.|\s]*g(?:[o|0]*d)?/gim)) {
    msg.reply('TRAM-PO-LINE.');
  }

  if (msg.content.match(/trampoline/gim)) {
    msg.reply('O-M-G');
  }

  if (msg.content === 'Ping!') {
    msg.reply('PONG.');
  }

  if (msg.content.match(/x\s*d/gim)) {
    msg.reply('HE-LLO I THINK YOU MEAN "xB"');
  }

  if (msg.content.match(/x\s*b/gim)) {
    msg.reply('xB');
  }

  if (msg.content.includes(`<@224913098576887809>`) || msg.content.includes('<@!224913098576887809>')) {
    msg.reply('ELOSIA HAS INSTRUCTED ME TO SAY "DO WHAT YOU WANT".');
  }
  
  if (msg.content.toLowerCase().includes('jimmy')) {
    msg.reply('[What\'s Happening?]');
  }
};
