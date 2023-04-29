import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371";
import { ethers } from "ethers";
import { tweakSigner, outputValue } from "@utils/crypto";
import { getAddressInfo } from "@utils/address";
import { TAPROOT_MESSAGE } from "@utils/wallet";
import { DEFAULT_DERIV_PATH, NETWORK, BOOST_UTXO_VALUE } from "@lib/constants.config";
import { ECPairFactory } from "ecpair";
import BIP32Factory from "bip32";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import axios from "axios";

bitcoin.initEccLib(ecc);

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

export async function getMetamaskSigner(metamaskDomain) {
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
    const { privateKey } = taprootChild;

    const keyPair = ECPair.fromPrivateKey(privateKey);
    return tweakSigner(keyPair);
}

async function signMetamask(sigHash, metamaskDomain) {
    const tweakedSigner = await getMetamaskSigner(metamaskDomain);
    return tweakedSigner.signSchnorr(sigHash);
}

async function signNostr(sigHash) {
    return window.nostr.signSchnorr(sigHash.toString("hex"));
}

export async function signSigHash({ sigHash }) {
    const metamaskDomain = SessionStorage.get(SessionsStorageKeys.DOMAIN);

    if (metamaskDomain) {
        return signMetamask(sigHash, metamaskDomain);
    }

    return signNostr(sigHash);
}

function getInputParams({ utxo, inputAddressInfo }) {
    return {
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
            value: utxo.value,
            script: Buffer.from(inputAddressInfo.output, "hex"),
        },
        tapInternalKey: inputAddressInfo.pubkey,
    };
}

function createPsbt({ utxo, inputAddressInfo, destinationBtcAddress, sendFeeRate, output }) {
    const psbt = new bitcoin.Psbt({ network: NETWORK });
    // Input
    const inputParams = getInputParams({ utxo, inputAddressInfo });
    psbt.addInput(inputParams);

    const psbtOutputValue = output || outputValue(utxo, sendFeeRate);

    psbt.addOutput({
        address: destinationBtcAddress,
        value: psbtOutputValue,
    });

    return psbt;
}

export async function broadcastTx(tx) {
    const hex = tx.toBuffer().toString("hex");
    const fullTx = bitcoin.Transaction.fromHex(hex);
    await axios.post(`https://mempool.space/api/tx`, hex);

    return fullTx.getId();
}

export async function broadcastPsbt(psbt) {
    const tx = psbt.extractTransaction();
    return broadcastTx(tx);
}

export async function signAndBroadcastUtxo({ pubKey, utxo, destinationBtcAddress, sendFeeRate }) {
    const inputAddressInfo = await getAddressInfo(pubKey);
    const psbt = createPsbt({ utxo, inputAddressInfo, destinationBtcAddress, sendFeeRate });

    const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(
        0,
        [inputAddressInfo.output],
        [utxo.value],
        bitcoin.Transaction.SIGHASH_DEFAULT
    );

    const signed = await signSigHash({ sigHash, inputAddressInfo, utxo });

    psbt.updateInput(0, {
        tapKeySig: serializeTaprootSignature(Buffer.from(signed, "hex")),
    });

    // Finalize the PSBT. Note that the transaction will not be broadcast to the Bitcoin network yet.
    psbt.finalizeAllInputs();
    // Send it!
    return broadcastPsbt(psbt);
}

export async function createAndSignPsbtForBoost({ pubKey, utxo, destinationBtcAddress }) {
    const inputAddressInfo = getAddressInfo(pubKey);
    const psbt = createPsbt({ utxo, inputAddressInfo, destinationBtcAddress, output: BOOST_UTXO_VALUE });

    const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(
        0,
        [inputAddressInfo.output],
        [utxo.value],
        // eslint-disable-next-line no-bitwise
        bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY
    );

    const signed = await signSigHash({ sigHash, inputAddressInfo, utxo });

    psbt.updateInput(0, {
        tapKeySig: serializeTaprootSignature(Buffer.from(signed, "hex"), [
            // eslint-disable-next-line no-bitwise
            bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
        ]),
    });

    // Finalize the PSBT. Note that the transaction will not be broadcast to the Bitcoin network yet.
    psbt.finalizeAllInputs();
    return psbt.toHex();
}

export async function signPsbtMessage(message) {
    const virtualToSign = bitcoin.Psbt.fromBase64(message);
    // if only 1 input, then this is a PSBT listing
    if (virtualToSign.inputCount === 1 && virtualToSign.txOutputs.length === 1) {
        const sigHash = virtualToSign.__CACHE.__TX.hashForWitnessV1(
            0,
            [virtualToSign.data.inputs[0].witnessUtxo.script],
            [virtualToSign.data.inputs[0].witnessUtxo.value],
            // eslint-disable-next-line no-bitwise
            bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY
        );
        const sign = await signSigHash({ sigHash });
        virtualToSign.updateInput(0, {
            tapKeySig: serializeTaprootSignature(Buffer.from(sign, "hex"), [
                // eslint-disable-next-line no-bitwise
                bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
            ]),
        });
        virtualToSign.finalizeAllInputs();
        return virtualToSign;
    }
    const witnessScripts = [];
    const witnessValues = [];
    // update all witnesses and values
    virtualToSign.data.inputs.forEach((input, i) => {
        if (!input.finalScriptWitness) {
            const tx = bitcoin.Transaction.fromBuffer(virtualToSign.data.inputs[i].nonWitnessUtxo);
            const output = tx.outs[virtualToSign.txInputs[i].index];
            virtualToSign.updateInput(i, {
                witnessUtxo: output,
            });
            witnessScripts.push(output.script);
            witnessValues.push(output.value);
        } else {
            witnessScripts.push(virtualToSign.data.inputs[i].witnessUtxo.script);
            witnessValues.push(virtualToSign.data.inputs[i].witnessUtxo.value);
        }
    });
    // create and update resultant sighashes
    // eslint-disable-next-line no-restricted-syntax
    for (const [i, input] of virtualToSign.data.inputs.entries()) {
        if (!input.finalScriptWitness) {
            const sigHash = virtualToSign.__CACHE.__TX.hashForWitnessV1(
                i,
                witnessScripts,
                witnessValues,
                bitcoin.Transaction.SIGHASH_DEFAULT
            );
            // eslint-disable-next-line no-await-in-loop
            const signature = await signSigHash({ sigHash });
            virtualToSign.updateInput(i, {
                tapKeySig: serializeTaprootSignature(Buffer.from(signature, "hex")),
            });
            virtualToSign.finalizeInput(i);
        }
    }
    console.log(virtualToSign.toBase64());
    return virtualToSign.extractTransaction();
}
