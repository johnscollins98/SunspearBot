const { DataProcessor } = require("../../utils/DataProcessor");
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require("../mocks/mockData");
const MockDiscordUser = require("../mocks/MockDiscordUser");

test("getMismatchedRoles runs without failing", () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );

  dataProcessor.getMismatchedRoles();
});

test("getMismatchedRoles with no candidates", () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getMismatchedRoles()).toEqual([]);
});

test("getMismatchedRoles with an extra discord", () => {
  const extra = new MockDiscordUser(
    "Mock",
    ["Spearmarshal", "General"],
    12345678
  );
  const ourDiscordMembers = [...mockDiscordMembers, extra];

  const dataProcessor = new DataProcessor(
    mockGW2Members,
    ourDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getMismatchedRoles()).toEqual([]);
});

test("getMismatchedRoles with an extra gw2", () => {
  const extra = {
    name: "Mock",
    rank: "Spearmarshal",
    joined: "2020-03-01T00:00:00.000Z",
  };

  const dataProcessor = new DataProcessor(
    [...mockGW2Members, extra],
    mockDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getMismatchedRoles()).toEqual([]);
});

test("getMismatchedRoles with multiple discord roles", () => {
  const ourDiscordMembers = [
    ...mockDiscordMembers.slice(0, mockDiscordMembers.length - 2),
    new MockDiscordUser("SecondSpear", ["First Spear", "Second Spear"], 123456),
  ];

  const dataProcessor = new DataProcessor(
    mockGW2Members,
    ourDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getMismatchedRoles()).toEqual([]);
});

test("getMismatchedRoles with no discord roles", () => {
  const ourDiscordMembers = [
    ...mockDiscordMembers.slice(0, mockDiscordMembers.length - 2),
    new MockDiscordUser("SecondSpear", [], 123456),
  ];

  const dataProcessor = new DataProcessor(
    mockGW2Members,
    ourDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getMismatchedRoles()).toEqual([]);
});

test("getMismatchedRoles with a candidate", () => {
  const ourDiscordMembers = [
    ...mockDiscordMembers.slice(0, mockDiscordMembers.length - 2),
    new MockDiscordUser("SecondSpear", ["First Spear"], 123456),
  ];

  const dataProcessor = new DataProcessor(
    mockGW2Members,
    ourDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getMismatchedRoles()).toEqual([
    "SecondSpear.5432 (Second Spear/First Spear)",
  ]);
});
