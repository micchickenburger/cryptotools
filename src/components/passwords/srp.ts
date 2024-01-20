/**
 * @file Contains functionality for the Secure Remote Password (SRP) Protocol
 * @author Micah Henning <hello@micah.soy>
 * @copyright (C) 2024 Micah Henning
 * license GPL-3.0-or-later
 *
 * The Secure Remote Password (SRP) Protocol is a Password-Authenticated Key
 * Exchange (PAKE) protocol, and enables a user and a server to authenticate
 * themselves to each other without the user ever transmitting their password
 * to the server.  Instead, the server stores a salt and verifier, and a proof
 * process occurs in both directions.
 */

import {
  createVerifierAndSalt, SRPClientSession, SRPParameters, SRPRoutines, SRPServerSession,
} from 'tssrp6a';
import { Result, showResults } from '../../lib/result';
import { handleError } from '../../lib/error';
import { ENCODING } from '../../lib/encode';

type SRPSettings = {
  strict: boolean,
  primeGroup: number,
  hashAlgorithm: string,
};

type Routines = { routines: SRPRoutines };

type SRPIdentity = {
  username: string,
  password: string,
};

type SRPClientOutputs = {
  salt: bigint,
  verifier: bigint,
};

type SRPProofParameters = {
  salt: bigint,
  serverPublicKey: bigint,
};

type RegisterParameters = Routines & SRPIdentity;
type AuthenticateParameters = RegisterParameters & SRPClientOutputs;
type ProveClientParameters = RegisterParameters & SRPProofParameters;

// Strictly enfore 6a by including the identity in the verifier
class SRP6aRoutines extends SRPRoutines {
  public computeIdentityHash(I: string, P: string): Promise<ArrayBuffer> {
    return this.hash((new TextEncoder()).encode(`${I}:${P}`).buffer);
  }
}

// Get SRP parameters
const getSRPRoutines = ({ strict, primeGroup, hashAlgorithm }: SRPSettings) => {
  const group = SRPParameters.PrimeGroup[primeGroup];
  const hash = SRPParameters.H[hashAlgorithm];
  const params = new SRPParameters(group, hash);

  return strict ? new SRP6aRoutines(params) : new SRPRoutines(params);
};

// Produce a salt and verifier to send to server during account registration
const register = async ({ routines, username, password }: RegisterParameters) => {
  const { s: salt, v: verifier } = await createVerifierAndSalt(
    routines,
    username,
    password,
  );
  return { salt, verifier };
};

// Perform only the client proof generation step
const proveClient = async (settings: ProveClientParameters) => {
  const {
    routines,
    username, password,
    salt, serverPublicKey,
  } = settings;

  const client = new SRPClientSession(routines);

  const clientStep1 = await client.step1(username, password);
  // Client sends server username; server gets salt and verifier from user record
  // Server produces private key b and public key B, though B is provided here
  // Server sends client the salt and its public key B
  // Client produces public key A and proof M1
  const clientStep2 = await clientStep1.step2(salt, serverPublicKey);
  // Client sends public key A and proof M1 to server

  const { A, M1 } = clientStep2;
  return { A, M1 };
};

// Produce client and server authentication process
const authenticate = async (settings: AuthenticateParameters) => {
  const {
    routines,
    username, password,
    salt, verifier,
  } = settings;

  const client = new SRPClientSession(routines);
  const server = new SRPServerSession(routines);

  const clientStep1 = await client.step1(username, password);
  // Client sends server username; server gets salt and verifier from user record
  // Server produces private key b and public key B
  const serverStep1 = await server.step1(username, salt, verifier);
  // Server sends client the salt and its public key B
  // Client produces public key A and proof M1
  const clientStep2 = await clientStep1.step2(salt, serverStep1.B);
  // Client sends public key A and proof M1 to server
  // Server produces proof M2, authenticating user
  const serverStep2 = await serverStep1.step2(clientStep2.A, clientStep2.M1);
  // Server sends proof M2 to client
  // Client authenticates server
  await clientStep2.step3(serverStep2);

  const { B } = serverStep1;
  const { A, M1 } = clientStep2;
  const M2 = serverStep2;
  return {
    B, A, M1, M2,
  };
};

const registerSection = document.querySelector<HTMLElement>('#register-SRP')!;
const registerButton = registerSection.querySelector<HTMLButtonElement>('button')!;
const authenticateSection = document.querySelector<HTMLElement>('#authenticate-SRP')!;
const authenticateButton = authenticateSection.querySelector<HTMLButtonElement>('button')!;
const proveIdentitySection = document.querySelector<HTMLElement>('#prove-identity-SRP')!;
const proveIdentityButton = proveIdentitySection.querySelector<HTMLButtonElement>('button')!;

