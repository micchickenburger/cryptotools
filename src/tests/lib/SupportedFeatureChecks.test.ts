import { beforeEach, describe, expect, it } from 'vitest';
import SupportedFeatureChecks from '../../lib/SupportedFeatureChecks';

class IDBFactory {};

let fakeWindow: {
    BigInt: Function;
    indexedDB: IDBFactory;
    crypto: {
        getRandomValues: Function;
        subtle: {
            constructor: Function;
        };
    };
};

let failWindow = {};

beforeEach(() => {
    fakeWindow = {
        BigInt: function() {},
        indexedDB: new IDBFactory(),
        crypto: {
            getRandomValues: function() {},
            subtle: {
            constructor: function() {},
            },
        },
    };
    
    failWindow = {};
});

describe('SupportedFeatureChecks', () => {
  it('checks for IndexedDB support', () => {
    expect(SupportedFeatureChecks.IndexedDB(fakeWindow, IDBFactory)).toBe(true);
    expect(SupportedFeatureChecks.IndexedDB(failWindow, IDBFactory)).toBe(false);
  });

  it('checks for BigInt support', () => {
    expect(SupportedFeatureChecks.BigInt(fakeWindow)).toBe(true);
    expect(SupportedFeatureChecks.BigInt(failWindow)).toBe(false);
  });

  it('checks for secure random support', () => {
    expect(SupportedFeatureChecks.SecureRandom(fakeWindow)).toBe(true);
    expect(SupportedFeatureChecks.SecureRandom(failWindow)).toBe(false);
  });

  it('checks for WebCrypto API support', () => {
    expect(SupportedFeatureChecks.SubtleCrypto(fakeWindow)).toBe(true);
    expect(SupportedFeatureChecks.SubtleCrypto(failWindow)).toBe(false);
  });
});