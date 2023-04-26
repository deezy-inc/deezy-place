import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371";
import { ethers } from "ethers";
import { DEFAULT_DERIV_PATH, TESTNET } from "@lib/constants";
import { tweakSigner, TAPROOT_MESSAGE, toXOnly, outputValue, getAddressInfo } from "@utils/crypto";
import { ECPairFactory } from "ecpair";
import BIP32Factory from "bip32";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";

import axios from "axios";

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

async function signTaproot(psbt, inputParams) {
    const { ethereum } = window;
    const metamaskDomain = SessionStorage.get(SessionsStorageKeys.DOMAIN);
    const ethAddress = ethereum.selectedAddress;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const toSign = `0x${Buffer.from(TAPROOT_MESSAGE(metamaskDomain)).toString("hex")}`;
    const signature = await provider.send("personal_sign", [toSign, ethAddress]);
    const seed = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.arrayify(signature)));
    const root = bip32.fromSeed(Buffer.from(seed));
    const taprootChild = root.derivePath(DEFAULT_DERIV_PATH);
    const taprootAddress = bitcoin.payments.p2tr({
        pubkey: toXOnly(taprootChild.publicKey),
    });

    const input = {
        ...inputParams,
        tapInternalKey: toXOnly(taprootAddress.pubkey),
    };

    psbt.addInput(input);

    const keyPair = ECPair.fromPrivateKey(taprootChild.privateKey);
    const tweakedSigner = tweakSigner(keyPair);

    psbt.signInput(0, tweakedSigner);

    return psbt;
}

async function signNostr(psbt, inputParams, inputAddressInfo, utxo, sighashType = bitcoin.Transaction.SIGHASH_DEFAULT) {
    const publicKey = Buffer.from(await window.nostr.getPublicKey(), "hex");
    const input = {
        ...inputParams,
        tapInternalKey: toXOnly(publicKey),
        // assuming sighashType is already on the inputParams
    };

    psbt.addInput(input);

    const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(0, [inputAddressInfo.output], [utxo.value], sighashType);
    const sig = await window.nostr.signSchnorr(sigHash.toString("hex"));

    psbt.updateInput(0, {
        tapKeySig: serializeTaprootSignature(Buffer.from(sig, "hex"), sighashType),
    });

    return psbt;
}

async function getSignedPsbt({
    psbt,
    inputParams,
    inputAddressInfo,
    utxo,
    sighashType = bitcoin.Transaction.SIGHASH_DEFAULT,
}) {
    const metamaskDomain = SessionStorage.get(SessionsStorageKeys.DOMAIN);

    if (metamaskDomain) {
        return signTaproot(psbt, inputParams);
    }

    return signNostr(psbt, inputParams, inputAddressInfo, utxo, sighashType);
}

function getInputParams({ utxo, inputAddressInfo, sighashType }) {
    const params = {
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
            value: utxo.value,
            script: inputAddressInfo.output,
        },
        tapInternalKey: "",
    };
    if (sighashType) {
        params.sighashType = sighashType;
    }
    return params;
}

function createPsbt({ utxo, inputAddressInfo, destinationBtcAddress, sendFeeRate }) {
    const network = TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    const psbt = new bitcoin.Psbt({ network });
    const inputParams = getInputParams({ utxo, inputAddressInfo });
    const output = outputValue(utxo, sendFeeRate);
    psbt.addOutput({
        address: destinationBtcAddress,
        value: output,
    });

    return { psbt, inputParams };
}

function createPsbtForBoost({ utxo, inputAddressInfo, destinationBtcAddress }) {
    const network = TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    const psbt = new bitcoin.Psbt({ network });
    const sighashType = 131; // bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY;
    const inputParams = getInputParams({ utxo, inputAddressInfo, sighashType });
    const output = 10000; // TODO: make this a constant.
    psbt.addOutput({
        address: destinationBtcAddress,
        value: output,
    });

    return { psbt, inputParams };
}

async function broadcastPsbt(psbt) {
    const tx = psbt.extractTransaction();
    const hex = tx.toBuffer().toString("hex");
    const fullTx = bitcoin.Transaction.fromHex(hex);
    await axios.post(`https://mempool.space/api/tx`, hex);

    return fullTx.getId();
}

export async function signAndBroadcastUtxo({ pubKey, utxo, destinationBtcAddress, sendFeeRate }) {
    const inputAddressInfo = getAddressInfo(pubKey);
    const { psbt, inputParams } = createPsbt({ utxo, inputAddressInfo, destinationBtcAddress, sendFeeRate });
    const signed = await getSignedPsbt({ psbt, inputParams, inputAddressInfo, utxo });
    // Finalize the PSBT. Note that the transaction will not be broadcast to the Bitcoin network yet.
    signed.finalizeAllInputs();
    // Send it!
    return broadcastPsbt(signed);
}

export async function createAndSignPsbtForBoost({ pubKey, utxo, destinationBtcAddress }) {
    const inputAddressInfo = getAddressInfo(pubKey);
    const { psbt, inputParams } = createPsbtForBoost({ utxo, inputAddressInfo, destinationBtcAddress });
    const sighashType = 131; // bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY;
    const signed = await getSignedPsbt({ psbt, inputParams, inputAddressInfo, utxo, sighashType });
    // Finalize the PSBT. Note that the transaction will not be broadcast to the Bitcoin network yet.
    signed.finalizeAllInputs();
    return signed.toHex();
}
