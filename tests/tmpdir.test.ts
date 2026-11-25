import { tmpdir } from 'node:os';

describe('a test run', () => {
  it('gives the tests a temporary directory of its own, which goes with it', () => {
    // Given a run of the suite, whose tests make directories and leave them

    // When a test asks where to make one
    const directory = tmpdir();

    // Then it is inside the run's, and not the machine's
    expect(directory).toMatch(/\/jest-run-\w+$/);
  });
});
