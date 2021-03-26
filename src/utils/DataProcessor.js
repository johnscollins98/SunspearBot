const { GuildMember } = require('discord.js');

class DataProcessor {
  /**
   * Constructor
   * @param {Array<{name: string, rank: string, joined: string}>} gw2Members
   * @param {Array<GuildMember>} discordMembers
   * @param {Array<{id: string, order: number}>} validRanks
   */
  constructor(gw2Members, discordMembers, validRanks) {
    this._validRanks = {};
    validRanks.forEach((rank) => {
      this._validRanks[rank.id] = rank.order;
    });

    this._gw2Members = this._sortGW2Members(
      gw2Members.map((o) => new GW2Member(o.name, o.rank, o.joined))
    );

    this._discordMembers = this._sortDiscordMembers(discordMembers);
  }

  /**
   * Get GW2 accounts without a discord account
   * @returns {Array<GW2Member>} excess GW2 accounts
   */
  getExcessGW2() {
    return this._gw2Members
      .filter((m) => m.rank !== 'Alt')
      .filter(
        (m) => !this.findDiscordRecord(m.name.split('.')[0].toLowerCase())
      );
  }

  /**
   * Get GW2 Roster sorted by rank then date
   * @returns {Array<GW2Member>} sorted gw2 members
   */
  getGW2Roster() {
    return this._gw2Members;
  }

  /**
   * Get gw2 members that need a promotion
   * @returns {Array<GW2Member>} gw2 members needing promotion
   */
  getNeedsPromotion = () => {
    return this._gw2Members.filter((gw2) => {
      if (gw2.rank !== 'Second Spear') return false;

      const date = new Date(gw2.joined.split('T')[0]);
      const diffMilliseconds = Math.abs(Date.now() - date);
      const diffDays = Math.floor(diffMilliseconds / (1000 * 60 * 60 * 24));
      return diffDays >= 14;
    });
  };

  /**
   * Get discord accounts that can't be found in GW2.
   * @returns {Array<GuildMember>} excess discord members
   */
  getExcessDiscord() {
    return this._discordMembers.filter(
      (discordMember) =>
        !this._gw2Members.some((gw2Member) =>
          this.matchDiscordName(gw2Member.name, discordMember.displayName)
        )
    );
  }

  /**
   * Get discord members sorted by rank then data
   * @returns {Array<GuildMember>} sorted discord members
   */
  getDiscordRoster() {
    return this._discordMembers;
  }

  /**
   * Find Discord Member matching a given test name
   *
   * @param {string} testName
   * @returns {GuildMember} found discord member
   */
  findDiscordRecord = (testName) => {
    // check for exact match
    const discordMember = this._discordMembers.find((m) =>
      this.matchDiscordName(testName, m.displayName)
    );

    return discordMember;
  };

  /**
   * Matches a testName to a discord name
   * @param {string} testName gw2 test name
   * @param {string} discordName discord name
   * @returns
   */
  matchDiscordName = (testName, discordName) => {
    testName = testName.split('.')[0].toLowerCase();
    discordName = discordName
      .toLowerCase()
      .replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        ''
      ) // strip any emojis
      .trim(); // trim any leading/trailing whitespace (should only be present if they have an emoji at the start)

