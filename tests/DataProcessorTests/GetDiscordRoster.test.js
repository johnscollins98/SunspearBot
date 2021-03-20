const { DataProcessor } = require("../../utils/DataProcessor");
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require("../mocks/mockData");

test("getDiscordRoster runs without failing", () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );

  dataProcessor.getDiscordRoster();
});

test("getDiscordRoster returns proper roster", () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );

  const expected = mockDiscordMembers.map((m) => {
    const roles = m.roles.cache.array().map((o) => o.name);
    const role = roles[0];

    return {
      name: m.displayName,
      joined: m.joinedTimestamp,
      roles,
      role,
    };
  });

  expect(dataProcessor.getDiscordRoster()).toEqual(expected);
});

test("getDiscordRoster sorts properly", () => {
  // re-arrange some objects,
  const ourDiscordMembers = [
    mockDiscordMembers[3],
    mockDiscordMembers[0],
    mockDiscordMembers[4],
    mockDiscordMembers[1],
    mockDiscordMembers[5],
    mockDiscordMembers[2],
  ];

  // ensure arrays are same length
  expect(ourDiscordMembers.length).toBe(mockDiscordMembers.length);

  const dataProcessor = new DataProcessor(
    mockGW2Members,
    ourDiscordMembers,
    mockValidRanks
  );

  const expected = mockDiscordMembers.map((m) => {
    const roles = m.roles.cache.array().map((o) => o.name);
    const role = roles[0];

    return {
      name: m.displayName,
      joined: m.joinedTimestamp,
      roles,
      role,
    };
  });

  expect(dataProcessor.getDiscordRoster()).toEqual(expected);
});
