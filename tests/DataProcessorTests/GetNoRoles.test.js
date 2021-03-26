const { DataProcessor } = require('../../src/utils/DataProcessor');
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require('../mocks/mockData');
const MockDiscordUser = require('../mocks/MockDiscordUser');

describe('get no roles', () => {
  test('getNoRoles runs without failing', () => {
    const dataProcessor = new DataProcessor(
      mockGW2Members,
      mockDiscordMembers,
      mockValidRanks
    );

    dataProcessor.getNoRoles();
  });

  test('getNoRoles with no candidates', () => {
    const dataProcessor = new DataProcessor(
      mockGW2Members,
      mockDiscordMembers,
      mockValidRanks
    );

    expect(dataProcessor.getNoRoles()).toEqual([]);
  });

  test('getNoRoles with a candidate', () => {
    const candidate = new MockDiscordUser('Mock', 123, [], 12345678);
    const ourDiscordMembers = [...mockDiscordMembers, candidate];

    const dataProcessor = new DataProcessor(
      mockGW2Members,
      ourDiscordMembers,
      mockValidRanks
    );

    expect(dataProcessor.getNoRoles()).toEqual([candidate]);
  });

  test('getNoRoles with a bot', () => {
    const candidate = new MockDiscordUser('Mock', 123, ['Bots'], 12345678);
    const ourDiscordMembers = [...mockDiscordMembers, candidate];

    const dataProcessor = new DataProcessor(
      mockGW2Members,
      ourDiscordMembers,
      mockValidRanks
    );

    expect(dataProcessor.getNoRoles()).toEqual([]);
  });
});
