/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import { NETWORK, ORDINALS_EXPLORER_URL_LEGACY, DUMMY_UTXO_VALUE } from "@lib/constants.config";
import { doesUtxoContainInscription, getAddressUtxos } from "@utils/utxos";
import { fetchRecommendedFee, satToBtc, calculateFee } from "@utils/crypto";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

bitcoin.initEccLib(ecc);

const NUMBER_OF_DUMMY_UTXOS_TO_CREATE = 1;

export function isSaleOrder(order) {
    return order.tags.find((x) => x?.[0] === "s")?.[1];
}

function getInscriptionId(order) {
    return order.tags.find((x) => x?.[0] === "i")[1];
}

// TODO: REMOVE THIS, NO NEED TO RE-FETCH FROM ORDINALS EXPLORER
async function getInscriptionDataById(inscriptionId, verifyIsInscriptionNumber) {
    const html = await fetch(`${ORDINALS_EXPLORER_URL_LEGACY}/inscription/${inscriptionId}`).then((response) =>
        response.text()
    );

    // Refactor the map to not reassign x[2]
    const data = [...html.matchAll(/<dt>(.*?)<\/dt>\s*<dd.*?>(.*?)<\/dd>/gm)]
        .map((x) => {
            // eslint-disable-next-line no-param-reassign
            x[2] = x[2].replace(/<.*?>/gm, "");
            return x;
        })
        .reduce((a, b) => ({ ...a, [b[1]]: b[2] }), {});

    const error = `Inscription ${
        verifyIsInscriptionNumber || inscriptionId
    } not found (maybe you're on signet and looking for a mainnet inscription or vice versa)`;
    try {
        // use array destructuring to get the first match of html.match(/<h1>Inscription (\d*)<\/h1>/)
        const [_, number] = html.match(/<h1>Inscription (\d*)<\/h1>/);

        data.number = number;
    } catch {
        throw new Error(error);
    }
    if (verifyIsInscriptionNumber && String(data.number) !== String(verifyIsInscriptionNumber)) {
        throw new Error(error);
    }

    return data;
}

function validatePbst(psbt, utxo) {
    const sellerInput = psbt.txInputs[0];
    const sellerSignedPsbtInput = `${sellerInput.hash.reverse().toString("hex")}:${sellerInput.index}`;

    if (sellerSignedPsbtInput !== utxo) {
        throw new Error(`Seller signed PSBT does not match this inscription\n\n${sellerSignedPsbtInput}`);
    }

    if (psbt.txInputs.length !== 1 || psbt.txInputs.length !== 1) {
        throw new Error(`Invalid seller signed PSBT`);
    }

    try {
        psbt.extractTransaction(true);
    } catch (e) {
        if (e.message === "Not finalized") {
            throw new Error("PSBT not signed");
        }

        if (e.message !== "Outputs are spending more than Inputs") {
            throw new Error(`Invalid PSBT ${e.message || e}`);
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
        inscriptionId,
        ...order,
        value,
    };
}

async function selectUtxos({ utxos, amount, vins, vouts, recommendedFeeRate }) {
    const selectedUtxos = [];
    let selectedAmount = 0;

    // Sort descending by value, and filter out dummy utxos
    const dummyUtxos = utxos.filter((x) => x.value > DUMMY_UTXO_VALUE).sort((a, b) => b.value - a.value);

    for (const utxo of dummyUtxos) {
        // Never spend a utxo that contains an inscription for cardinal purposes
        if (await doesUtxoContainInscription(utxo)) {
            continue;
        }
        selectedUtxos.push(utxo);
        selectedAmount += utxo.value;

        const calculatedFee = calculateFee({ vins: vins + selectedUtxos.length, vouts, recommendedFeeRate });
        if (selectedAmount >= amount + DUMMY_UTXO_VALUE + calculatedFee) {
            break;
        }
    }

    if (selectedAmount < amount) {
        throw new Error(`Not enough cardinal spendable funds.
Address has:  ${satToBtc(selectedAmount)} BTC
Needed:          ${satToBtc(amount)} BTC`);
    }

    return selectedUtxos;
}

export async function getAvailableUtxosWithoutInscription({ address, price }) {
    let dummyUtxo;
    const payerUtxos = await getAddressUtxos(address);
    if (!payerUtxos.length) {
        throw new Error(`No utxos found for address ${address}`);
    }

    const potentialDummyUtxos = payerUtxos.filter((utxo) => utxo.value <= DUMMY_UTXO_VALUE);
    for (const potentialDummyUtxo of potentialDummyUtxos) {
        if (!(await doesUtxoContainInscription(potentialDummyUtxo))) {
            // Dummy utxo found
            dummyUtxo = potentialDummyUtxo;
            break;
        }
    }

    let minimumValueRequired;
    let vins;
    let vouts;

    if (!dummyUtxo) {
        // showDummyUtxoElements();
        minimumValueRequired = NUMBER_OF_DUMMY_UTXOS_TO_CREATE * DUMMY_UTXO_VALUE;
        vins = 0;
        vouts = NUMBER_OF_DUMMY_UTXOS_TO_CREATE;
    } else {
        minimumValueRequired = price + NUMBER_OF_DUMMY_UTXOS_TO_CREATE * DUMMY_UTXO_VALUE;
        vins = 1;
        vouts = 2 + NUMBER_OF_DUMMY_UTXOS_TO_CREATE;
    }

    const recommendedFeeRate = await fetchRecommendedFee();
    const selectedUtxos = await selectUtxos({
        utxos: payerUtxos,
        minimumValueRequired,
        vins,
        vouts,
        recommendedFeeRate,
    });

    return { selectedUtxos, dummyUtxo };
}
