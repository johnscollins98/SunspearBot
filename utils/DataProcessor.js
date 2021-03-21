const { User } = require('discord.js');

class DataProcessor {
  /**
   * Constructor
   * @param {Array<{name: string, rank: string, joined: string}>} gw2Members
   * @param {Array<User>} discordMembers
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

    this._discordMembers = this._sortDiscordMembers(
      discordMembers.map((m) => {
        const roles = m.roles.cache
          .array()
          .filter((r) => Object.keys(this._validRanks).includes(r.name))
          .map((r) => r.name);
        const role = roles[0];

        return new DiscordMember(m.displayName, role, roles, m.joinedTimestamp);
      })
    );
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
   * @returns {Array<DiscordMember>} excess discord members
   */
  getExcessDiscord() {
    return this._discordMembers.filter(
      (discordMember) =>
        !this._gw2Members.some((gw2Member) =>
          this.matchDiscordName(gw2Member.name, discordMember.name)
        )
    );
  }

  /**
   * Get discord members sorted by rank then data
   * @returns {Array<DiscordMember>} sorted discord members
   */
  getDiscordRoster() {
    return this._discordMembers;
  }

  /**
   * Find Discord Member matching a given test name
   *
   * @param {string} testName
   * @returns {DiscordMember} found discord member
   */
  findDiscordRecord = (testName) => {
    // check for exact match
    const discordMember = this._discordMembers.find((m) =>
      this.matchDiscordName(testName, m.name)
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
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '') // strip any emojis
      .trim(); // trim any leading/trailing whitespace (should only be present if they have an emoji at the start)

    return discordName === testName || discordName.includes(`(${testName})`);
  };

  /**
   * Get Discord Members with no roles
   * @returns {Array<DiscordMember>}
   */
  getNoRoles() {
    return this._discordMembers.filter((o) => !o.role);
  }

  /**
   * Get Discord Members with multiple roles
   * @returns {Array<DiscordMember>}
   */
  getMultipleRoles() {
    return this._discordMembers.filter((o) => o.roles.length > 1);
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
        if (discordMember.roles.length !== 1) return false;

        return discordMember.role !== gw2.rank;
      })
      .map((gw2) => {
        const discordMember = this.findDiscordRecord(gw2.name);
        return `${gw2.name} (${gw2.rank}/${discordMember.role})`;
      });
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
   * @param {Array<DiscordMember>} discordMembers discord members to sort
   * @returns {Array<DiscordMember>} sorted discord members
   */
  _sortDiscordMembers(discordMembers) {
    return discordMembers.sort((a, b) => {
      let value = this._compareRank(a.role, b.role);
      if (value === 0) {
        value = this._compareDate(a.joined, b.joined);
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

class DiscordMember {
  /**
   * Constructor
   * @param {string} name
   * @param {string} role
   * @param {Array<string>} roles
   * @param {number} joined
   */
  constructor(name, role, roles, joined) {
    this.name = name;
    this.role = role;
    this.roles = roles;
    this.joined = joined;
  }
}

module.exports = {
  DataProcessor,
  DiscordMember,
  GW2Member,
};
