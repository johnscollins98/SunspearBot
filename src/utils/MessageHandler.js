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

    if (await this._hasPrefix(msg)) {
      msg.reply('Could not find this command.');
    }
  }

  /**
   * Check a Message has the expected prefix
   * 
   * @param {Message} msg 
   * @returns {boolean} true if it has a prefix we expect
   */
  async _hasPrefix(msg) {
    const prefix = (await this.guildConfigRepo.getPrefix()) || '^';
    const content = msg.content;

    return content.match(
      new RegExp(`(\\${prefix}|<@\\!?${this.client.user.id}>\s?)(\.*)`)
    );
  }
}

module.exports = MessageHandler;
