const GuildConfig = require('../models/GuildConfig.model');

class GuildConfigRepository {
  constructor(id) {
    this.id = id;
  }
  
  async getConfig() {
    return await this._findOrCreateConfig();
  }

  async getPrefix() {
    const config = await this._findOrCreateConfig();
    if (config) {
      return config.prefix;
    }
    return null;
  }

  async setPrefix(prefix) {
    const config = await this._findOrCreateConfig()
    if (config) {
      config.prefix = prefix;
      return await config.save();
    } 
    return null;
  }

  async getAdminRole() {
    const config = await this._findOrCreateConfig();
    if (config) {
      return config.adminRole;
    }
    return null;
  }

  async setAdminRole(roleId) {
    const config = await this._findOrCreateConfig();
    if (config) {
      config.adminRole = roleId;
      return await config.save();
    }
    return null;
  }

  async _findOrCreateConfig() {
    const config = await GuildConfig.findOne({ id: this.id }).exec();
    if (config) {
      return config;
    } else {
      const newConfig = new GuildConfig({ id: this.id });
      return await newConfig.save();
    }
  }
}

module.exports = GuildConfigRepository;
