require('dotenv').config();
const { Client, MessageEmbed, Message } = require('discord.js');
const DiscordRepository = require('./repositories/DiscordRepository');
const GW2Repository = require('./repositories/GW2Repository');
const { DataProcessor } = require('./utils/DataProcessor');
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

/**
 * Discord Commands!
 *
 * @param {Message} msg
 */
const commands = async (msg) => {
  const gw2Repository = new GW2Repository(
    process.env.GW2_GUILD_ID,
    process.env.GW2_API_KEY
  );
  const gw2Members = await gw2Repository.getMembers();
  const ranks = await gw2Repository.getRanks();

  const discordRepository = new DiscordRepository(msg);
  const discordMembers = await discordRepository.getMembers();

  const dataProcessor = new DataProcessor(gw2Members, discordMembers, ranks);

  if (msg.content === '--guildRoster') {
    const options = {
      title: 'GW2 Roster',
      color: '#00ff00',
      description: `<@${msg.author.id}>, HERE IS YOUR RESPONSE: `,
    };

    sendPagedEmbed(
      msg.channel,
      dataProcessor.getGW2Roster(),
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
      dataProcessor.getDiscordRoster(),
      24,
      (o) => o.name,
      (o) => o.role || 'No Role',
      options
    );
  }

  if (msg.content === '--excessGW2') {
    const options = {
      title: 'Excess GW2',
      color: '#00ff00',
      description: `<@${msg.author.id}>, HERE IS YOUR RESPONSE: `,
    };

    sendPagedEmbed(
      msg.channel,
      dataProcessor.getExcessGW2(),
      24,
      (o) => o.name,
      (o) => o.rank,
      options
    );
  }

  if (msg.content === '--excessDiscord') {
    const options = {
      title: 'Excess Discord',
      color: '#00ff00',
      description: `<@${msg.author.id}>, HERE IS YOUR RESPONSE: `,
    };

    sendPagedEmbed(
      msg.channel,
      dataProcessor.getExcessDiscord(),
      24,
      (o) => o.name,
      (o) => o.role || 'No Role',
      options
    );
  }

  if (msg.content === '--requiredActions') {
    const records = [];

    const excessGW2 = dataProcessor.getExcessGW2();
    if (excessGW2.length) {
      records.push({
        key: 'Extra GW2',
        value: excessGW2.map((o) => o.name),
      });
    }

    const excessDiscord = dataProcessor
      .getExcessDiscord()
      .filter((o) => o.role !== 'Bots' && o.role !== 'Guest');
    if (excessDiscord.length) {
      records.push({
        key: 'Extra Discord',
        value: excessDiscord.map((o) => `${o.name} (${o.role || 'No Role'})`),
      });
    }

    const noRoles = dataProcessor.getNoRoles();
    if (noRoles.length) {
      records.push({
        key: 'Has No Roles',
        value: noRoles.map((o) => o.name),
      });
    }

    const multipleRoles = dataProcessor.getMultipleRoles();
    if (multipleRoles.length) {
      records.push({
        key: 'Has Multiple Roles',
        value: multipleRoles.map((o) => `${o.name} (${o.roles.join(', ')})`),
      });
    }

    const mismatchedRoles = dataProcessor.getMismatchedRoles();
    if (mismatchedRoles.length) {
      records.push({
        key: 'Mismatched Roles (GW2/Discord)',
        value: mismatchedRoles,
      });
    }

    const needsPromotion = dataProcessor.getNeedsPromotion();
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

  if (arr.length) {
    embed.setFooter(
      `Page ${start / len + 1}/${Math.ceil(
        arr.length / len
      )} (${len} per page, ${arr.length} total entries)`
    );

    arr.slice(start, start + len).forEach((entry) => {
      embed.addField(keyFunc(entry), valFunc(entry), inline=true);
    });
  } else {
    embed.addField("👍 No Results!", "\u200b", inline=true);
  }

  return embed;
};

client.login(process.env.BOT_TOKEN);
