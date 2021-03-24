class MockDiscordUser {
  constructor(name, id, roles, joinedTimestamp) {
    this.displayName = name;
    this.id = id;
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