    return discordName === testName || discordName.includes(`(${testName})`);
  };

  /**
   * Get Discord Members with no roles
   * @returns {Array<GuildMember>}
   */
  getNoRoles() {
    return this._discordMembers.filter((o) => !this._getRole(o));
  }

  /**
   * Get Discord Members with multiple roles
   * @returns {Array<GuildMember>}
   */
  getMultipleRoles() {
    return this._discordMembers.filter((o) => this._getRoles(o).length > 1);
  }

  /**
   * Get an array of GW2 members with mismatching roles with Discord
   * @returns {Array<GW2Member>} mismatched members
   */
  getMismatchedRoles = () => {
    return this._gw2Members
      .filter((gw2) => gw2.rank !== 'Alt')
      .filter((gw2) => {
        const discordMember = this.findDiscordRecord(gw2.name);
        if (!discordMember) return false;
        if (this._getRoles(discordMember).length !== 1) return false;

        return this._getRole(discordMember) !== gw2.rank;
      })
      .map((gw2) => {
        const discordMember = this.findDiscordRecord(gw2.name);
        return `${discordMember} (${gw2.rank}/${this._getRole(discordMember)})`;
      });
  };

  /**
   * Gets all required actions for the server.
   *
   * @returns {Array<{key: string, value: Array<string>}}
   */
  getRequiredActions = () => {
    const records = [];

    const excessGW2 = this.getExcessGW2();
    if (excessGW2.length) {
      records.push({
        key: 'Extra GW2',
        value: excessGW2.map((o) => o.name),
      });
    }

    const excessDiscord = this.getExcessDiscord().filter(
      (o) => this._getRole(o) !== 'Bots' && this._getRole(o) !== 'Guest'
    );
    if (excessDiscord.length) {
      records.push({
        key: 'Extra Discord',
        value: excessDiscord.map(
          (o) => `${o} (${this._getRole(o) || 'No Role'})`
        ),
      });
    }

    const noRoles = this.getNoRoles();
    if (noRoles.length) {
      records.push({
        key: 'Has No Roles',
        value: noRoles,
      });
    }

    const multipleRoles = this.getMultipleRoles();
    if (multipleRoles.length) {
      records.push({
        key: 'Has Multiple Roles',
        value: multipleRoles.map(
          (o) =>
            `${o} (${this._getRoles(o)
              .map((o) => o.name)
              .join(', ')})`
        ),
      });
    }

    const mismatchedRoles = this.getMismatchedRoles();
    if (mismatchedRoles.length) {
      records.push({
        key: 'Mismatched Roles (GW2/Discord)',
        value: mismatchedRoles,
      });
    }

    const needsPromotion = this.getNeedsPromotion();
    if (needsPromotion.length) {
      records.push({
        key: 'Needs Promotion',
        value: needsPromotion.map((o) => o.name),
      });
    }

    return records;
  };

  // Helper methods - not supposed to be used outside of the class.

  /**
   * Compare two dates to see which is earlier.
   *
   * @param {string | number} aJoined first join date
   * @param {string | number} bJoined second join date
   * @returns positive if a is earlier than b.
   */
  _compareDate(aJoined, bJoined) {
    const bDate = new Date(bJoined);
    const aDate = new Date(aJoined);
    return aDate - bDate;
  }

  /**
   * Compare two ranks based on validRanks object.
   *
   * @param {string} aRank first rank
   * @param {string} bRank second rank
   * @returns positive if aRank > bRank, negative if aRank < bRank
   */
  _compareRank(aRank, bRank) {
    const aVal =
      this._validRanks[aRank] || Object.keys(this._validRanks).length;
    const bVal =
      this._validRanks[bRank] || Object.keys(this._validRanks).length;

    return aVal - bVal;
  }

  /**
   * Sort discord member by rank then date
   * @param {Array<GuildMember>} discordMembers discord members to sort
   * @returns {Array<GuildMember>} sorted discord members
   */
  _sortDiscordMembers(discordMembers) {
    return discordMembers.sort((a, b) => {
      let value = this._compareRank(this._getRole(a), this._getRole(b));
      if (value === 0) {
        value = this._compareDate(a.joinedTimestamp, b.joinedTimestamp);
      }
      return value;
    });
  }

  /**
   * Sort GW2 members by rank then date
   * @param {Array<GW2Member>} gw2Members
   * @returns {Array<GW2Member>} sorted gw2 members
   */
  _sortGW2Members(gw2Members) {
    return gw2Members.sort((a, b) => {
      let value = this._compareRank(a.rank, b.rank);
      if (value === 0) {
        value = this._compareDate(a.joined, b.joined);
      }
      return value;
    });
  }

  /**
   * Get the first role of a Discord Member.
   *
   * @param {GuildMember} discordMember Discord Member to get role
   * @returns {string} Discord Role
   */
  _getRole(discordMember) {
    const role = this._getRoles(discordMember)[0];
    return role ? role.name : null;
  }

  /**
   * Get the roles of a Discord Member.
   *
   * @param {GuildMember} discordMember
   * @returns {Array<string>} Discord Roles
   */
  _getRoles(discordMember) {
    return discordMember.roles.cache
      .array()
      .filter((r) => Object.keys(this._validRanks).includes(r.name));
  }
}

class GW2Member {
  /**
   * Constructor
   * @param {string} name
   * @param {string} rank
   * @param {string} joined
   */
  constructor(name, rank, joined) {
    this.name = name;
    this.rank = rank;
    this.joined = joined;
  }
}

module.exports = {
  DataProcessor,
  GW2Member,
};
