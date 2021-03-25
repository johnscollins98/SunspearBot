const { DataProcessor } = require('../../src/utils/DataProcessor');
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require('../mocks/mockData');

test('excessDiscord with same members', () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getExcessDiscord()).toEqual([]);
});

test('excessDiscord with one missing discord', () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers.slice(0, mockDiscordMembers.length - 1),
    mockValidRanks
  );

  expect(dataProcessor.getExcessDiscord()).toEqual([]);
});

test('excessDiscord with one missing gw2', () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members.slice(1, mockDiscordMembers.length),
    mockDiscordMembers,
    mockValidRanks
  );

  const expectedObj = mockDiscordMembers[0];
  expect(dataProcessor.getExcessDiscord()).toEqual([expectedObj]);
});
