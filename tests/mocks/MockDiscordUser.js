class MockDiscordUser {
  constructor(name, roles, joinedTimestamp) {
    this.displayName = name;
    this.roles = {
      cache: {
        array: () =>
          roles.map((o) => ({
            name: o
          })),
      },
    };
    this.joinedTimestamp = joinedTimestamp;
  }
}

module.exports = MockDiscordUser;
