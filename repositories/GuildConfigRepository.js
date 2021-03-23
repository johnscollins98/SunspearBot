const GuildConfig = require('../models/GuildConfig.model');

class GuildConfigRepository {
  constructor(id) {
    this.id = id;
  }
  
  async getConfig() {
    return await GuildConfig.findOne({ id: this.id }).exec();
  }

  async getPrefix() {
    const config = await this.getConfig();
    if (config) {
      return config.prefix;
    }
    return null;
  }

  async setPrefix(prefix) {
    const config = await this.getConfig();
    if (config) {
      config.prefix = prefix;
      config.save();
    } else {
      const newConfig = new GuildConfig({
        id: this.id,
        prefix,
      });
      await newConfig.save();
    }
  }
}

module.exports = GuildConfigRepository;
