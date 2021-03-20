const MockDiscordUser = require('./MockDiscordUser');

const mockGW2Members = [
  {
    name: 'Test.1234',
    rank: 'Spearmarshal',
    joined: '2020-03-21T00:00:00.000Z',
  },
  { name: 'Other.3456', rank: 'General', joined: '2020-03-21T00:00:00.000Z' },
  { name: 'Captain.1324', rank: 'Captain', joined: '2020-03-21T00:00:00.000Z' },
  {
    name: 'FirstSpear.5432',
    rank: 'First Spear',
    joined: '2021-03-20:T00:00:00.000Z',
  },
  {
    name: 'NeedsPromoted.5432',
    rank: 'Second Spear',
    joined: '2020-03-20:T00:00:00.000Z',
  },
  {
    name: 'SecondSpear.5432',
    rank: 'Second Spear',
    joined: new Date().toISOString(),
  },
];

const mockDiscordMembers = [
  new MockDiscordUser('Test', ['Spearmarshal'], 1616253509),
  new MockDiscordUser('Other', ['General'], 1616253509),
  new MockDiscordUser('Captain', ['Captain'], 1616253509),
  new MockDiscordUser('FirstSpear', ['First Spear'], 1616253509),
  new MockDiscordUser('NeedsPromoted', ['Second Spear'], 1616253509),
  new MockDiscordUser('SecondSpear', ['Second Spear'], 1616253509),
];

const mockValidRanks = [
  { id: 'Spearmarshal', order: 1 },
  { id: 'General', order: 2 },
  { id: 'Captain', order: 3 },
  { id: 'First Spear', order: 4 },
  { id: 'Second Spear', order: 5 },
  { id: 'Guest', order: 6 },
  { id: 'Bots', order: 7 },
];

module.exports = {
  mockGW2Members,
  mockDiscordMembers,
  mockValidRanks,
};
