const { DataProcessor } = require('../../src/utils/DataProcessor');
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require('../mocks/mockData');

test('getGW2Roster without failing', () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );

  dataProcessor.getGW2Roster();
});

test('getGW2Roster returns roster', () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getGW2Roster()).toEqual(mockGW2Members);
});

test('getGW2Roster sorting works properly', () => {
  // re-arrange some objects,
  const ourGw2Members = [
    mockGW2Members[3],
    mockGW2Members[0],
    mockGW2Members[4],
    mockGW2Members[1],
    mockGW2Members[5],
    mockGW2Members[2],
  ];

  // ensure the arrays are the same length
  expect(ourGw2Members.length).toEqual(mockGW2Members.length);

  const dataProcessor = new DataProcessor(
    ourGw2Members,
    mockDiscordMembers,
    mockValidRanks
  );
  expect(dataProcessor.getGW2Roster()).toEqual(mockGW2Members);
});
