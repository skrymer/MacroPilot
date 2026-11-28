import { proteinWords } from './proteinWords';

describe('proteinWords', () => {
  it('says how much protein is still to go, shown and spoken', () => {
    // Given a day 69 g short of its floor

    // When its protein is put in words
    const words = proteinWords({ standing: 'to go', grams: 69, share: 63 / 132 }, 132);

    // Then they say what is to go, its figure joined to its unit
    expect(words.shown).toMatch(/^69\sg protein to go$/);
    expect(words.spoken).toBe('69 grams of protein to go');
  });

  it('says the floor is met, shown and spoken alike', () => {
    // Given a day at its floor

    // When its protein is put in words
    const words = proteinWords({ standing: 'met', share: 1 }, 132);

    // Then they say the floor is met
    expect(words).toEqual({ shown: 'protein floor met', spoken: 'protein floor met' });
  });

  it('says what is known of protein some entries left out, against the floor', () => {
    // Given a day where at least 40 g are known, under a floor of 132 g

    // When its protein is put in words
    const words = proteinWords({ standing: 'at least', grams: 40, share: 40 / 132 }, 132);

    // Then they say what is known and the floor, never what is to go
    expect(words.shown).toMatch(/^at least 40\sg, floor 132\sg$/);
    expect(words.spoken).toBe('at least 40 grams of protein, floor 132 grams');
  });

  it('says protein nobody stated is not stated, never a figure', () => {
    // Given a day whose entries state no protein

    // When its protein is put in words
    const words = proteinWords({ standing: 'not stated', share: 0 }, 132);

    // Then they say it is not stated
    expect(words).toEqual({ shown: 'protein not stated', spoken: 'protein not stated' });
  });
});
