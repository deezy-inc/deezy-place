/* eslint-disable */
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { TESTNET, ASSUMED_TX_BYTES, BITCOIN_PRICE_API_URL, DEFAULT_DERIV_PATH } from "@lib/constants";
import BIP32Factory from "bip32";
import { ethers } from "ethers";
import { ECPairFactory } from "ecpair";
import { sha256 } from '@noble/hashes/sha256';
import { hexToBytes, utf8ToBytes } from '@stacks/common';
import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371";
import { encode } from 'varuint-bitcoin';
import { base64 } from '@scure/base';
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

export const outputValue = (currentUtxo, sendFeeRate) => currentUtxo.value - sendFeeRate * ASSUMED_TX_BYTES;

export const ordinalsUrl = (utxo) => `https://ordinals.com/output/${utxo.txid}:${utxo.vout}`;

export const ordinalsImageUrl = (utxo) => `https://ordinals.com/content/${utxo.txid}i${utxo.vout}`;

export const cloudfrontUrl = (utxo) => `https://d2v3k2do8kym1f.cloudfront.net/minted-items/${utxo.txid}:${utxo.vout}`;

export const shortenStr = (str) => {
    if (!str) return "";
    return `${str.substring(0, 8)}...${str.substring(str.length - 8, str.length)}`;
};

export const toXOnly = (key) => (key.length === 33 ? key.slice(1, 33) : key);

export const getAddressInfo = (publicKey) => {
    console.log(`Pubkey: ${publicKey.toString()}`);
    const pubkeyBuffer = Buffer.from(publicKey, "hex");
    const addrInfo = bitcoin.payments.p2tr({
        pubkey: pubkeyBuffer,
        network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin,
    });
    return addrInfo;
};

// sign message with first sign transaction
export const TAPROOT_MESSAGE = (domain) =>
    // will switch to nosft.xyz once sends are implemented
    `Sign this message to generate your Bitcoin Taproot key. This key will be used for your ${domain} transactions.`;



const bip322MessageTag = 'BIP0322-signed-message';

// See tagged hashes section of BIP-340
// https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#design
const messageTagHash = Uint8Array.from([
  ...sha256(utf8ToBytes(bip322MessageTag)),
  ...sha256(utf8ToBytes(bip322MessageTag)),
]);

export function hashBip322Message(message) {
    return sha256(
      Uint8Array.from([...messageTagHash, ...(typeof message === 'string' || message instanceof String ? utf8ToBytes(message) : message)])
    );
}

export async function signBip322MessageSimple() {
    // testing sign message logging
    const message = await prompt("Please enter BIP322 message to sign", "");
    let publicKey = SessionStorage.get(SessionsStorageKeys.NOSTR_PUBLIC_KEY);
    const metamaskDomain = SessionStorage.get(SessionsStorageKeys.DOMAIN);
    const nostrScript = getAddressInfo(toXOnly(publicKey.toString()));
    let scriptPubkey = nostrScript.output;
    let pubkey = nostrScript.pubkey;
    let privateKey = '';

    // For Metamask flow, we need to generate the scriptPubkey using the internalPubkey instead of pubkey
    if (metamaskDomain) {
        const { ethereum } = window;
        let ethAddress = ethereum.selectedAddress;
        if (!ethAddress) {
            await ethereum.request({ method: "eth_requestAccounts" });
            ethAddress = ethereum.selectedAddress;
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const toSign = `0x${Buffer.from(TAPROOT_MESSAGE(metamaskDomain)).toString("hex")}`;
        const signature = await provider.send("personal_sign", [toSign, ethAddress]);
        const seed = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.arrayify(signature)));
        const root = bip32.fromSeed(Buffer.from(seed));
        const taprootChild = root.derivePath(DEFAULT_DERIV_PATH);
        const metamaskScript = bitcoin.payments.p2tr({
            internalPubkey: toXOnly(taprootChild.publicKey),
        });
        scriptPubkey = metamaskScript.output;
        pubkey=taprootChild.publicKey;
        privateKey=taprootChild.privateKey;
    }
    
  
    const prevoutHash = hexToBytes(
      '0000000000000000000000000000000000000000000000000000000000000000'
    );
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
  
    const hash = hashBip322Message(message);
  
    const commands = [0, Buffer.from(hash)];
    const scriptSig = bitcoin.script.compile(commands);
  
    // check other args
    const virtualToSpend = new bitcoin.Transaction();
    virtualToSpend.version = 0;
    virtualToSpend.locktime = 0;
  
    virtualToSpend.addInput(Buffer.from(prevoutHash), prevoutIndex, sequence, scriptSig);
  
    // virtualToSpend.addOutput(Buffer.from(payment.script), 0);
    virtualToSpend.addOutput(Buffer.from(scriptPubkey), 0);
  
  
    const virtualToSign = new bitcoin.Psbt();
    virtualToSign.setLocktime(0);
    virtualToSign.setVersion(0);
    const prevTxHash = virtualToSpend.getHash(); // or id?
    const prevOutIndex = 0;
    const toSignScriptSig = bitcoin.script.compile([106]);
  
    virtualToSign.addInput({
      hash: prevTxHash,
      index: prevOutIndex,
      sequence: 0,
      witnessUtxo: { script: Buffer.from(scriptPubkey, "hex"), value: 0 },
      tapInternalKey: toXOnly(pubkey),
    });
    virtualToSign.addOutput({ script: toSignScriptSig, value: 0 });
  
    if (!privateKey) {
        const sigHash = virtualToSign.__CACHE.__TX.hashForWitnessV1(
            0,
            [scriptPubkey],
            [0],
            bitcoin.Transaction.SIGHASH_DEFAULT
        );
        const sig =  await window.nostr.signSchnorr(sigHash.toString("hex"));
        virtualToSign.updateInput(0, {
            tapKeySig: serializeTaprootSignature(Buffer.from(sig, "hex")),
        });
    } else {
        const keyPair = ECPair.fromPrivateKey(privateKey);
        const tweakedSigner = tweakSigner(keyPair);        
        virtualToSign.signInput(0, tweakedSigner);
    }
    
    virtualToSign.finalizeAllInputs();
  
    const toSignTx = virtualToSign.extractTransaction();

    function encodeVarString(b) {
      return Buffer.concat([encode(b.byteLength), b]);
    }
  
    const len = encode(toSignTx.ins[0].witness.length);
    const result = Buffer.concat([len, ...toSignTx.ins[0].witness.map(w => encodeVarString(w))]);

    const toReturn = { virtualToSpend, virtualToSign: toSignTx, signature: base64.encode(result) };

    const sig = `Your BIP322 signature is: ${toReturn.signature}`;
    alert(sig);
    console.log(toReturn);

    return toReturn
  }


