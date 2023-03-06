/* eslint-disable */
import { TESTNET } from "@lib/constants";
import { getAddressInfo, toXOnly } from "@utils/crypto";
import { relayInit, getEventHash } from "nostr-tools";
import { serializeTaprootSignature } from "bitcoinjs-lib/src/psbt/bip371";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

bitcoin.initEccLib(ecc);

// TODO: Move to constants
const isProduction = !TESTNET;
// const nostrRelayUrl = "wss://nostr.openordex.org"; // Use local relay for testing
const nostrRelayUrl = "ws://localhost:7001"; // Use local relay for testing
const baseMempoolUrl = isProduction
    ? "https://mempool.space"
    : "https://mempool.space/signet";
const baseMempoolApiUrl = `${baseMempoolUrl}/api`;
const bitcoinPriceApiUrl = "https://blockchain.info/ticker?cors=true";
const feeLevel = "hourFee"; // "fastestFee" || "halfHourFee" || "hourFee" || "economyFee" || "minimumFee"
const ordinalsExplorerUrl = isProduction
    ? "https://ordinals.com"
    : "https://explorer-signet.openordex.org";
const nostrOrderEventKind = 802;
const network = isProduction
    ? bitcoin.networks.bitcoin
    : bitcoin.networks.testnet;
const networkName = isProduction ? "mainnet" : "signet";
const exchangeName = "nosft";

