const axios = require('axios');

const getDiscordMembers = async (guild) => {
  const members = await guild.members.fetch();
  const ranks = [
    'Spearmarshal',
    'General',
    'Captain',
    'First Spear',
    'Second Spear',
    'Bots',
    'Guest',
  ];

  return members.array().map((m) => {
    const roles = m.roles.cache
      .array()
      .filter((r) => ranks.includes(r.name))
      .map((r) => r.name);
    const role = roles[0];

    return {
      name: m.displayName,
      role,
      roles,
      joined: m.joinedTimestamp,
    };
  });
};

const getGW2Members = async () => {
  const response = await axios.get(`https://api.guildwars2.com/v2/guild/${process.env.GW2_GUILD_ID}/members`, {
    headers: {
      Authorization: `Bearer ${process.env.GW2_API_KEY}`
    }
  });
  return response.data;
};

const getExcessGW2 = (gw2Members, discordMembers) => {
  const filtered = gw2Members.filter((gw2) => {
    const testName = gw2.name.split(".")[0].toLowerCase();
    return !discordMembers.some((m) => m.name.toLowerCase().includes(testName));
  });
  return sortGW2Members(filtered);
};

const getExcessDiscord = (gw2Members, discordMembers) => {
  const filtered = discordMembers.filter(discordMember => {
    return !gw2Members.some(m => discordMember.name.toLowerCase().includes(m.name.split(".")[0].toLowerCase()));
  })
  return sortDiscordMembers(filtered);
}

const getNoRoles = (discordMembers) => {
  return discordMembers.filter(o => !o.role);
}

const getMultipleRoles = (discordMembers) => {
  return discordMembers.filter(o => o.roles.length > 1);
}

const getMismatchedRoles = (gw2Members, discordMembers) => {
  return gw2Members.filter(gw2 => {
    const testName = gw2.name.split(".")[0].toLowerCase();
    const discordMember = findDiscordRecord(testName, discordMembers);
    if (!discordMember) return false;
    if (discordMember.roles.length !== 1) return false;

    return discordMember.role !== gw2.rank;
  })
  .map(gw2 => {
    const testName = gw2.name.split(".")[0].toLowerCase();
    const discordMember = findDiscordRecord(testName, discordMembers);
    return `${gw2.name} (${gw2.rank}/${discordMember.role})`
  })
}

const getNeedsPromotion = (gw2Members) => {
  return gw2Members.filter(gw2 => {
    if (gw2.rank !== "Second Spear") return false;

    const date = new Date(gw2.joined.split("T")[0]);
    const diffMilliseconds = Math.abs(Date.now() - date);
    const diffDays = Math.floor(diffMilliseconds / (1000 * 60 * 60 * 24));
    return diffDays >= 14;
  })
}

const sortDiscordMembers = (discordMembers) => {
  return discordMembers.sort((a, b) => {
    let value = compareRank(a.role, b.role);
    if (value === 0) {
      value = compareDate(a.joined, b.joined);
    }
    return value;
  })
}

const sortGW2Members = (gw2Members) => {
  return gw2Members.sort((a, b) => {
    let value = compareRank(a.rank, b.rank);
    if (value === 0) {
      value = compareDate(a.joined, b.joined);
    }
    return value;
  });
};

const findDiscordRecord = (testName, discordMembers) => {
  // check for exact match
  let discordMember = discordMembers.find(
    (m) => m.name.toLowerCase() === testName
  );

  // check for name before are after a space
  if (!discordMember) {
    discordMember = discordMembers.find((m) => {
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
    discordMember = discordMembers.find((m) => {
      const test = new RegExp(`\\(${testName}\\)`);
      return m.name.toLowerCase().match(test);
    });
  }

  // check for any inclusion
  if (!discordMember) {
    discordMember = discordMembers.find((m) =>
      m.name.toLowerCase().includes(testName)
    );
  }

  return discordMember;
}

const compareDate = (aJoined, bJoined) => {
  const bDate = new Date(bJoined);
  const aDate = new Date(aJoined);
  return aDate - bDate;
}

const compareRank = (aRank, bRank) => {
  const rankSortValues = {
    Spearmarshal: 9,
    General: 8,
    Commander: 7,
    Captain: 6,
    "First Spear": 5,
    "Second Spear": 4,
    "Third Spear": 3,
    Guest: 2,
    Bots: 1,
  };

  const aVal = rankSortValues[aRank] || 0;
  const bVal = rankSortValues[bRank] || 0;

  return bVal - aVal;
};

module.exports = {
  getDiscordMembers,
  getGW2Members,
  getExcessGW2,
  getExcessDiscord,
  getMultipleRoles,
  getNeedsPromotion,
  getMismatchedRoles,
  sortDiscordMembers,
  getNoRoles,
  sortGW2Members
};
