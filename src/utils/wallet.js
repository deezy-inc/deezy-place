import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

import { ethers } from "ethers";
import BIP32Factory from "bip32";
import { DEFAULT_DERIV_PATH } from "@lib/constants.config";
import { toXOnly } from "@utils/crypto";

bitcoin.initEccLib(ecc);

const bip32 = BIP32Factory(ecc);

// sign message with first sign transaction
export const TAPROOT_MESSAGE = (domain) =>
    // will switch to nosft.xyz once sends are implemented
    `Sign this message to generate your Bitcoin Taproot key. This key will be used for your ${domain} transactions.`;

// Used to prove ownership of address and associated ordinals
// https://github.com/LegReq/bip0322-signatures/blob/master/BIP0322_signing.ipynb

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
        return taprootAddress.pubkey.toString("hex");
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
