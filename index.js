require('dotenv').config();
const { Client, MessageEmbed } = require('discord.js');
const axios = require('axios');
const client = new Client();

const getRoster = async (category) => {
  const response = await axios.get(
    `http://so-guild-manager.herokuapp.com/api/${category}/members`
  );
  return response.data;
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (msg) => {
  if (msg.author.id === client.user.id) return;

  funResponses(msg);
  commands(msg);
});

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

const commands = async (msg) => {
  if (msg.content === '--guildRoster') {
    const options = {
      title: 'GW2 Roster',
      color: '#00ff00',
      description: `<@${msg.author.id}>, HERE IS YOUR RESPONSE: `,
    };

    sendPagedEmbed(
      msg.channel,
      await getRoster('gw2'),
      24,
      (o) => o.name,
      (o) => o.rank,
      options
    );
  }

  if (msg.content === '--discordRoster') {
    const options = {
      title: 'Discord Roster',
      color: '#00ff00',
      description: `<@${msg.author.id}>, HERE IS YOUR RESPONSE: `,
    };

    sendPagedEmbed(
      msg.channel,
      await getRoster('discord'),
      24,
      (o) => o.name,
      (o) => (o.roles[0] ? o.roles[0].name : 'No Role'),
      options
    );
  }
};

const sendPagedEmbed = (
  channel,
  arr,
  pageLength,
  keyFunc,
  valFunc,
  options
) => {
  channel
    .send(generateEmbed(arr, 0, pageLength, keyFunc, valFunc, options))
    .then(async (message) => {
      if (arr.pageLength < pageLength) return;
      await message.react('➡');
      await message.react('⏭');
      const collector = message.createReactionCollector(
        (reaction, user) =>
          ['➡', '⬅', '⏮', '⏭'].includes(reaction.emoji.name) &&
          user.id !== client.user.id,
        { time: 600000 }
      );

      let currentIndex = 0;
      collector.on('collect', (reaction) => {
        message.reactions.removeAll().then(async () => {
          switch (reaction.emoji.name) {
            case '⬅':
              currentIndex -= pageLength;
              break;
            case '➡':
              currentIndex += pageLength;
              break;
            case '⏮':
              currentIndex = 0;
              break;
            case '⏭':
              currentIndex =
                (Math.ceil(arr.length / pageLength) - 1) * pageLength;
              break;
            default:
              break;
          }

          message.edit(
            generateEmbed(
              arr,
              currentIndex,
              pageLength,
              keyFunc,
              valFunc,
              options
            )
          );
          if (currentIndex !== 0) {
            await message.react('⏮');
            await message.react('⬅');
          }
          if (currentIndex + pageLength < arr.length) {
            await message.react('➡');
            message.react('⏭');
          }
        });
      });
    });
};

const generateEmbed = (
  arr,
  start,
  len,
  keyFunc,
  valFunc,
  { title, description, color, thumbnailUrl, imageUrl }
) => {
  const embed = new MessageEmbed();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (color) embed.setColor(color);
  if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);
  if (imageUrl) embed.setImage(imageUrl);

  embed.setFooter(
    `Page ${start / len + 1}/${Math.ceil(arr.length / len)} (${len} per page, ${
      arr.length
    } total)`
  );

  arr.slice(start, start + len).forEach((entry) => {
    embed.addField(keyFunc(entry), valFunc(entry), true);
  });

  return embed;
};

client.login(process.env.BOT_TOKEN);