export const connectWallet = async (metamask) => {
    const { ethereum } = window;

    if (ethereum && metamask) {
        let ethAddress = ethereum.selectedAddress;
        if (!ethAddress) {
            await ethereum.request({ method: "eth_requestAccounts" });
            ethAddress = ethereum.selectedAddress;
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const toSign = `0x${Buffer.from(TAPROOT_MESSAGE(metamask)).toString("hex")}`;
        const signature = await provider.send("personal_sign", [toSign, ethAddress]);
        const seed = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.arrayify(signature)));
        const root = bip32.fromSeed(Buffer.from(seed));
        const taprootChild = root.derivePath(DEFAULT_DERIV_PATH);
        const taprootAddress = bitcoin.payments.p2tr({
            internalPubkey: toXOnly(taprootChild.publicKey),
        });
        return taprootAddress.pubkey.toString('hex');
    }
    if (window.nostr && window.nostr.enable) {
        await window.nostr.enable();
    } else {
        alert(
            "Oops, it looks like you haven't set up your Nostr key yet or installed Metamask." +
                "Go to your Alby Account Settings and create or import a Nostr key."
        );
        return undefined;
    }
    return window.nostr.getPublicKey();
};

export function satToBtc(sat) {
    return Number(sat) / 10 ** 8;
}

export function satsToFormattedDollarString(sats, _bitcoinPrice) {
    return (satToBtc(sats) * _bitcoinPrice).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export const fetchBitcoinPrice = async () =>
    fetch(BITCOIN_PRICE_API_URL)
        .then((response) => response.json())
        .then((data) => data.USD.last);

export function tapTweakHash(pubKey, h) {
    return bitcoin.crypto.taggedHash("TapTweak", Buffer.concat(h ? [pubKey, h] : [pubKey]));
}

export function tweakSigner(signer) {
    function _interopNamespace(e) {
        const n = Object.create(null);
        if (e && e.__esModule) return e;
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== "default") {
                    const d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(
                        n,
                        k,
                        d.get
                            ? d
                            : {
                                  enumerable: true,
                                  get: function () {
                                      return e[k];
                                  },
                              }
                    );
                }
            });
        }
        n["default"] = e;
        return Object.freeze(n);
    }

    var ecc__namespace = /*#__PURE__*/ _interopNamespace(ecc);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let privateKey = signer.privateKey;
    if (!signer.privateKey) {
        throw new Error("Private key is required for tweaking signer!");
    }
    if (signer.publicKey[0] === 3) {
        privateKey = ecc__namespace.privateNegate(privateKey);
    }
    const tweakedPrivateKey = ecc__namespace.privateAdd(
        privateKey,
        tapTweakHash(toXOnly(signer.publicKey), bitcoin.networks.bitcoin.tweakHash)
    );
    if (!tweakedPrivateKey) {
        throw new Error("Invalid tweaked private key!");
    }
    return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: bitcoin.networks.bitcoin,
    });
}
