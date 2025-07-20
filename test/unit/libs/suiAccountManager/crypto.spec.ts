import { describe, it, expect } from 'vitest';
import { generateMnemonic } from 'src/libs/suiAccountManager/crypto';

describe.only('generateMnemonic', () => {
  it('should generate a 24-word mnemonic by default', () => {
    const mnemonic = generateMnemonic();
    expect(typeof mnemonic).toBe('string');
    expect(mnemonic.split(' ').length).toBe(24);
  });

  it('should generate a 12-word mnemonic when specified', () => {
    const mnemonic = generateMnemonic(12);
    expect(typeof mnemonic).toBe('string');
    expect(mnemonic.split(' ').length).toBe(12);
  });
});
