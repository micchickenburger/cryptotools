/**
 * @file Checks browser for essential features
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 */

class SupportedFeatureChecks {
  public static BigInt(window: any) {
    try {
      if (window.BigInt instanceof Function && 1n) return true;
    } catch (e) { /* do nothing */ }
    return false;
  }

  public static IndexedDB(window: any, T: any = window.IDBFactory) {
    try {
      if (window.indexedDB instanceof T) return true;
    } catch (e) { /* do nothing */ }
    return false;
  }

  public static SecureRandom(window: any) {
    try {
      if (window.crypto.getRandomValues instanceof Function) return true;
    } catch (e) { /* do nothing */ }
    return false;
  }

  public static SubtleCrypto(window: any) {
    try {
      if (window.crypto.subtle.constructor instanceof Function) return true;
    } catch (e) { /* do nothing */ }
    return false;
  }
}

export default SupportedFeatureChecks;
