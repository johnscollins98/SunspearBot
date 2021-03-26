const { DataProcessor } = require('../../src/utils/DataProcessor');
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require('../mocks/mockData');
const MockDiscordUser = require('../mocks/MockDiscordUser');

describe('get required actions', () => {
  let ourGW2;
  let ourDiscord;

  beforeAll(() => {
    ourGW2 = [...mockGW2Members];
    ourGW2.splice(4, 1);

    ourDiscord = [...mockDiscordMembers];
    ourDiscord.splice(4, 1);
  });

  test('runs without failing', () => {
    const dataProcessor = new DataProcessor(
      ourGW2,
      ourDiscord,
      mockValidRanks
    );
    dataProcessor.getRequiredActions();
  });

  test('finds excessDiscord', () => {
    const extra = new MockDiscordUser('Mock', 123, ['General'], 123456);
    const dataProcessor = new DataProcessor(
      ourGW2,
      [...ourDiscord, extra],
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
      [...ourGW2, extra],
      ourDiscord,
      mockValidRanks
    );

    expect(dataProcessor.getRequiredActions()).toEqual([
      { key: 'Extra GW2', value: ['Mock'] },
    ]);
  });

  test('finds no roles', () => {
    const candidate = new MockDiscordUser('Test', 123, [], 1234567);
    const copyDiscord = [...ourDiscord];
    copyDiscord[0] = candidate;
    const dataProcessor = new DataProcessor(
      ourGW2,
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
    const copyDiscord = [...ourDiscord];
    copyDiscord[0] = candidate;
    const dataProcessor = new DataProcessor(
      ourGW2,
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
      ...ourGW2,
      { ...ourGW2[0], rank: 'General' },
    ];
    const dataProcessor = new DataProcessor(
      ourGw2,
      ourDiscord,
      mockValidRanks
    );
    expect(dataProcessor.getRequiredActions()).toEqual([
      {
        key: 'Mismatched Roles (GW2/Discord)',
        value: [`${ourDiscord[0]} (General/Spearmarshal)`],
      },
    ]);
  });
});
