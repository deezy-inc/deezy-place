import { TESTNET } from "@lib/constants";
import { relayInit } from "nostr-tools";

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
bitcoin.initEccLib(ecc);

// TODO: Move to constants
const isProduction = !TESTNET;
const nostrRelayUrl = "wss://nostr.openordex.org";
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

async function getInscriptionDataById(
    inscriptionId,
    verifyIsInscriptionNumber
) {
    const html = await fetch(
        ordinalsExplorerUrl + "/inscription/" + inscriptionId
    ).then((response) => response.text());

    const data = [...html.matchAll(/<dt>(.*?)<\/dt>\s*<dd.*?>(.*?)<\/dd>/gm)]
        .map((x) => {
            x[2] = x[2].replace(/<.*?>/gm, "");
            return x;
        })
        .reduce((a, b) => {
            return { ...a, [b[1]]: b[2] };
        }, {});

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
}

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

                const inscriptionData = await getInscriptionDataById(
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
};

export default new OpenOrdex();
