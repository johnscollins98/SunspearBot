const { DataProcessor } = require('../../utils/DataProcessor');
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require('../mocks/mockData');

beforeAll(() => {
  this.dataProcessor = new DataProcessor(
    mockGW2Members,
    mockDiscordMembers,
    mockValidRanks
  );
});

test('runs without failing', () => {
  this.dataProcessor.matchDiscordName('name.1234', 'name');
});

test('matches exact same name', () => {
  expect(this.dataProcessor.matchDiscordName('name.1234', 'name')).toBeTruthy();
});

test('matches with different cases', () => {
  expect(this.dataProcessor.matchDiscordName('NAME', 'name')).toBeTruthy();
});

test('match if name is in brackets', () => {
  expect(
    this.dataProcessor.matchDiscordName('name.1234', 'test (name)')
  ).toBeTruthy();
});

test('false if discord name has anything extra', () => {
  expect(
    this.dataProcessor.matchDiscordName('name.1234', 'name123')
  ).toBeFalsy();
});

test('match when ignoring surrounding whitespace', () => {
  expect(
    this.dataProcessor.matchDiscordName('name.1234', ' name ')
  ).toBeTruthy();
});

test('match with white space in name', () => {
  expect(
    this.dataProcessor.matchDiscordName('two words.1234', ' two words ')
  ).toBeTruthy();
})

test('match if discord name matches, but with any emojis', () => {
  expect(
    this.dataProcessor.matchDiscordName('name.1234', '😀 name')
  ).toBeTruthy();
});
