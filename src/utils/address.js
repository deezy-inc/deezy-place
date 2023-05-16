import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { NETWORK } from "@lib/constants.config";

bitcoin.initEccLib(ecc);

export const getAddressInfo = (publicKey) => {
    console.log(`Pubkey: ${publicKey.toString()}`);
    const pubkeyBuffer = Buffer.from(publicKey, "hex");
    const addrInfo = bitcoin.payments.p2tr({
        pubkey: pubkeyBuffer,
        network: NETWORK,
    });
    return addrInfo;
};
