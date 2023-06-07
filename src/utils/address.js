import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { TESTNET } from "@lib/constants.config";
import * as p2trModule from "@scure/btc-signer";
import { hex } from "@scure/base";

bitcoin.initEccLib(ecc);

export const getAddressInfo = (publicKey) => {
    console.log(`Pubkey: ${publicKey.toString()}`);
    const pubkeyBuffer = Buffer.from(publicKey, "hex");
    const addrInfo = bitcoin.payments.p2tr({
        pubkey: pubkeyBuffer,
        network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin,
    });
    return addrInfo;
};

export const getOrdinalsAddressInfo = async (internalPubKey) => {
    const network = TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    const p2tr = p2trModule.p2tr(internalPubKey, undefined, network);
    return { ...p2tr, internalPubKey, script: hex.encode(p2tr.script), pubkey: Buffer.from(internalPubKey, "hex") };
};
