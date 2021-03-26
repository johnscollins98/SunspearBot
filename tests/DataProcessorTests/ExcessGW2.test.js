const { DataProcessor } = require('../../src/utils/DataProcessor');
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require('../mocks/mockData');

describe('excess gw2', () => {
  test('excessGW2 with same members', () => {
    const dataProcessor = new DataProcessor(
      mockGW2Members,
      mockDiscordMembers,
      mockValidRanks
    );

    expect(dataProcessor.getExcessGW2()).toEqual([]);
  });

  test('excessGW2 with one missing discord', () => {
    const dataProcessor = new DataProcessor(
      mockGW2Members,
      mockDiscordMembers.slice(0, mockDiscordMembers.length - 1),
      mockValidRanks
    );

    expect(dataProcessor.getExcessGW2()).toEqual([
      mockGW2Members[mockGW2Members.length - 1],
    ]);
  });

  test('excessGW2 with one missing gw2', () => {
    const dataProcessor = new DataProcessor(
      mockGW2Members.slice(0, mockDiscordMembers.length - 1),
      mockDiscordMembers,
      mockValidRanks
    );

    expect(dataProcessor.getExcessGW2()).toEqual([]);
  });
});
