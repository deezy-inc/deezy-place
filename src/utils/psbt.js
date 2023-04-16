import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371";
import { ethers } from "ethers";
import { tweakSigner, TAPROOT_MESSAGE, outputValue, getAddressInfo, getTxHexById } from "@utils/crypto";
import { DEFAULT_DERIV_PATH, TESTNET, NETWORK } from "@lib/constants.config";
import { ECPairFactory } from "ecpair";
import BIP32Factory from "bip32";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";

import axios from "axios";

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

async function signMetamask(sigHash, metamaskDomain) {
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
    const tweakedSigner = tweakSigner(keyPair);
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
    const network = TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    const psbt = new bitcoin.Psbt({ network });
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

export async function broadcastPsbt(psbt) {
    const tx = psbt.extractTransaction();
    const hex = tx.toBuffer().toString("hex");
    const fullTx = bitcoin.Transaction.fromHex(hex);
    await axios.post(`https://mempool.space/api/tx`, hex);

    return fullTx.getId();
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

export async function generatePSBTListingInscriptionForSale({
    pubKey,
    utxo,
    destinationBtcAddress,
    sendFeeRate,
    price,
}) {
    const inputAddressInfo = await getAddressInfo(pubKey);
    const output = outputValue(null, sendFeeRate, price);
    const psbt = createPsbt({ utxo, inputAddressInfo, destinationBtcAddress, sendFeeRate, output });

    const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(
        0,
        [inputAddressInfo.output],
        [output],
        // eslint-disable-next-line no-bitwise
        bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY
    );

    const signed = await signSigHash({ sigHash, inputAddressInfo, utxo });

    psbt.updateInput(0, {
        tapKeySig: serializeTaprootSignature(Buffer.from(signed, "hex")),
    });

    // Finalize the PSBT. Note that the transaction will not be broadcast to the Bitcoin network yet.
    psbt.finalizeAllInputs();
    const psbt64 = psbt.toBase64();

    return psbt64;
}

export async function generatePSBTListingInscriptionForBuy({
    destinationBtcAddress,
    price,
    dummyUtxo,
    pubKey,
    sellerSignedPsbt,
}) {
    const inputAddressInfo = await getAddressInfo(pubKey);

    const psbt = new bitcoin.Psbt({ NETWORK });

    // Add dummy utxo input
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(dummyUtxo.txid));
    for (const output in tx.outs) {
        try {
            tx.setWitness(parseInt(output), []);
        } catch {}
    }

    const inputParams = getInputParams({ utxo: dummyUtxo, inputAddressInfo });
    psbt.addInput(inputParams);

    // Add inscription output
    psbt.addOutput({
        address: destinationBtcAddress,
        value: dummyUtxo.value + price,
    });

    // Add payer signed input
    psbt.addInput({
        ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.ins[0],
        ...sellerSignedPsbt.data.inputs[0],
    });

    // Add payer output
    psbt.addOutput({
        ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.outs[0],
    });
}

export async function signPsbtMessage(message) {
    const virtualToSign = bitcoin.Psbt.fromBase64(message);
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
