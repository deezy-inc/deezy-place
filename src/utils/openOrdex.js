import { NETWORK, ORDINALS_EXPLORER_URL_LEGACY } from "@lib/constants";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

bitcoin.initEccLib(ecc);

export function isSaleOrder(order) {
    return order.tags.find((x) => x?.[0] == "s")?.[1];
}

function getInscriptionId(order) {
    return order.tags.find((x) => x?.[0] == "i")[1];
}

// TODO: REMOVE THIS, NO NEED TO RE-FETCH FROM ORDINALS EXPLORER
async function getInscriptionDataById(inscriptionId, verifyIsInscriptionNumber) {
    const html = await fetch(`${ORDINALS_EXPLORER_URL_LEGACY}/inscription/${inscriptionId}`).then((response) =>
        response.text()
    );

    const data = [...html.matchAll(/<dt>(.*?)<\/dt>\s*<dd.*?>(.*?)<\/dd>/gm)]
        .map((x) => {
            x[2] = x[2].replace(/<.*?>/gm, "");
            return x;
        })
        .reduce((a, b) => ({ ...a, [b[1]]: b[2] }), {});

    const error = `Inscription ${
        verifyIsInscriptionNumber || inscriptionId
    } not found (maybe you're on signet and looking for a mainnet inscription or vice versa)`;
    try {
        data.number = html.match(/<h1>Inscription (\d*)<\/h1>/)[1];
    } catch {
        throw new Error(error);
    }
    if (verifyIsInscriptionNumber && String(data.number) != String(verifyIsInscriptionNumber)) {
        throw new Error(error);
    }

    return data;
}

function validatePbst(psbt, utxo) {
    const sellerInput = psbt.txInputs[0];
    const sellerSignedPsbtInput = `${sellerInput.hash.reverse().toString("hex")}:${sellerInput.index}`;

    if (sellerSignedPsbtInput != utxo) {
        throw `Seller signed PSBT does not match this inscription\n\n${sellerSignedPsbtInput}`;
    }

    if (psbt.txInputs.length != 1 || psbt.txInputs.length != 1) {
        throw `Invalid seller signed PSBT`;
    }

    try {
        psbt.extractTransaction(true);
    } catch (e) {
        if (e.message == "Not finalized") {
            throw "PSBT not signed";
        } else if (e.message != "Outputs are spending more than Inputs") {
            throw "Invalid PSBT " + e.message || e;
        }
    }
}

function getPsbtPrice(psbt) {
    const sellerOutput = psbt.txOutputs[0];
    return Number(sellerOutput.value);
}

export async function getOrderInformation(order) {
    const sellerSignedPsbt = bitcoin.Psbt.fromBase64(order.content, {
        NETWORK,
    });

    const inscriptionId = getInscriptionId(order);

    // TODO: Remove this call, not needed.
    const inscription = await getInscriptionDataById(inscriptionId);

    validatePbst(sellerSignedPsbt, inscription.output);

    const value = getPsbtPrice(sellerSignedPsbt);

    return {
        value,
    };
}