registerButton.addEventListener('click', async () => {
  const strict = registerSection.querySelector<HTMLInputElement>('input.strict')!.checked;
  const primeGroup = Number(registerSection.querySelector<HTMLSelectElement>('select.prime-group')!.selectedOptions[0].value);
  const hashAlgorithm = String(registerSection.querySelector<HTMLSelectElement>('select.hash-algorithm')!.selectedOptions[0].dataset.alg);
  const username = registerSection.querySelector<HTMLInputElement>('input.identity')?.value || '';
  const password = registerSection.querySelector<HTMLInputElement>('input[type="password"]')?.value || '';

  try {
    const routines = getSRPRoutines({ strict, primeGroup, hashAlgorithm });
    const { salt, verifier } = await register({ routines, username, password });

    showResults([
      { label: 'Salt • Store in user record', value: salt.toString(), defaultEncoding: ENCODING.BIGINT },
      { label: 'Verifier • Store in user record', value: verifier.toString(), defaultEncoding: ENCODING.BIGINT },
      { label: 'Prime', value: SRPParameters.PrimeGroup[primeGroup].N.toString(), defaultEncoding: ENCODING.BIGINT },
    ]);
  } catch (e) { handleError(e); }
});

authenticateButton.addEventListener('click', async () => {
  const strict = authenticateSection.querySelector<HTMLInputElement>('input.strict')!.checked;
  const primeGroup = Number(authenticateSection.querySelector<HTMLSelectElement>('select.prime-group')!.selectedOptions[0].value);
  const hashAlgorithm = String(authenticateSection.querySelector<HTMLSelectElement>('select.hash-algorithm')!.selectedOptions[0].dataset.alg);
  const username = authenticateSection.querySelector<HTMLInputElement>('input.identity')?.value || '';
  const password = authenticateSection.querySelector<HTMLInputElement>('input[type="password"]')?.value || '';

  try {
    const salt = BigInt(authenticateSection.querySelector<HTMLTextAreaElement>('.salt textarea')?.value || '');
    const verifier = BigInt(authenticateSection.querySelector<HTMLTextAreaElement>('.verifier textarea')?.value || '');
    const routines = getSRPRoutines({ strict, primeGroup, hashAlgorithm });
    const results: Result[] = [];

    const {
      B, A, M1, M2,
    } = await authenticate({
      routines, username, password, salt, verifier,
    });

    results.push({ label: 'Client Public Key A', value: A.toString(), defaultEncoding: ENCODING.BIGINT });
    results.push({ label: 'Client Proof M1', value: M1.toString(), defaultEncoding: ENCODING.BIGINT });
    results.push({ label: 'Server Public Key B', value: B.toString(), defaultEncoding: ENCODING.BIGINT });
    results.push({ label: 'Server Proof M2', value: M2.toString(), defaultEncoding: ENCODING.BIGINT });

    showResults(results);
  } catch (e) { handleError(e); }
});

proveIdentityButton.addEventListener('click', async () => {
  const strict = proveIdentitySection.querySelector<HTMLInputElement>('input.strict')!.checked;
  const primeGroup = Number(proveIdentitySection.querySelector<HTMLSelectElement>('select.prime-group')!.selectedOptions[0].value);
  const hashAlgorithm = String(proveIdentitySection.querySelector<HTMLSelectElement>('select.hash-algorithm')!.selectedOptions[0].dataset.alg);
  const username = proveIdentitySection.querySelector<HTMLInputElement>('input.identity')?.value || '';
  const password = proveIdentitySection.querySelector<HTMLInputElement>('input[type="password"]')?.value || '';
  const publicKey = proveIdentitySection.querySelector<HTMLTextAreaElement>('.public-key textarea')?.value || '';

  try {
    const salt = BigInt(proveIdentitySection.querySelector<HTMLTextAreaElement>('.salt textarea')?.value || '');
    const routines = getSRPRoutines({ strict, primeGroup, hashAlgorithm });
    const results: Result[] = [];

    // If the user defines the server public key B, then we cannot emulate
    // server-side functions.  So, we can only do the client proof.
    const serverPublicKey = BigInt(publicKey);
    const { A, M1 } = await proveClient({
      routines, username, password, salt, serverPublicKey,
    });

    results.push({ label: 'Client Public Key A', value: A.toString(), defaultEncoding: ENCODING.BIGINT });
    results.push({ label: 'Client Proof M1', value: M1.toString(), defaultEncoding: ENCODING.BIGINT });

    showResults(results);
  } catch (e) { handleError(e); }
});
