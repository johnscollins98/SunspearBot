const { Collection, GuildMember, Message } = require("discord.js");

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
   * @returns {Promise<Collection<string, GuildMember>>} collection of Discord Guild Members
   */
  async getMembers() {
    return await this.guild.members.fetch();
  }
}

module.exports = DiscordRepository;