/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { nostrPool as _nostrPool } from '../services/nostr';
import { getEventHash, validateEvent, verifySignature } from 'nostr-tools';
import axios from 'axios';
import { OpenOrdex } from './openOrdex';
import { Utxo } from './utxo';
import * as bitcoin from 'bitcoinjs-lib';
// @ts-ignore
import * as ecc from 'tiny-secp256k1';
import { Psbt } from './psbt';
bitcoin.initEccLib(ecc);
const Nostr = function (config) {
    const ordexModule = OpenOrdex(config);
    const psbtModule = Psbt(config);
    const utxoModule = Utxo(config);
    const nostrPool = _nostrPool(config);
    const nostrModule = {
        filterOrders: async (orders) => {
            for (const order of orders) {
                try {
                    const isUtxoSpent = await utxoModule.isSpent({
                        output: order.tags.find((x) => x?.[0] === 'u')[1],
                    });
                    if (isUtxoSpent.spent) {
                        continue;
                    }
                    const orderInformation = await ordexModule.getOrderInformation(order);
                    // @ts-ignore
                    if (Number(orderInformation.value) === Number(order.tags.find((x) => x?.[0] === 's')[1])) {
                        return orderInformation;
                    }
                }
                catch (e) {
                    return undefined;
                }
            }
        },
        getNostrInscription: async (inscription) => {
            const utxo = `${inscription.txid}:${inscription.vout}`;
            const orders = (await nostrPool.list([
                {
                    kinds: [config.NOSTR_KIND_INSCRIPTION],
                    '#u': [utxo],
                },
            ]))
                .filter((a) => a.tags.find((x) => x?.[0] === 's')?.[1])
                .sort((a, b) => 
            // @ts-ignore
            Number(a.tags.find((x) => x?.[0] === 's')[1]) - Number(b.tags.find((x) => x?.[0] === 's')[1]));
            for (const order of orders) {
                try {
                    const isUtxoSpent = await utxoModule.isSpent(inscription);
                    if (isUtxoSpent.spent)
                        continue;
                    const orderInformation = await ordexModule.getOrderInformation(order);
                    // @ts-ignore
                    if (Number(orderInformation.value) === Number(order.tags.find((x) => x?.[0] === 's')[1])) {
                        return orderInformation;
                    }
                }
                catch (e) {
                    return undefined;
                }
            }
            return undefined;
        },
        getNostrInscriptions: async (inscriptionIds, type = 'sell') => {
            const nostrOrders = (await nostrPool.list([
                {
                    kinds: [config.NOSTR_KIND_INSCRIPTION],
                    '#i': inscriptionIds,
                    '#t': [type],
                },
            ]))
                .filter((a) => a.tags.find((x) => x?.[0] === 's')?.[1])
                .sort((a, b) => 
            // @ts-ignore
            Number(a.tags.find((x) => x?.[0] === 's')[1]) - Number(b.tags.find((x) => x?.[0] === 's')[1]));
            // group orders by id into multiple arrays
            const groupedOrders = nostrOrders.reduce((acc, order) => {
                //@ts-ignore
                const inscriptionId = order.tags.find((x) => x?.[0] === 'i')[1];
                if (!acc[inscriptionId]) {
                    acc[inscriptionId] = [];
                }
                acc[inscriptionId].push(order);
                return acc;
            }, {});
            const result = [];
            for (const [, orders] of Object.entries(groupedOrders)) {
                const order = await nostrModule.filterOrders(orders);
                if (order)
                    result.push(order);
            }
            return result;
        },
        getLatestSellNostrInscription: async ({ inscriptionId, output }) => {
            const orders = await nostrPool.list([
                {
                    kinds: [config.NOSTR_KIND_INSCRIPTION],
                    '#i': [inscriptionId],
                    '#t': ['sell'],
                    '#u': [output],
                },
            ]);
            const filteredOrders = orders
                .filter((a) => a.tags.find((x) => x?.[0] === 's')?.[1])
                .sort((b, a) => 
            // @ts-ignore
            Number(a.created_at) - Number(b.created_at));
            const validOrders = await nostrModule.filterOrders(filteredOrders);
            return validOrders;
        },
        getNostrBid: async ({ inscriptionId, output }) => {
            const orders = (await nostrPool.list([
                {
                    kinds: [config.NOSTR_KIND_INSCRIPTION],
                    '#i': [inscriptionId],
                    '#t': ['buy'],
                    '#x': ['deezy'],
                    '#u': [output],
                },
            ]))
                .sort((a, b) => {
                //@ts-ignore
                const priceB = Number(b.tags.find((x) => x?.[0] === 's')[1]);
                //@ts-ignore
                const priceA = Number(a.tags.find((x) => x?.[0] === 's')[1]);
                if (priceB === priceA) {
                    return Number(b.created_at) - Number(a.created_at);
                }
                else {
                    return priceB - priceA;
                }
            })
                //@ts-ignore
                .reduce((acc, order) => {
                try {
                    const network = config.NETWORK;
                    const psbt = bitcoin.Psbt.fromBase64(order.content, {
                        network,
                    });
                    // use asume output index 1 is the bid owner
                    const bidOwner = bitcoin.address.fromOutputScript(psbt.txOutputs[1].script, network);
                    // use asume out index 2 is the ordinal owner
                    const ordinalOwner = bitcoin.address.fromOutputScript(psbt.txOutputs[2].script, network);
                    return [
                        ...acc,
                        {
                            // @ts-ignore
                            price: Number(order?.tags?.find((x) => x?.[0] === 's')[1]),
                            bidOwner,
                            ordinalOwner,
                            nostr: order,
                            output,
                            created_at: Number(order.created_at),
                        },
                    ];
                }
                catch (e) {
                    return acc;
                }
            }, []);
            return orders;
        },
        getNostrInscriptionByEventId: async (eventId) => {
            const orders = (await nostrPool.list([
                {
                    kinds: [config.NOSTR_KIND_INSCRIPTION],
                    ids: [eventId],
                },
            ]))
                .filter((a) => a.tags.find((x) => x?.[0] === 's')?.[1])
                .sort((a, b) => 
            // @ts-ignore
            Number(a.tags.find((x) => x?.[0] === 's')[1]) -
                // @ts-ignore
                Number(b.tags.find((x) => x?.[0] === 's')[1]));
            return nostrModule.filterOrders(orders);
        },
        getEvent: ({ inscriptionId, inscriptionUtxo, networkName = config.TESTNET ? 'testnet' : 'mainnet', priceInSats, signedPsbt, type = 'sell', pubkey, }) => {
            const event = {
                kind: config.NOSTR_KIND_INSCRIPTION,
                pubkey,
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['n', networkName],
                    ['t', type],
                    ['i', inscriptionId],
                    ['u', inscriptionUtxo],
                    ['s', priceInSats.toString()],
                    ['x', 'deezy'], // Exchange name (e.g. "openordex")
                ],
                content: signedPsbt,
                id: '',
            };
            event.id = getEventHash(event);
            return event;
        },
        subscribeOrders: ({ callback, limit = 5, filter = {}, }) => {
            const nostrFilter = {
                kinds: [config.NOSTR_KIND_INSCRIPTION],
                limit,
                ...filter,
            };
            return nostrPool.subscribe([nostrFilter], async (event) => {
                console.log('event', event);
                try {
                    const order = await ordexModule.getOrderInformation(event);
                    callback(undefined, order);
                }
                catch (e) {
                    console.error(e);
                }
            }, () => {
                console.log(`eose`);
            });
        },
        subscribePlainOrders: ({ callback, limit = 5, filter = {}, }) => {
            const nostrFilter = {
                kinds: [config.NOSTR_KIND_INSCRIPTION],
                limit,
                ...filter,
            };
            return nostrPool.subscribe([nostrFilter], async (event) => {
                callback(undefined, event);
            }, () => {
                console.log(`eose`);
            });
        },
        listOrders: async ({ limit = 5, filter = {} }) => {
            const nostrFilter = {
                kinds: [config.NOSTR_KIND_INSCRIPTION],
                limit,
                ...filter,
            };
            const orders = await nostrPool.list([nostrFilter]);
            return orders
                .map(async (order) => {
                try {
                    const orderInfo = await ordexModule.getOrderInformation(order);
                    return orderInfo;
                }
                catch (e) {
                    return undefined;
                }
            })
                .filter((a) => a);
        },
        unsubscribeOrders: () => {
            nostrPool.unsubscribeAll();
        },
        // Dutch auction API abstracts the process of signing it and publishing it to nostr
        publishOrder: async ({ utxo, ordinalValue, signedPsbt: _signedPsbt, type = 'sell' }) => {
            const signedPsbt = typeof _signedPsbt === 'string' ? psbtModule.getPsbt(_signedPsbt).toBase64() : _signedPsbt;
            const data = await axios.post(`${config.AUCTION_URL}/nostr`, {
                psbt: signedPsbt,
                output: utxo.output,
                inscriptionId: utxo.inscriptionId,
                currentPrice: ordinalValue,
                type,
            });
            return data.data;
        },
        signAndBroadcastEvent: async ({ utxo, ordinalValue, signedPsbt, pubkey }) => {
            const { inscriptionId } = utxo;
            const inscriptionUtxo = `${utxo.txid}:${utxo.vout}`;
            const event = nostrModule.getEvent({
                inscriptionId,
                inscriptionUtxo,
                priceInSats: ordinalValue,
                signedPsbt,
                pubkey,
            });
            const signedEvent = await nostrPool.sign(event);
            const ok = validateEvent(signedEvent);
            const veryOk = verifySignature(signedEvent);
            // convert the callback to a promise
            if (!ok) {
                throw new Error('Invalid event');
            }
            if (!veryOk) {
                throw new Error('Invalid signature');
            }
            return new Promise((resolve, reject) => {
                nostrPool.publish(signedEvent, resolve, reject);
            });
        },
    };
    return nostrModule;
};
export { Nostr };
