import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { INSCRIPTION_SEARCH_DEPTH, TESTNET } from "./constants";
import { Utxo } from "./types";
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
