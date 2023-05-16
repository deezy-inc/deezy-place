import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { toXOnly } from "@utils/crypto";
import { getAddressInfo } from "@services/nosft";
import { hexToBytes, utf8ToBytes } from "@stacks/common";
import { signSigHash } from "@utils/psbt";
import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371";
import { encode } from "varuint-bitcoin";
import { base64 } from "@scure/base";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import { sha256 } from "@noble/hashes/sha256";

bitcoin.initEccLib(ecc);
const bip322MessageTag = "BIP0322-signed-message";

// See tagged hashes section of BIP-340
// https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#design
const messageTagHash = Uint8Array.from([
    ...sha256(utf8ToBytes(bip322MessageTag)),
    ...sha256(utf8ToBytes(bip322MessageTag)),
]);

function hashBip322Message(message) {
    return sha256(
        Uint8Array.from([
            ...messageTagHash,
            ...(typeof message === "string" || message instanceof String ? utf8ToBytes(message) : message),
        ])
    );
}

// TODO: This function is NOT IN USE YET. It will be implemented in a different PR with a new UI.!
// Used to prove ownership of address and associated ordinals
// https://github.com/LegReq/bip0322-signatures/blob/master/BIP0322_signing.ipynb
export async function signBip322MessageSimple(message) {
    // const message = await prompt("Please enter BIP322 message to sign", "");
    const publicKey = SessionStorage.get(SessionsStorageKeys.NOSTR_PUBLIC_KEY);

    const nostrScript = getAddressInfo(toXOnly(publicKey.toString()));
    const scriptPubkey = nostrScript.output;
    const { pubkey } = nostrScript;

    // Generate a tagged hash of message to sign
    const prevoutHash = hexToBytes("0000000000000000000000000000000000000000000000000000000000000000");
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const hash = hashBip322Message(message);

    // Create the virtual to_spend transaction
    const commands = [0, Buffer.from(hash)];
    const scriptSig = bitcoin.script.compile(commands);
    const virtualToSpend = new bitcoin.Transaction();
    virtualToSpend.version = 0;
    virtualToSpend.locktime = 0;
    virtualToSpend.addInput(Buffer.from(prevoutHash), prevoutIndex, sequence, scriptSig);
    virtualToSpend.addOutput(Buffer.from(scriptPubkey), 0);

    // Create the virtual to_sign transaction
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

    const sigHash = virtualToSign.__CACHE.__TX.hashForWitnessV1(
        0,
        [virtualToSign.data.inputs[0].witnessUtxo.script],
        [virtualToSign.data.inputs[0].witnessUtxo.value],
        bitcoin.Transaction.SIGHASH_DEFAULT
    );

    const sign = await signSigHash({ sigHash });

    virtualToSign.updateInput(0, {
        tapKeySig: serializeTaprootSignature(Buffer.from(sign, "hex")),
    });
    virtualToSign.finalizeAllInputs();

    const toSignTx = virtualToSign.extractTransaction();

    function encodeVarString(b) {
        return Buffer.concat([encode(b.byteLength), b]);
    }

    const len = encode(toSignTx.ins[0].witness.length);
    const result = Buffer.concat([len, ...toSignTx.ins[0].witness.map((w) => encodeVarString(w))]);

    const { signature } = { virtualToSpend, virtualToSign: toSignTx, signature: base64.encode(result) };
    return signature;
}
