import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';

dotenv.config();

/**
 *  Remove `.skip` to proceed with testing according to requirements.
 */
describe('Test Scallop Kit', async () => {
  it('Should pass', async () => {
    expect(true).toBe(true);
  });
});
