require('dotenv').config();
const { Client, MessageEmbed, Message } = require('discord.js');
const DiscordRepository = require("./repositories/DiscordRepository");
const client = new Client();
const {
  getDiscordMembers,
  getGW2Members,
  getMultipleRoles,
  getMismatchedRoles,
  getExcessGW2,
  getExcessDiscord,
  getNeedsPromotion,
  sortDiscordMembers,
  sortGW2Members,
  getNoRoles,
} = require('./utils/DataProcessing');

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

/**
 * Discord Commands!
 * 
 * @param {Message} msg 
 */
const commands = async (msg) => {
  if (msg.content === '--guildRoster') {
    const options = {
      title: 'GW2 Roster',
      color: '#00ff00',
      description: `<@${msg.author.id}>, HERE IS YOUR RESPONSE: `,
    };

    sendPagedEmbed(
      msg.channel,
      sortGW2Members(await getGW2Members()),
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
      sortDiscordMembers(await getDiscordMembers(new DiscordRepository(msg))),
      24,
      (o) => o.name,
      (o) => o.role || 'No Role',
      options
    );
  }

  if (msg.content === '--excessGW2') {
    const discord = await getDiscordMembers(new DiscordRepository(msg));
    const gw2 = await getGW2Members();
    const excess = getExcessGW2(gw2, discord);

    const options = {
      title: 'Excess GW2',
      color: '#00ff00',
      description: `<@${msg.author.id}>, HERE IS YOUR RESPONSE: `,
    };

    sendPagedEmbed(
      msg.channel,
      excess,
      24,
      (o) => o.name,
      (o) => o.rank,
      options
    );
  }

  if (msg.content === '--excessDiscord') {
    const discord = await getDiscordMembers(new DiscordRepository(msg));
    const gw2 = await getGW2Members();
    const excess = getExcessDiscord(gw2, discord);
    const options = {
      title: 'Excess Discord',
      color: '#00ff00',
      description: `<@${msg.author.id}>, HERE IS YOUR RESPONSE: `,
    };

    sendPagedEmbed(
      msg.channel,
      excess,
      24,
      (o) => o.name,
      (o) => o.role || 'No Role',
      options
    );
  }

  if (msg.content === '--requiredActions') {
    const discord = await getDiscordMembers(new DiscordRepository(msg));
    const gw2 = await getGW2Members();

    const records = [];

    const excessGW2 = getExcessGW2(gw2, discord);
    if (excessGW2.length) {
      records.push({
        key: 'Extra GW2',
        value: excessGW2.map((o) => o.name),
      });
    }

    const excessDiscord = getExcessDiscord(gw2, discord).filter(
      (o) => o.role !== 'Bots' && o.role !== 'Guest'
    );
    if (excessDiscord.length) {
      records.push({
        key: 'Extra Discord',
        value: excessDiscord.map((o) => `${o.name} (${o.role || 'No Role'})`),
      });
    }

    const noRoles = getNoRoles(discord);
    if (noRoles.length) {
      records.push({
        key: 'Has No Roles',
        value: noRoles.map((o) => o.name),
      });
    }

    const multipleRoles = getMultipleRoles(discord);
    if (multipleRoles.length) {
      records.push({
        key: 'Has Multiple Roles',
        value: multipleRoles.map((o) => `${o.name} (${o.roles.join(', ')})`),
      });
    }

    const mismatchedRoles = getMismatchedRoles(gw2, discord);
    if (mismatchedRoles.length) {
      records.push({
        key: 'Mismatched Roles (GW2/Discord)',
        value: mismatchedRoles,
      });
    }

    const needsPromotion = getNeedsPromotion(gw2);
    if (needsPromotion.length) {
      records.push({
        key: 'Needs Promotion',
        value: needsPromotion.map((o) => o.name),
      });
    }

    const options = {
      title: 'Required Actions',
      color: '#00ff00',
      description: `<@${msg.author.id}>, HERE IS YOUR RESPONSE: `,
    };

    sendPagedEmbed(
      msg.channel,
      records,
      9,
      (o) => o.key,
      (o) => o.value,
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
  options = {}
) => {
  channel
    .send(generateEmbed(arr, 0, pageLength, keyFunc, valFunc, options))
    .then(async (message) => {
      if (arr.length <= pageLength) return;
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
