require('dotenv').config();
const { Client, Message } = require('discord.js');

const { commands } = require('./utils/Commands');
const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (msg) => {
  if (msg.author.id === client.user.id) return;

  funResponses(msg);
  commands(msg);
});

/**
 * Fun discord responses!
 *
 * @param {Message} msg
 */
const funResponses = (msg) => {
  if (msg.content.match(/[o|0]+h*[,|.|\s]*my*f*[,|.|\s]*g(?:[o|0]*d)?/gim)) {
    msg.reply('TRAMPOLINE.');
  }

  if (msg.content.match(/trampoline/gim)) {
    msg.reply('OMG');
  }

  if (msg.content === 'Ping!') {
    msg.reply('PONG.');
  }

  if (msg.content.match(/x\s*d/gim)) {
    msg.reply('HI. I THINK YOU MEAN "xB"');
  }

  if (msg.content.match(/x\s*b/gim)) {
    msg.reply('xB');
  }
};

client.login(process.env.BOT_TOKEN);