function satsToFormattedDollarString(sats, _bitcoinPrice) {
    return (satToBtc(sats) * _bitcoinPrice).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function btcToSat(btc) {
    return Math.floor(Number(btc) * Math.pow(10, 8));
}

function satToBtc(sat) {
    return Number(sat) / Math.pow(10, 8);
}

const OpenOrdex = function () {
    this.bitcoinPrice = undefined;
    this.recommendedFeeRate = undefined;

    this.nostrRelay = relayInit(nostrRelayUrl);
    this.orders = {};
    this.txHexByIdCache = {};

    // TODO: This shouldnt be happening...
    this.sellerSignedPsbt = undefined;
    this.price = undefined;

    // Methods
    this.init = async () => {
        this.bitcoinPrice = fetch(bitcoinPriceApiUrl)
            .then((response) => response.json())
            .then((data) => data.USD.last);

        this.nostrRelay = relayInit(nostrRelayUrl);

        this.recommendedFeeRate = fetch(
            `${baseMempoolApiUrl}/v1/fees/recommended`
        )
            .then((response) => response.json())
            .then((data) => data[feeLevel]);

        return this;
    };

    this.validateSellerPSBTAndExtractPrice = function (
        sellerSignedPsbtBase64,
        utxo
    ) {
        try {
            this.sellerSignedPsbt = bitcoin.Psbt.fromBase64(
                sellerSignedPsbtBase64,
                {
                    network,
                }
            );
            const sellerInput = this.sellerSignedPsbt.txInputs[0];
            const sellerSignedPsbtInput = `${sellerInput.hash
                .reverse()
                .toString("hex")}:${sellerInput.index}`;

            if (sellerSignedPsbtInput != utxo) {
                throw `Seller signed PSBT does not match this inscription\n\n${sellerSignedPsbtInput}\n!=\n${utxo}`;
            }

            if (
                this.sellerSignedPsbt.txInputs.length != 1 ||
                this.sellerSignedPsbt.txInputs.length != 1
            ) {
                throw `Invalid seller signed PSBT`;
            }

            try {
                this.sellerSignedPsbt.extractTransaction(true);
            } catch (e) {
                if (e.message == "Not finalized") {
                    throw "PSBT not signed";
                } else if (
                    e.message != "Outputs are spending more than Inputs"
                ) {
                    throw "Invalid PSBT " + e.message || e;
                }
            }

            const sellerOutput = this.sellerSignedPsbt.txOutputs[0];
            this.price = sellerOutput.value;

            return Number(this.price);
        } catch (e) {
            console.error(e);
        }
    };

    this.getLatestOrders = async (limit, nostrLimit = 20) => {
        await this.nostrRelay.connect();
        const latestOrders = [];

        const orders = await this.nostrRelay.list([
            {
                kinds: [nostrOrderEventKind],
                limit: nostrLimit,
            },
        ]);

        for (const order of orders) {
            try {
                if (!order.tags.find((x) => x?.[0] == "s")?.[1]) {
                    continue;
                }
                const inscriptionId = order.tags.find((x) => x?.[0] == "i")[1];
                if (
                    latestOrders.find((x) => x.inscriptionId == inscriptionId)
                ) {
                    continue;
                }

                const inscriptionData = await this.getInscriptionDataById(
                    inscriptionId
                );

                const validatedPrice = this.validateSellerPSBTAndExtractPrice(
                    order.content,
                    inscriptionData.output
                );
                if (!validatedPrice) {
                    continue;
                }

                // let inscriptionTags = order.tags
                //     // .filter(([t, v]) => t === "i" && v)
                //     .map(([tagId, inscriptionId, signedPsbt]) => ({
                //         [tagId]: {
                //             inscriptionId,
                //             signedPsbt,
                //         },
                //     }));
                // // Convert array into object of key tagId
                // inscriptionTags = Object.assign(
                //     {},
                //     ...inscriptionTags.map((o) => o)
                // );

                latestOrders.push({
                    // title: `${satToBtc(
                    //     validatedPrice
                    // )} BTC ($${satsToFormattedDollarString(
                    //     validatedPrice,
                    //     await this.bitcoinPrice
                    // )})`,
                    title: `$${satsToFormattedDollarString(
                        validatedPrice,
                        await this.bitcoinPrice
                    )}`,
                    txid: order.id,
                    inscriptionId,
                    value: validatedPrice,
                    usdPrice: `$${satsToFormattedDollarString(
                        validatedPrice,
                        await this.bitcoinPrice
                    )}`,
                    ...order,
                    // tagsData: inscriptionTags,
                });

                if (latestOrders.length >= limit) {
                    break;
                }
            } catch (e) {
                console.error(e);
            }
        }

        return latestOrders;
    };

    this.loadLatestOrders = async (limit = 8, nostrLimit = 25) => {
        try {
            this.orders = await this.getLatestOrders(limit, nostrLimit);
            return this.orders;
        } catch (e) {
            console.error(e);
            console.error(`Error fetching orders:\n` + e.message);
        }

        return [];
    };

    this.getTxHexById = async function (txId) {
        if (!this.txHexByIdCache[txId]) {
            this.txHexByIdCache[txId] = await fetch(
                `${baseMempoolApiUrl}/tx/${txId}/hex`
            ).then((response) => response.text());
        }

        return this.txHexByIdCache[txId];
    };

    this.getInscriptionDataById = async function (
        inscriptionId,
        verifyIsInscriptionNumber
    ) {
        const html = await fetch(
            `${ordinalsExplorerUrl}/inscription/${inscriptionId}`
        ).then((response) => response.text());

        const data = [
            ...html.matchAll(/<dt>(.*?)<\/dt>\s*<dd.*?>(.*?)<\/dd>/gm),
        ]
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
        if (
            verifyIsInscriptionNumber &&
            String(data.number) != String(verifyIsInscriptionNumber)
        ) {
            throw new Error(error);
        }

        return data;
    };

    // Sell
    this.generatePSBTListingInscriptionForSale = async function (
        ordinalOutput,
        price,
        paymentAddress
    ) {
        let psbt = new bitcoin.Psbt({ network });

        const pk = await window.nostr.getPublicKey();
        const publicKey = Buffer.from(pk, "hex");
        const inputAddressInfo = getAddressInfo(pk);

        const [ordinalUtxoTxId, ordinalUtxoVout] = ordinalOutput.split(":");
        const tx = bitcoin.Transaction.fromHex(
            await this.getTxHexById(ordinalUtxoTxId)
        );
        for (const output in tx.outs) {
            try {
                tx.setWitness(parseInt(output), []);
            } catch {}
        }

        psbt.addInput({
            hash: ordinalUtxoTxId,
            index: parseInt(ordinalUtxoVout),
            // nonWitnessUtxo: tx.toBuffer(),
            // witnessUtxo: tx.outs[ordinalUtxoVout],
            witnessUtxo: {
                value: price,
                script: inputAddressInfo.output,
            },
            tapInternalKey: toXOnly(publicKey),
            // sighashType:
            //     bitcoin.Transaction.SIGHASH_SINGLE |
            //     bitcoin.Transaction.SIGHASH_ANYONECANPAY,
        });

        psbt.addOutput({
            address: paymentAddress,
            value: price, // @danny does this needs outputValue(price, feeRate)
        });

        const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(
            0,
            [inputAddressInfo.output],
            [price],
            bitcoin.Transaction.SIGHASH_SINGLE |
                bitcoin.Transaction.SIGHASH_ANYONECANPAY
        );

        const sig = await window.nostr.signSchnorr(sigHash.toString("hex"));
        psbt.updateInput(0, {
            tapKeySig: serializeTaprootSignature(Buffer.from(sig, "hex")),
        });

        psbt.finalizeAllInputs();
        return psbt.toBase64();
    };

    this.publishSellerPsbt = async function (
        signedSalePsbt,
        inscriptionId,
        inscriptionUtxo,
        priceInSats
    ) {
        await this.nostrRelay.connect();
        const pk = await window.nostr.getPublicKey();

        let event = {
            kind: nostrOrderEventKind,
            pubkey: pk,
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ["n", networkName], // Network name (e.g. "mainnet", "signet")
                ["t", "sell"], // Type of order (e.g. "sell", "buy")
                ["i", inscriptionId], // Inscription ID
                ["u", inscriptionUtxo], // Inscription UTXO
                ["s", priceInSats.toString()], // Price in sats
                ["x", exchangeName], // Exchange name (e.g. "openordex")
            ],
            content: signedSalePsbt,
        };
        event.id = getEventHash(event);
        const signedEvent = await window.nostr.signEvent(event);

        await this.nostrRelay.publish(signedEvent);
    };

    this.submitSignedSalePsbt = async (inscription, price, signedSalePsbt) => {
        try {
            bitcoin.Psbt.fromBase64(signedSalePsbt, {
                network,
            }).extractTransaction(true);
        } catch (e) {
            if (e.message == "Not finalized") {
                return alert(
                    "Please sign and finalize the PSBT before submitting it"
                );
            } else if (e.message != "Outputs are spending more than Inputs") {
                console.error(e);
                return alert("Invalid PSBT", e.message || e);
            }
        }

        try {
            await this.publishSellerPsbt(
                signedSalePsbt,
                inscription.inscriptionId,
                inscription.txid, // TODO: Make sure this is the correct UTXO
                btcToSat(price)
            );
        } catch (e) {
            console.error(e);
            alert("Error publishing seller PSBT", e.message || e);
        }
    };
};

export default new OpenOrdex();
