/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types, radix, no-empty, guard-for-in */
import { NETWORK, ORDINALS_EXPLORER_URL_LEGACY, DUMMY_UTXO_VALUE } from "@lib/constants.config";
import { doesUtxoContainInscription, getAddressUtxos } from "@utils/utxos";
import { fetchRecommendedFee, satToBtc, calculateFee, getTxHexById } from "@utils/crypto";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

bitcoin.initEccLib(ecc);

const NUMBER_OF_DUMMY_UTXOS_TO_CREATE = 2;

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

async function selectUtxos({ utxos, dummyUtxos, amount, vins, vouts, recommendedFeeRate }) {
    const selectedUtxos = [];
    let selectedAmount = 0;

    // Sort ascending by value, and filter out unconfirmed utxos
    const spendableUtxos = utxos.filter((x) => x.status.confirmed).sort((a, b) => a.value - b.value);

    for (const utxo of spendableUtxos) {
        // Never spend a utxo that contains an inscription for cardinal purposes
        if (await doesUtxoContainInscription(utxo)) {
            continue;
        }
        if (dummyUtxos.includes(utxo)) {
            continue;
        }
        selectedUtxos.push(utxo);
        selectedAmount += utxo.value;

        const calculatedFee = calculateFee({ vins: vins + selectedUtxos.length, vouts, recommendedFeeRate });
        if (selectedAmount >= amount + calculatedFee) {
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
    const payerUtxos = await getAddressUtxos(address);
    if (!payerUtxos.length) {
        throw new Error(`No utxos found for address ${address}`);
    }

    // We require at least 2 dummy utxos for taker
    const dummyUtxos = [];
    // Sort ascending by value, and filter out unconfirmed utxos
    const potentialDummyUtxos = payerUtxos.filter((x) => x.status.confirmed).sort((a, b) => a.value - b.value);
    for (const potentialDummyUtxo of potentialDummyUtxos) {
        if (!(await doesUtxoContainInscription(potentialDummyUtxo))) {
            // Dummy utxo found
            dummyUtxos.push(potentialDummyUtxo);
            if (dummyUtxos.length === NUMBER_OF_DUMMY_UTXOS_TO_CREATE) {
                break;
            }
        }
    }

    let minimumValueRequired;
    let vins;
    let vouts;

    if (dummyUtxos.length < 2) {
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
        dummyUtxos,
        amount: minimumValueRequired,
        vins,
        vouts,
        recommendedFeeRate,
    });

    return { selectedUtxos, dummyUtxos };
}

export async function generatePSBTListingInscriptionForSale({ utxo, paymentAddress, price }) {
    const psbt = new bitcoin.Psbt({ network: NETWORK });
    const ordinalUtxoTxId = utxo.txid;
    const ordinalUtxoVout = utxo.vout;

    const tx = bitcoin.Transaction.fromHex(await getTxHexById(ordinalUtxoTxId));

    for (const output in tx.outs) {
        try {
            tx.setWitness(parseInt(output), []);
        } catch {}
    }

    const input = {
        hash: ordinalUtxoTxId,
        index: parseInt(ordinalUtxoVout, 10),
        nonWitnessUtxo: tx.toBuffer(),
        witnessUtxo: tx.outs[ordinalUtxoVout],
        // eslint-disable-next-line no-bitwise
        sighashType: bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
    };

    psbt.addInput(input);

    psbt.addOutput({
        address: paymentAddress,
        value: price,
    });

    return psbt.toBase64();
}

export async function generatePSBTListingInscriptionForBuy({
    payerAddress,
    receiverAddress,
    price,
    paymentUtxos,
    dummyUtxos,
    sellerSignedPsbt,
    inscription,
}) {
    const psbt = new bitcoin.Psbt({ network: NETWORK });

    let totalValue = 0;
    let totalPaymentValue = 0;
    let totalDummyValue = 0;

    // Add dummy utxo inputs
    for (const dummyUtxo of dummyUtxos) {
        const txHex = await getTxHexById(dummyUtxo.txid);
        const tx = bitcoin.Transaction.fromHex(txHex);
        for (const output in tx.outs) {
            try {
                tx.setWitness(parseInt(output), []);
            } catch {}
        }
        psbt.addInput({
            hash: dummyUtxo.txid,
            index: dummyUtxo.vout,
            nonWitnessUtxo: tx.toBuffer(),
        });

        totalDummyValue += dummyUtxo.value;
    }

    // Add value A+B dummy output
    psbt.addOutput({
        address: receiverAddress,
        value: totalDummyValue,
    });

    // Add input for the ordinal to be sold
    psbt.addInput({
        ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.ins[0],
        ...sellerSignedPsbt.data.inputs[0],
    });

    // Add output for the inscription
    psbt.addOutput({
        address: receiverAddress,
        value: inscription.value,
    });

    // Add output for the payment to the seller
    psbt.addOutput({
        ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.outs[0],
    });

    // Add payment utxo inputs
    for (const utxo of paymentUtxos) {
        const utxoTx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));
        for (const output in utxoTx.outs) {
            try {
                utxoTx.setWitness(parseInt(output), []);
            } catch {}
        }

        psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            nonWitnessUtxo: utxoTx.toBuffer(),
        });

        totalValue += utxo.value;
        totalPaymentValue += utxo.value;
    }

    // Calculate change value and add output for change
    const recommendedFeeRate = await fetchRecommendedFee();
    const fee = calculateFee({ vins: psbt.txInputs.length, vouts: psbt.txOutputs.length, recommendedFeeRate });

    const changeValue = totalPaymentValue - totalDummyValue - price - fee;

    if (changeValue < 0) {
        const msg = `Your wallet address doesn't have enough funds to buy this inscription.
        Price:      ${satToBtc(price)} BTC
        Fees:       ${satToBtc(fee)} BTC
        You have:   ${satToBtc(totalPaymentValue)} BTC
        Required:   ${satToBtc(price + fee)} BTC
        Missing:    ${satToBtc(-changeValue)} BTC`;
        throw new Error(msg);
    }

    psbt.addOutput({
        address: payerAddress,
        value: changeValue,
    });

    const psbt64 = psbt.toBase64();

    return psbt64;
}
