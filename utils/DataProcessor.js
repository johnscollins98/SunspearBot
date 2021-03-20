const { User } = require("discord.js");

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
    return this._gw2Members.filter((gw2) => {
      const testName = gw2.name.split(".")[0].toLowerCase();
      return !this._discordMembers.some((m) =>
        m.name.toLowerCase().includes(testName)
      );
    });
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
      if (gw2.rank !== "Second Spear") return false;

      const date = new Date(gw2.joined.split("T")[0]);
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
    return this._discordMembers.filter((discordMember) => {
      return !this._gw2Members.some((m) =>
        discordMember.name
          .toLowerCase()
          .includes(m.name.split(".")[0].toLowerCase())
      );
    });
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
    let discordMember = this._discordMembers.find(
      (m) => m.name.toLowerCase() === testName
    );

    // check for name before are after a space
    if (!discordMember) {
      discordMember = this._discordMembers.find((m) => {
        const testAfter = new RegExp(`${testName}\\s`);
        const testBefore = new RegExp(`\\s${testName}`);
        return (
          m.name.toLowerCase().match(testAfter) ||
          m.name.toLowerCase().match(testBefore)
        );
      });
    }

    // check for name inside parenthesis
    if (!discordMember) {
      discordMember = this._discordMembers.find((m) => {
        const test = new RegExp(`\\(${testName}\\)`);
        return m.name.toLowerCase().match(test);
      });
    }

    // check for any inclusion
    if (!discordMember) {
      discordMember = this._discordMembers.find((m) =>
        m.name.toLowerCase().includes(testName)
      );
    }

    return discordMember;
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
      .filter((gw2) => {
        const testName = gw2.name.split(".")[0].toLowerCase();
        const discordMember = this.findDiscordRecord(testName);
        if (!discordMember) return false;
        if (discordMember.roles.length !== 1) return false;

        return discordMember.role !== gw2.rank;
      })
      .map((gw2) => {
        const testName = gw2.name.split(".")[0].toLowerCase();
        const discordMember = this.findDiscordRecord(testName);
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
    const aVal = this._validRanks[aRank] || 0;
    const bVal = this._validRanks[bRank] || 0;

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
