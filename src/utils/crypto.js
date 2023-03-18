/* eslint-disable */
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { TESTNET, ASSUMED_TX_BYTES, BITCOIN_PRICE_API_URL } from "@lib/constants";
import BIP32Factory from "bip32";
import { ethers } from "ethers";
import { ECPairFactory } from "ecpair";

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
    console.log("Taproot address:", addrInfo.address);
    return addrInfo;
};

const defaultPath = "m/86'/0'/0'/0/0";

// sign message with first sign transaction
const TAPROOT_MESSAGE =
    // will switch to nosft.xyz once sends are implemented
    "Sign this message to generate your Bitcoin Taproot key. This key will be used for your generative.xyz transactions.";

export const connectWallet = async () => {
    const { ethereum } = window;

    if (ethereum) {
        let ethAddress = ethereum.selectedAddress;
        if (!ethAddress) {
            await ethereum.request({ method: "eth_requestAccounts" });
            ethAddress = ethereum.selectedAddress;
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const toSign = `0x${Buffer.from(TAPROOT_MESSAGE).toString("hex")}`;
        const signature = await provider.send("personal_sign", [toSign, ethAddress]);
        const seed = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.arrayify(signature)));
        const root = bip32.fromSeed(Buffer.from(seed));
        const taprootChild = root.derivePath(defaultPath);
        const taprootAddress = bitcoin.payments.p2tr({
            internalPubkey: toXOnly(taprootChild.publicKey),
        });
        return taprootAddress.pubkey;
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
                                  }
                    });
                }
            });
        }
        n["default"] = e;
        return Object.freeze(n);
    }

    var ecc__namespace = /*#__PURE__*/_interopNamespace(ecc);
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