const axios = require("axios");

class GW2Repository {
  constructor(guildId, apiKey) {
    this.baseUrl = `https://api.guildwars2.com/v2/guild/${guildId}`;
    this.reqParams = {
      header: {
        Authorization: `Bearer ${apiKey}`,
      },
    };
  }

  /**
   * Get GW2 Members.
   *
   * @returns {Promise<Array<{name: string, rank: string, joined: string}>>} array of gw2 member objects
   */
  async getMembers() {
    return await axios.get(`${this.baseUrl}/members`, this.reqParams);
  }
}

module.exports = GW2Repository;
