import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371.js";
import { ASSUMED_TX_BYTES, TESTNET } from "./constants";
import type { Utxo } from "./types";
bitcoin.initEccLib(ecc);

export const getAddressInfo = (nostrPublicKey: string) => {
  const pubkey = Buffer.from(nostrPublicKey, "hex");
  const addrInfo = bitcoin.payments.p2tr({
    pubkey,
    network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin,
  });
  return addrInfo;
};

export const getUtxos = async (address: string) => {
  let res = await fetch(`https://mempool.space/api/address/${address}/utxo`);
  return await res.json();
};

export const getInscriptionUtxo = async (utxo: Utxo) => {
  const inscriptionId = `${utxo.txid}:${utxo.vout}`;
  const res = await fetch(`https://ordinals.com/output/${inscriptionId}`);
  const text = await res.text();
  const inscription = text.match(/<a href=\/inscription\/(.*?)>/)?.[1];
  if (!inscription) return;
  const [txid, vout] = inscription.split("i");
  return { txid, vout };
};

export const checkContentType = async (
  utxo: Pick<Utxo, "txid" | "vout">
): Promise<string | null> => {
  const url = `https://ordinals.com/content/${utxo.txid}i${utxo.vout}`;
  let res = await fetch(url, { method: "HEAD", cache: "force-cache" });
  return res?.headers?.get("Content-Type");
};

function toXOnly(key: Buffer) {
  return key.length === 33 ? key.slice(1, 33) : key;
}

export const sendInscription = ({
  nostrPublicKey,
  txid,
  value,
  vout,
  bitcoinAddress,
  feeRate,
}: {
  nostrPublicKey: string;
  txid: string;
  value: number;
  vout: number;
  bitcoinAddress: string;
  feeRate: number;
}) => {
  const inputAddressInfo = getAddressInfo(nostrPublicKey);
  const psbt = new bitcoin.Psbt({
    network: TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin,
  });
  const publicKey = Buffer.from(nostrPublicKey, "hex");

  const tapInternalKey = toXOnly(publicKey);
  if (!tapInternalKey || !inputAddressInfo.output || !value) return false;

  const inputParams = {
    hash: txid,
    index: vout,
    witnessUtxo: {
      value: value,
      script: inputAddressInfo.output,
    },
    tapInternalKey,
  };
  console.log("input params", inputParams);
  psbt.addInput(inputParams);
  psbt.addOutput({
    address: bitcoinAddress,
    value: value - feeRate * ASSUMED_TX_BYTES,
  });
  const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(
    0,
    [inputAddressInfo.output],
    [value],
    bitcoin.Transaction.SIGHASH_DEFAULT
  );

  console.log("sig hash", sigHash);

  return { sigHash, psbt };
};

export const finalizeSendInscription = (psbt: any, sig: string) => {
  psbt.updateInput(0, {
    tapKeySig: serializeTaprootSignature(Buffer.from(sig, "hex")),
  });
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  const hex = tx.toBuffer().toString("hex");
  const fullTx = bitcoin.Transaction.fromHex(hex);
  console.log("fullTx", fullTx);
  console.log("hex", hex);
  // const res = await axios
  //   .post(`https://mempool.space/api/tx`, hex)
  //   .catch((err) => {
  //     console.error(err);
  //     alert(err);
  //     return null;
  //   });
  // if (!res) return false;
  return true;
};
