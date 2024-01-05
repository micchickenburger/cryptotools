/**
 * @file Contains functionality for the Secure Remote Password (SRP) Protocol
 * @author Micah Henning
 * @copyright (C) 2023 Micah Henning
 * @license GPL-3.0-or-later
 *
 * The Secure Remote Password (SRP) Protocol is a Password-Authenticated Key
 * Exchange (PAKE) protocol, and enables a user and a server to authenticate
 * themselves to each other without the user ever transmitting their password
 * to the server.  Instead, the server stores a salt and verifier, and a proof
 * process occurs in both directions.
 */

import {
  createVerifierAndSalt, SRPParameters, SRPRoutines,
} from 'tssrp6a';
import { showResults } from '../../lib/result';
import { handleError } from '../../lib/error';
import { ENCODING } from '../../lib/encode';

// Strictly enfore 6a by including the identity in the verifier
class SRP6aRoutines extends SRPRoutines {
  public computeIdentityHash(I: string, P: string): Promise<ArrayBuffer> {
    return this.hash((new TextEncoder()).encode(`${I}:${P}`).buffer);
  }
}

// Produce a salt and verifier to send to server during account registration
const register = async (
  username: string,
  password: string,
  strict: boolean,
  primeGroup: number,
  hashAlgorithm: string,
) => {
  const group = SRPParameters.PrimeGroup[primeGroup];
  const hash = SRPParameters.H[hashAlgorithm];
  const params = new SRPParameters(group, hash);

  const srp6aNimbusRoutines = strict ? new SRP6aRoutines(params) : new SRPRoutines(params);

  const { s: salt, v: verifier } = await createVerifierAndSalt(
    srp6aNimbusRoutines,
    username,
    password,
  );
  return { salt, verifier };
};

const srpSettings = document.querySelector<HTMLElement>('#hash-SRP')!;
const button = srpSettings.querySelector<HTMLButtonElement>('button')!;

button.addEventListener('click', async () => {
  const strict = srpSettings.querySelector<HTMLInputElement>('input.strict')!.checked;
  const primeGroup = Number(srpSettings.querySelector<HTMLSelectElement>('select.prime-group')!.selectedOptions[0].value);
  const hashAlgorithm = srpSettings.querySelector<HTMLSelectElement>('select.hash-algorithm')!.selectedOptions[0].dataset.alg;
  const username = srpSettings.querySelector<HTMLInputElement>('input.identity')?.value || '';
  const password = srpSettings.querySelector<HTMLInputElement>('input[type="password"]')?.value || '';

  try {
    const { salt, verifier } = await register(
      username,
      password,
      strict,
      primeGroup,
      String(hashAlgorithm),
    );

    showResults([
      { label: 'Salt • Store in user record', value: salt.toString(), defaultEncoding: ENCODING.BIGINT },
      { label: 'Verifier • Store in user record', value: verifier.toString(), defaultEncoding: ENCODING.BIGINT },
      { label: 'Prime', value: SRPParameters.PrimeGroup[primeGroup].N.toString(), defaultEncoding: ENCODING.BIGINT },
    ]);
  } catch (e) { handleError(e); }
});
