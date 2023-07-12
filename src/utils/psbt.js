import { NETWORK } from "@services/nosft";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
bitcoin.initEccLib(ecc);

function isHexadecimal(str) {
  const hexRegex = /^[0-9A-Fa-f]*$/;
  return str.length % 2 === 0 && hexRegex.test(str);
}

// TODO: move to nosft-core
export const getPsbt = (psbtContent) => {
  const psbt = isHexadecimal(psbtContent)
    ? bitcoin.Psbt.fromHex(psbtContent, {
        network: NETWORK,
      })
    : bitcoin.Psbt.fromBase64(psbtContent, {
        network: NETWORK,
      });

  return psbt;
};
