const { MessageEmbed, Message, Client } = require('discord.js');
const DiscordRepository = require('../repositories/DiscordRepository');
const GW2Repository = require('../repositories/GW2Repository');
const { DataProcessor } = require('./DataProcessor');

/**
 * Discord Commands!
 *
 * @param {Message} msg
 * @param {Client} client
 */
const commands = async (msg, client) => {
  const gw2Repository = new GW2Repository(
    process.env.GW2_GUILD_ID,
    process.env.GW2_API_KEY
  );
  const gw2Members = await gw2Repository.getMembers();
  const ranks = await gw2Repository.getRanks();

  const discordRepository = new DiscordRepository(msg);
  const discordMembers = await discordRepository.getMembers();

  const dataProcessor = new DataProcessor(gw2Members, discordMembers, ranks);

  const options = {
    color: '#00ff00',
    text: `<@${msg.author.id}>, HERE IS YOUR RES-PONSE`,
  };

  if (msg.content.startsWith('^clean')) {
    if (msg.guild.member(msg.author.id).hasPermission("MANAGE_MESSAGES")) {
      const matches = msg.content.match(/^(\^clean) (\d+)$/);

      if (!matches) {
        return msg.reply("Usage: ^clean <number from 1-100>");
      }

      const numberGroup = 2;
      const numberToDelete = parseInt(matches[numberGroup]);
      
      if (numberToDelete < 1 || numberToDelete > 100) {
        return msg.reply("Usage: `^clean <number from 1-100>`");
      }

      const channel = msg.channel;
      const author = msg.author;

      await msg.delete();

      const res = await channel.bulkDelete(numberToDelete, true);
      const reply = await channel.send(`<@${author.id}>, DE-LE-TED ${res.size} MESS-A-GES`)

      setTimeout(() => reply.delete(), 2000);
    } else {
      return msg.reply("You do not have permission to do this.");
    }
  }

  if (msg.content === '^guildRoster') {
    await sendPagedEmbed(
      msg.channel,
      client,
      dataProcessor.getGW2Roster(),
      24,
      (o) => o.name,
      (o) => o.rank,
      { ...options, title: 'GW2 Roster' }
    );
  }

  if (msg.content === '^discordRoster') {
    await sendPagedEmbed(
      msg.channel,
      client,
      dataProcessor.getDiscordRoster(),
      24,
      (o) => o.name,
      (o) => o.role || 'No Role',
      { ...options, title: 'Discord Roster' }
    );
  }

  if (msg.content === '^excessGW2') {
    await sendPagedEmbed(
      msg.channel,
      client,
      dataProcessor.getExcessGW2(),
      24,
      (o) => o.name,
      (o) => o.rank,
      { ...options, title: 'Excess GW2' }
    );
  }

  if (msg.content === '^excessDiscord') {
    await sendPagedEmbed(
      msg.channel,
      client,
      dataProcessor.getExcessDiscord(),
      24,
      (o) => o.name,
      (o) => o.role || 'No Role',
      { ...options, title: 'Excess Discord' }
    );
  }

  if (msg.content === '^requiredActions') {
    await sendPagedEmbed(
      msg.channel,
      client,
      dataProcessor.getRequiredActions(),
      9,
      (o) => o.key,
      (o) => o.value,
      { ...options, title: 'Required Actions' }
    );
  }
};

const sendPagedEmbed = async (
  channel,
  client,
  arr,
  pageLength,
  keyFunc,
  valFunc,
  options = {}
) => {
  await channel
    .send(options.text, {
      embed: generateEmbed(
        client,
        arr,
        0,
        pageLength,
        keyFunc,
        valFunc,
        options
      ),
    })
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

          message.edit(options.text, {
            embed: generateEmbed(
              client,
              arr,
              currentIndex,
              pageLength,
              keyFunc,
              valFunc,
              options
            ),
          });
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
  client,
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

  embed.setAuthor(client.user.username, (iconURL = client.user.avatarURL()));

  if (arr.length) {
    embed.setFooter(
      `Page ${start / len + 1}/${Math.ceil(
        arr.length / len
      )} (${len} per page, ${arr.length} total entries)`
    );

    arr.slice(start, start + len).forEach((entry) => {
      embed.addField(keyFunc(entry), valFunc(entry), (inline = true));
    });
  } else {
    embed.addField('👍 No Results!', '\u200b', (inline = true));
  }

  return embed;
};

module.exports = {
  commands,
};
