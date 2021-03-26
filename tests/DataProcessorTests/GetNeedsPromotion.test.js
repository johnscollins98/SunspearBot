const { DataProcessor } = require('../../src/utils/DataProcessor');
const {
  mockValidRanks,
  mockDiscordMembers,
  mockGW2Members,
} = require('../mocks/mockData');

describe('get needs promtion', () => {
  test('GetNeedsPromotion without failing', () => {
    const dataProcessor = new DataProcessor(
      mockGW2Members,
      mockDiscordMembers,
      mockValidRanks
    );
    dataProcessor.getNeedsPromotion();
  });

  test('GetNeedsPromotion gets correct object', () => {
    const dataProcessor = new DataProcessor(
      mockGW2Members,
      mockDiscordMembers,
      mockValidRanks
    );
    expect(dataProcessor.getNeedsPromotion()[0].name).toEqual(
      'NeedsPromoted.5432'
    );
  });

  test('GetNeedsPromotion with no candidates', () => {
    const idx = mockGW2Members.findIndex(
      (o) => o.name === 'NeedsPromoted.5432'
    );
    const ourGw2Members = [...mockGW2Members];
    ourGw2Members.splice(idx);

    const dataProcessor = new DataProcessor(
      ourGw2Members,
      mockDiscordMembers,
      mockValidRanks
    );
    expect(dataProcessor.getNeedsPromotion()).toEqual([]);
  });
});
