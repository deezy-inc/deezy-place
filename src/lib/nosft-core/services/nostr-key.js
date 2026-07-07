// Raw Nostr key wallet provider (DOMAIN === 'nostr').
//
// Lets a user connect by pasting their nostr key directly instead of relying
// on a browser extension (the Alby extension is deprecated). The public key
// flows through the normal session-storage plumbing like any other provider,
// but the private key is intentionally held ONLY in this module's memory:
// it is never written to sessionStorage/localStorage/cookies, so it cannot
// outlive a page load or be read by anything outside this JS context.
// On refresh the user stays connected in view-only mode and is re-prompted
// for their private key the next time a signature is needed.
// @noble/curves is pure JS on purpose: tiny-secp256k1 would pull its async
// WebAssembly loader into every page's bundle (this module is imported by the
// globally mounted modals), which broke SSR and left signing awaiting a wasm
// instantiation that never completed
import { nip19, getPublicKey } from 'nostr-tools';
import { schnorr } from '@noble/curves/secp256k1.js';
import SessionStorage, { SessionsStorageKeys } from './session-storage';

const NOSTR_PROVIDER = 'nostr';
// Fired on window when a signature is requested but no private key is in
// memory; the globally mounted NostrSignModal listens for it.
const NOSTR_PRIVATE_KEY_REQUEST_EVENT = 'deezy:nostr-private-key-request';

const HEX_64_REGEX = /^[0-9a-fA-F]{64}$/;

// In-memory only — never persisted
let inMemoryPrivateKey = null;
// Set at connect time so connectWallet() can read the key before the normal
// session-storage plumbing has persisted it; session storage is the fallback
// after a page refresh
let connectedPublicKey = null;
let pendingKeyRequests = [];

const hexToBytes = (hexString) => Uint8Array.from(Buffer.from(hexString, 'hex'));

const cleanKeyInput = (input) => (input || '').trim();

// Accepts an nsec or a 64-char hex private key. Returns 32 raw bytes.
const parseNostrPrivateKey = (input) => {
    const key = cleanKeyInput(input);
    if (!key) {
        throw new Error('Please paste your nostr private key (nsec or hex).');
    }
    if (key.startsWith('nsec1')) {
        let decoded;
        try {
            decoded = nip19.decode(key);
        }
        catch (e) {
            throw new Error('Invalid nsec. Please check your key and try again.');
        }
        if (decoded.type !== 'nsec') {
            throw new Error(`This is a ${decoded.type}, not an nsec. Please paste an nsec.`);
        }
        return decoded.data;
    }
    if (key.startsWith('npub1')) {
        throw new Error('That is a public key (npub). Please paste your private key (nsec or hex).');
    }
    if (HEX_64_REGEX.test(key)) {
        const privateKeyBytes = hexToBytes(key);
        try {
            // Throws if the scalar is out of range for the curve
            schnorr.getPublicKey(privateKeyBytes);
        }
        catch (e) {
            throw new Error('Invalid private key.');
        }
        return privateKeyBytes;
    }
    throw new Error('Invalid private key. Expected an nsec or a 64-character hex key.');
};

const NostrKey = {
    NOSTR_PROVIDER,
    NOSTR_PRIVATE_KEY_REQUEST_EVENT,

    // Connecting requires the private key (spending must always be possible):
    // keeps it in memory and returns the derived x-only public key hex.
    connectPrivateKey: (input) => {
        const privateKeyBytes = parseNostrPrivateKey(input);
        const publicKey = getPublicKey(privateKeyBytes);
        inMemoryPrivateKey = privateKeyBytes;
        connectedPublicKey = publicKey;
        return publicKey;
    },

    // Re-arm signing after a refresh: the pasted private key must belong to
    // the currently connected public key, otherwise the user would silently
    // sign (and broadcast!) with a different wallet than the one on screen.
    providePrivateKey: (input) => {
        const privateKeyBytes = parseNostrPrivateKey(input);
        const publicKey = getPublicKey(privateKeyBytes);
        const currentPublicKey = connectedPublicKey ||
            SessionStorage.get(SessionsStorageKeys.ORDINALS_PUBLIC_KEY);
        if (currentPublicKey && currentPublicKey.toLowerCase() !== publicKey.toLowerCase()) {
            throw new Error('This private key does not match the connected wallet. ' +
                'Paste the private key for the connected public key, or disconnect and reconnect with this key.');
        }
        inMemoryPrivateKey = privateKeyBytes;
        const requests = pendingKeyRequests;
        pendingKeyRequests = [];
        console.log('[nostr-key] private key provided; resuming', requests.length, 'pending signing request(s)');
        requests.forEach(({ resolve }) => resolve());
        return publicKey;
    },

    hasPrivateKey: () => !!inMemoryPrivateKey,

    getPublicKey: () => {
        if (inMemoryPrivateKey) {
            return getPublicKey(inMemoryPrivateKey);
        }
        return (connectedPublicKey ||
            SessionStorage.get(SessionsStorageKeys.ORDINALS_PUBLIC_KEY));
    },

    clearPrivateKey: () => {
        if (inMemoryPrivateKey) {
            inMemoryPrivateKey.fill(0);
            inMemoryPrivateKey = null;
        }
        NostrKey.cancelPrivateKeyRequests();
    },

    disconnect: () => {
        NostrKey.clearPrivateKey();
        connectedPublicKey = null;
    },

    cancelPrivateKeyRequests: () => {
        const requests = pendingKeyRequests;
        pendingKeyRequests = [];
        requests.forEach(({ reject }) => reject(new Error('A private key is required to sign this transaction.')));
    },

    // Resolves once a private key is available, prompting the user to paste
    // their nsec (via the globally mounted modal) if none is in memory.
    requirePrivateKey: () => {
        if (inMemoryPrivateKey) {
            return Promise.resolve();
        }
        console.log('[nostr-key] no private key in memory; dispatching', NOSTR_PRIVATE_KEY_REQUEST_EVENT);
        return new Promise((resolve, reject) => {
            pendingKeyRequests.push({ resolve, reject });
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent(NOSTR_PRIVATE_KEY_REQUEST_EVENT));
                setTimeout(() => {
                    if (pendingKeyRequests.length > 0) {
                        console.warn('[nostr-key] still waiting for a private key 3s after dispatching the request event — is NostrSignModal mounted and listening?');
                    }
                }, 3000);
            }
            else {
                NostrKey.cancelPrivateKeyRequests();
            }
        });
    },

    // BIP340 schnorr signature over a 32-byte sighash, mirroring what
    // window.nostr.signSchnorr does for the Alby provider. Prompts for the
    // private key first if it isn't in memory (e.g. after a page refresh).
    signSchnorr: async (sigHashHex) => {
        console.log('[nostr-key] signSchnorr requested; hasPrivateKey:', !!inMemoryPrivateKey);
        await NostrKey.requirePrivateKey();
        const auxRand = new Uint8Array(32);
        if (typeof window !== 'undefined' && window.crypto) {
            window.crypto.getRandomValues(auxRand);
        }
        try {
            const signature = schnorr.sign(hexToBytes(sigHashHex), inMemoryPrivateKey, auxRand);
            console.log('[nostr-key] signSchnorr ok for sighash', `${sigHashHex.slice(0, 16)}...`);
            return Buffer.from(signature).toString('hex');
        }
        catch (e) {
            console.error('[nostr-key] signSchnorr failed:', e);
            throw e;
        }
    },
};

export default NostrKey;
export { NOSTR_PROVIDER, NOSTR_PRIVATE_KEY_REQUEST_EVENT };
