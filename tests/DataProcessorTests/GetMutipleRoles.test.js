const { DataProcessor } = require('../../src/utils/DataProcessor');
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require('../mocks/mockData');
const MockDiscordUser = require('../mocks/MockDiscordUser');

test('getMultipleRoles runs without failing', () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );

  dataProcessor.getMultipleRoles();
});

test('getMultipleRoles with no candidates', () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getMismatchedRoles()).toEqual([]);
});

test('getMultipleRoles with a candidate', () => {
  const candidate = new MockDiscordUser(
    'Mock',
    123,
    ['Spearmarshal', 'General'],
    12345678
  );
  const ourDiscordMembers = [...mockDiscordMembers, candidate];

  const dataProcessor = new DataProcessor(
    mockGW2Members,
    ourDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getMultipleRoles()).toEqual([candidate]);
});
