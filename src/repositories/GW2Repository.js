const axios = require('axios');

class GW2Repository {
  constructor(guildId, apiKey) {
    this.baseUrl = `https://api.guildwars2.com/v2/guild/${guildId}`;
    this.reqParams = {
      headers: {
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
    try {
      const response = await axios.get(
        `${this.baseUrl}/members`,
        this.reqParams
      );
      return response.data;
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Get GW2 Ranks (plus Guest + Bots)
   *
   * @returns {Promise<Array<{id: string, order: number}>>}
   */
  async getRanks() {
    try {
      const response = await axios.get(`${this.baseUrl}/ranks`, this.reqParams);
      let formatted = response.data.map((o) => ({
        id: o.id,
        order: o.order,
      }));

      return formatted.concat([
        { id: 'Guest', order: formatted.length + 1 },
        { id: 'Bots', order: formatted.length + 2 },
      ]);
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = GW2Repository;
