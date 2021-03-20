class MockDiscordUser {
  constructor(name, roles, joinedTimestamp) {
    this.displayName = name;
    this.roles = {
      cache: { array: () => roles },
    };
    this.joinedTimestamp = joinedTimestamp;
  }
}

module.exports = MockDiscordUser;