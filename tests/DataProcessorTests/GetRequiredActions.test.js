const { DataProcessor } = require('../../src/utils/DataProcessor');
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require('../mocks/mockData');
const MockDiscordUser = require('../mocks/MockDiscordUser');

beforeAll(() => {
  this.mockGW2Members = [...mockGW2Members];
  this.mockGW2Members.splice(4, 1);

  this.mockDiscordMembers = [...mockDiscordMembers];
  this.mockDiscordMembers.splice(4, 1);
});

test('runs without failing', () => {
  const dataProcessor = new DataProcessor(
    this.mockGW2Members,
    this.mockDiscordMembers,
    mockValidRanks
  );
  dataProcessor.getRequiredActions();
});

test('finds excessDiscord', () => {
  const extra = new MockDiscordUser('Mock', 123, ['General'], 123456);
  const dataProcessor = new DataProcessor(
    this.mockGW2Members,
    [...this.mockDiscordMembers, extra],
    mockValidRanks
  );

  expect(dataProcessor.getRequiredActions()).toEqual([
    { key: 'Extra Discord', value: [`${extra} (General)`] },
  ]);
});

test('finds excessGW2', () => {
  const extra = {
    name: 'Mock',
    rank: 'General',
    joined: '2020-01-01T00:00:00.000Z',
  };
  const dataProcessor = new DataProcessor(
    [...this.mockGW2Members, extra],
    this.mockDiscordMembers,
    mockValidRanks
  );

  expect(dataProcessor.getRequiredActions()).toEqual([
    { key: 'Extra GW2', value: ['Mock'] },
  ]);
});

test('finds no roles', () => {
  const candidate = new MockDiscordUser('Test', 123, [], 1234567);
  const copyDiscord = [...this.mockDiscordMembers];
  copyDiscord[0] = candidate;
  const dataProcessor = new DataProcessor(
    this.mockGW2Members,
    copyDiscord,
    mockValidRanks
  );

  expect(dataProcessor.getRequiredActions()).toEqual([
    { key: 'Has No Roles', value: [candidate] },
  ]);
});

test('find multiple roles', () => {
  const candidate = new MockDiscordUser(
    'Test',
    123,
    ['Spearmarshal', 'General'],
    12345767
  );
  const copyDiscord = [...this.mockDiscordMembers];
  copyDiscord[0] = candidate;
  const dataProcessor = new DataProcessor(
    this.mockGW2Members,
    copyDiscord,
    mockValidRanks
  );

  expect(dataProcessor.getRequiredActions()).toEqual([
    {
      key: 'Has Multiple Roles',
      value: [`${candidate} (Spearmarshal, General)`],
    },
  ]);
});

test('find needs promotion', () => {
  const dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );
  expect(dataProcessor.getRequiredActions()).toEqual([
    { key: 'Needs Promotion', value: ['NeedsPromoted.5432'] },
  ]);
});

test('find mismatched role', () => {
  const ourGw2 = [
    ...this.mockGW2Members,
    { ...this.mockGW2Members[0], rank: 'General' },
  ];
  const dataProcessor = new DataProcessor(
    ourGw2,
    this.mockDiscordMembers,
    mockValidRanks
  );
  expect(dataProcessor.getRequiredActions()).toEqual([
    {
      key: 'Mismatched Roles (GW2/Discord)',
      value: [`${this.mockDiscordMembers[0]} (General/Spearmarshal)`],
    },
  ]);
});
