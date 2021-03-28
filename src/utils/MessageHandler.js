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
    const match = await this.parseCommand(msg, prefix);
    if (match) {
      const [_, usedPrefix, command, args] = match;
      if (command === 'prefix' || (!command && usedPrefix !== prefix)) {
        this.prefixCommand(msg, args, prefix);
      } else if (command === 'adminRole') {
        this.adminCommand(msg, args);
      } else {
        msg.reply('Could not find this command.');
      }
    }
  }

  /**
   * Check a Message has the expected prefix
   *
   * @param {Message} msg message to check
   * @returns {RegExpMatchArray} true if it has a prefix we expect
   */
  async parseCommand(msg, prefix) {
    const content = msg.content;
    const regex = `^(\\${prefix}|<@!?${this.client.user.id}>\\s?)([a-zA-Z]*)?\\s?(.*)?$`;
    return content.match(new RegExp(regex, 'i'));
  }

  /**
   * Command for setting prefix
   *
   * @param {Message} msg message that initiated command
   * @param {string} newPrefix value to set the prefix as
   * @param {string} oldPrefix current value of the prefix
   */
  async prefixCommand(msg, newPrefix, oldPrefix) {
    if (!newPrefix) {
      return await msg.reply(`The prefix for this server is \`${oldPrefix}\`.`);
    }

    const match = newPrefix.trim().match(/^[-!"£$%^&*_=+]+$/);
    if (!match) {
      return await msg.reply(`Usage: \`${oldPrefix}prefix [-!"£$%^&*_=+]\``);
    } else {
      const response = await this.guildConfigRepo.setPrefix(newPrefix.trim());
      return await msg.reply(`Set the prefix to \`${response.prefix}\`.`);
    }
  }

  /**
   * Set or get admin role
   *
   * @param {Message} msg message that initiated command
   * @param {string} roleId role to set the admin to
   */
  async adminCommand(msg, roleId) {
    if (!roleId) {
      //get current admin
      const currentAdminId = await this.guildConfigRepo.getAdminRole();
      const currentAdmin = msg.guild.roles.resolve(currentAdminId);

      if (!currentAdminId) return msg.reply('No admin role set.');
      return msg.reply(
        currentAdmin
          ? `Current Admin is ${currentAdmin}`
          : 'Stored admin role is invalid (not found)'
      );
    }

    // set admin
    const hasPermission = msg.guild
      .member(msg.author.id)
      .hasPermission('ADMINISTRATOR');
    if (!hasPermission) {
      return msg.reply('You do not have permissions to set the Admin Role');
    }

    const resolvedRole = msg.guild.roles.resolve(roleId);
    if (!resolvedRole) {
      return msg.reply('Cannot find the given role on this server.');
    }

    const res = await this.guildConfigRepo.setAdminRole(roleId);
    return msg.reply(`Set Admin Role to ${resolvedRole}`);
  }
}

module.exports = MessageHandler;
