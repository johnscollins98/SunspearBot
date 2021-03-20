const { GuildMember, Message } = require('discord.js');

class DiscordRepository {
  /**
   * Constructor
   *
   * @param {Message} rootMessage
   */
  constructor(rootMessage) {
    this.rootMessage = rootMessage;
    this.guild = rootMessage.guild;
    this.channel = rootMessage.channel;
  }

  /**
   * Get Discord Guild Members
   *
   * @returns {Promise<Array<GuildMember>>} collection of Discord Guild Members
   */
  async getMembers() {
    try {
      const collection = await this.guild.members.fetch();
      return collection.array();
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = DiscordRepository;
