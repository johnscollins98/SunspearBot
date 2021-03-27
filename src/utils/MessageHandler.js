const { Message } = require('discord.js');
const GuildConfigRepository = require('../repositories/GuildConfigRepository');

class MessageHandler {
  /**
   * Constructor
   *
   * @param {GuildConfigRepository} guildConfigRepo repo of guild config
   * @param {Client} client discord client of bot
   */
  constructor(guildConfigRepo, client) {
    this.guildConfigRepo = guildConfigRepo;
    this.client = client;
  }

  /**
   * Handle a discord message
   *
   * @param {Message} msg
   */
  async handle(msg) {
    if (msg.author.bot) return;

    const prefix = (await this.guildConfigRepo.getPrefix()) || '^';
    const match = await this._hasPrefix(msg, prefix);
    if (match) {
      const usedPrefix = match[1];
      const strippedMsg = match[2];
      if (!strippedMsg && usedPrefix !== prefix) {
        msg.reply(`The prefix for this server is \`${prefix}\`.`);
      } else {
        msg.reply('Could not find this command.');
      }
    }
  }

  /**
   * Check a Message has the expected prefix
   *
   * @param {Message} msg message to check
   * @returns {boolean} true if it has a prefix we expect
   */
  async _hasPrefix(msg, prefix) {
    const content = msg.content;

    return content.match(
      new RegExp(`(\\${prefix}|<@\\!?${this.client.user.id}>\\s?)(\.*)`)
    );
  }
}

module.exports = MessageHandler;
