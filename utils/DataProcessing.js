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
  return discordMembers.filter(o => o.roles.length === 0);
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

    return discordMember.roles[0].name !== gw2.rank;
  })
  .map(gw2 => {
    const testName = gw2.name.split(".")[0].toLowerCase();
    const discordMember = findDiscordRecord(testName, discordMembers);
    return `${gw2.name} (${gw2.rank}/${discordMember.roles[0].name})`
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
    let value = compareRank(a.roles[0], b.roles[0]);
    if (value === 0) {
      const bDate = new Date(b.joined);
      const aDate = new Date(a.joined);
      value = aDate - bDate;
    }
    return value;
  })
}

const sortGW2Members = (gw2Members) => {
  return gw2Members.sort((a, b) => {
    let value = compareRank(a.rank, b.rank);
    if (value === 0) {
      const bDate = new Date(b.joined);
      const aDate = new Date(a.joined);
      value = aDate - bDate;
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
  getExcessGW2,
  getExcessDiscord,
  getMultipleRoles,
  getNeedsPromotion,
  getMismatchedRoles,
  sortDiscordMembers,
  getNoRoles,
  sortGW2Members
};
