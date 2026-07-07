import { serializeTaprootSignature } from 'bitcoinjs-lib/src/psbt/bip371.js';
import { ethers } from 'ethers';
import { signTransaction } from 'sats-connect';
import { ECPairFactory } from 'ecpair';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
// @ts-ignore
import * as ecc from 'tiny-secp256k1';
import SessionStorage, { SessionsStorageKeys } from '../services/session-storage';
import NostrKey, { NOSTR_PROVIDER } from '../services/nostr-key';
import axios from 'axios';
import { Crypto } from './crypto';
import { Address } from './address';
import { NETWORK, NETWORK_NAME, BOOST_UTXO_VALUE } from '../config/constants';
import { isMetamaskProvider } from './wallet';
import { Utxo } from './utxo';
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);
function isHexadecimal(str) {
    const hexRegex = /^[0-9A-Fa-f]*$/;
    return str.length % 2 === 0 && hexRegex.test(str);
}
const getPsbt = (psbtContent) => {
    const psbt = isHexadecimal(psbtContent)
        ? bitcoin.Psbt.fromHex(psbtContent, {
            network: NETWORK,
        })
        : bitcoin.Psbt.fromBase64(psbtContent, {
            network: NETWORK,
        });
    return psbt;
};
const getPsbtBase64 = (psbtContent) => {
    const buffer = Buffer.from(psbtContent, 'hex');
    return buffer.toString('base64');
};
const Psbt = function (config) {
    const addressModule = Address(config);
    const cryptoModule = Crypto(config);
    const utxoModule = Utxo(config);
    // Returns the output data only if the ordinals backend positively vouches
    // for it (request succeeded and the output is indexed); null otherwise
    const getVerifiedOutput = async (utxo) => {
        try {
            const output = await utxoModule.getOutput(`${utxo.txid}:${utxo.vout}`);
            if (!output || output.indexed !== true) {
                return null;
            }
            return output;
        }
        catch (e) {
            console.log(`Error fetching output for ${utxo.txid}:${utxo.vout}`, e);
            return null;
        }
    };
    // runes is an object keyed by rune name ({ "RUNE•NAME": {...} });
    // handle an entries array too in case the API schema changes
    const runeNamesFromOutput = (output) => {
        const runes = output.runes;
        if (Array.isArray(runes)) {
            return runes.map(entry => (Array.isArray(entry) ? entry[0] : entry));
        }
        return Object.keys(runes || {});
    };
    // Non-common sat rarities ("rare sats", e.g. uncommon) carried by an
    // output; only turbo-style sat_ranges objects have rarity info
    const rareSatRaritiesFromOutput = (output) => {
        const satRanges = Array.isArray(output.sat_ranges) ? output.sat_ranges : [];
        return [...new Set(satRanges
                .map(range => (range && typeof range === 'object' ? range.rarity : undefined))
                .filter(rarity => rarity && rarity !== 'common'))];
    };
    // A utxo is only safe to spend as fees/consolidation if the backend
    // confirms it carries no inscriptions, no runes, and no rare sats
    const isVerifiedCardinal = async (utxo) => {
        const output = await getVerifiedOutput(utxo);
        if (!output) {
            return false;
        }
        const hasInscriptions = Array.isArray(output.inscriptions) && output.inscriptions.length > 0;
        return (!hasInscriptions &&
            runeNamesFromOutput(output).length === 0 &&
            rareSatRaritiesFromOutput(output).length === 0);
    };
    const psbtModule = {
        getPsbt,
        getPsbtBase64,
        getMetamaskSigner: async (metamaskDomain) => {
            // @ts-ignore
            const { ethereum } = window;
            let ethAddress = ethereum.selectedAddress;
            if (!ethAddress) {
                await ethereum.request({ method: 'eth_requestAccounts' });
                ethAddress = ethereum.selectedAddress;
            }
            // @ts-ignore
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const toSign = `0x${Buffer.from(config.TAPROOT_MESSAGE(metamaskDomain)).toString('hex')}`;
            const signature = await provider.send('personal_sign', [toSign, ethAddress]);
            const seed = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.arrayify(signature)));
            const root = bip32.fromSeed(Buffer.from(seed));
            const taprootChild = root.derivePath(config.DEFAULT_DERIV_PATH);
            const { privateKey } = taprootChild;
            // @ts-ignore
            const keyPair = ECPair.fromPrivateKey(privateKey);
            return cryptoModule.tweakSigner(keyPair);
        },
        signMetamask: async (sigHash, metamaskDomain) => {
            const tweakedSigner = await psbtModule.getMetamaskSigner(metamaskDomain);
            // @ts-ignore
            return tweakedSigner.signSchnorr(sigHash);
        },
        // Schnorr-signs a sighash with whichever nostr key source is
        // connected: a pasted raw key held in memory, or the extension
        signSchnorrHex: (sigHashHex) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            console.log('[psbt] signSchnorrHex via provider:', provider);
            if (provider === NOSTR_PROVIDER) {
                return NostrKey.signSchnorr(sigHashHex);
            }
            // @ts-ignore
            return window.nostr.signSchnorr(sigHashHex);
        },
        signNostr: (sigHash) => {
            return psbtModule.signSchnorrHex(sigHash.toString('hex'));
        },
        signSigHash: ({ sigHash }) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider === 'xverse') {
                throw new Error('Signing with xverse is not supported yet.');
            }
            if (provider === 'unisat.io') {
                throw new Error('Signing with unisat.io is not supported yet.');
            }
            if (isMetamaskProvider(provider)) {
                return psbtModule.signMetamask(sigHash, provider);
            }
            return psbtModule.signNostr(sigHash);
        },
        getInputParams: ({ utxo, inputAddressInfo, sighashType }) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            const pubKey = provider === 'unisat.io' ? inputAddressInfo.internalPubkey : inputAddressInfo.pubkey;
            const params = {
                hash: utxo.txid,
                index: utxo.vout,
                witnessUtxo: {
                    value: utxo.value,
                    script: Buffer.from(inputAddressInfo.output, 'hex'),
                },
                tapInternalKey: pubKey,
                sequence: 0xfffffffd,
            };
            if (sighashType) {
                // @ts-ignore
                params.sighashType = sighashType;
            }
            return params;
        },
        createPsbt: ({ utxo, inputAddressInfo, destinationBtcAddress, sendFeeRate, output, sighashType }) => {
            const psbt = new bitcoin.Psbt({ network: config.NETWORK });
            // Input
            const inputParams = psbtModule.getInputParams({ utxo, inputAddressInfo, sighashType });
            psbt.addInput(inputParams);
            const psbtOutputValue = output || cryptoModule.outputValue(utxo, sendFeeRate);
            psbt.addOutput({
                address: destinationBtcAddress,
                value: psbtOutputValue,
            });
            return psbt;
        },
        createPsbtForBoost: async ({ pubKey, utxo, destinationBtcAddress, outputValue = BOOST_UTXO_VALUE }) => {
            const inputAddressInfo = await addressModule.getAddressInfo(pubKey);
            const psbt = psbtModule.createPsbt({
                utxo,
                inputAddressInfo,
                destinationBtcAddress,
                output: outputValue,
            });
            return psbt.toHex();
        },
        signPsbtForBoostByXverse: async ({ psbt, address }) => {
            const signPsbtOptions = {
                onFinish: () => { },
                onCancel: () => { },
                payload: {
                    network: {
                        type: NETWORK_NAME,
                    },
                    message: 'Sign Transaction',
                    psbtBase64: psbt.toBase64(),
                    broadcast: false,
                    inputsToSign: [
                        {
                            address,
                            signingIndexes: [0],
                        },
                    ],
                },
            };
            const psbtBase64 = await new Promise((resolve, reject) => {
                signPsbtOptions.onFinish = ({ psbtBase64: _psbtBase64 }) => {
                    resolve(_psbtBase64);
                };
                signPsbtOptions.onCancel = () => {
                    reject(new Error('Request canceled.'));
                };
                signTransaction(signPsbtOptions);
            });
            const finalPsbt = bitcoin.Psbt.fromBase64(psbtBase64, {
                network: NETWORK,
            }).finalizeInput(0);
            return finalPsbt.toHex();
        },
        signPsbtForBoost: async ({ psbt, address }) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider === 'xverse') {
                return psbtModule.signPsbtForBoostByXverse({ psbt, address });
            }
            if (provider === 'unisat.io') {
                return window.unisat.signPsbt(psbt.toHex());
            }
            const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(0, psbt.data.inputs.map((input) => input.witnessUtxo.script), psbt.data.inputs.map((input) => input.witnessUtxo.value), // eslint-disable-next-line no-bitwise
            bitcoin.Transaction.SIGHASH_ALL);
            const signed = await psbtModule.signSigHash({ sigHash });
            psbt.updateInput(0, {
                // @ts-ignore
                tapKeySig: serializeTaprootSignature(Buffer.from(signed, 'hex'), [bitcoin.Transaction.SIGHASH_ALL]),
            });
            // Finalize the PSBT. Note that the transaction will not be broadcast to the Bitcoin network yet.
            psbt.finalizeInput(0);
            return psbt.toHex();
        },
        broadcastTx: async (tx) => {
            const hex = tx.toBuffer().toString('hex');
            const fullTx = bitcoin.Transaction.fromHex(hex);
            // It is added in order to debug the transaction
            await axios.post(`https://mempool.space/api/tx`, hex);
            return fullTx.getId();
        },
        broadcastPsbt: async (psbt) => {
            const tx = psbt.extractTransaction();
            return psbtModule.broadcastTx(tx);
        },
        broadcastUnisat: async ({ psbt, utxo, destinationBtcAddress, sendFeeRate }) => {
            // If is an inscription, send it to unisat
            if (utxo.inscriptionId) {
                return window.unisat.sendInscription(destinationBtcAddress, utxo.inscriptionId, {
                    feeRate: sendFeeRate,
                });
            }
            const signedPsbt = await window.unisat.signPsbt(psbt.toHex());
            return window.unisat.pushPsbt(signedPsbt);
        },
        signAndBroadcastUtxoByXverse: async ({ pubKey, address, utxo, destinationBtcAddress, sendFeeRate }) => {
            const inputAddressInfo = await addressModule.getAddressInfo(pubKey);
            const basePsbt = await psbtModule.createPsbt({
                utxo,
                inputAddressInfo,
                destinationBtcAddress,
                sendFeeRate,
            });
            const signPsbtOptions = {
                onFinish: () => { },
                onCancel: () => { },
                payload: {
                    network: {
                        type: NETWORK_NAME,
                    },
                    message: 'Sign Transaction',
                    psbtBase64: basePsbt.toBase64(),
                    broadcast: false,
                    inputsToSign: [
                        {
                            address,
                            signingIndexes: [0],
                        },
                    ],
                },
            };
            const psbtBase64 = await new Promise((resolve, reject) => {
                signPsbtOptions.onFinish = ({ psbtBase64: _psbtBase64 }) => {
                    resolve(_psbtBase64);
                };
                signPsbtOptions.onCancel = () => {
                    reject(new Error('Request canceled.'));
                };
                signTransaction(signPsbtOptions);
            });
            const psbt = bitcoin.Psbt.fromBase64(psbtBase64, {
                network: NETWORK,
            }).finalizeAllInputs();
            return psbtModule.broadcastPsbt(psbt);
        },
        signAndBroadcastUtxo: async ({ pubKey, utxo, destinationBtcAddress, sendFeeRate, address }) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider === 'xverse') {
                return psbtModule.signAndBroadcastUtxoByXverse({
                    pubKey,
                    address,
                    utxo,
                    destinationBtcAddress,
                    sendFeeRate,
                });
            }
            const inputAddressInfo = await addressModule.getAddressInfo(pubKey);
            // @ts-ignore
            const psbt = psbtModule.createPsbt({ utxo, inputAddressInfo, destinationBtcAddress, sendFeeRate });
            if (provider === 'unisat.io') {
                return psbtModule.broadcastUnisat({ psbt, utxo, destinationBtcAddress, sendFeeRate });
            }
            // @ts-ignore
            const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(0, [inputAddressInfo.output], [utxo.value], bitcoin.Transaction.SIGHASH_DEFAULT);
            const signed = await psbtModule.signSigHash({ sigHash });
            psbt.updateInput(0, {
                // @ts-ignore
                tapKeySig: serializeTaprootSignature(Buffer.from(signed, 'hex')),
            });
            // Finalize the PSBT. Note that the transaction will not be broadcast to the Bitcoin network yet.
            psbt.finalizeAllInputs();
            // Send it!
            return psbtModule.broadcastPsbt(psbt);
        },
        // preparePsbtForMultipleSend allows safe bulk UTXO transfers, with appropriate fees.
        // 1. Any input UTXOs with an inscription will be created as a distinct output UTXO of the same size, and appear before any non-inscription UTXOs in the resultant PSBT
        // 2. Any input UTXOs without an inscription will have their amounts consolidated into a single output UTXO
        // 3. A check is run to ensure that enough cardinal funds are available to perform the transfer. If step 2 does not contain enough cardinal funds, cardinal funds will be appended to the PSBT, and another change output will be created
        preparePsbtForMultipleSend: async ({ address, pubKey, selectedUtxos, ownedUtxos, destinationBtcAddress, sendFeeRate }) => {
            const utxosWithInscription = selectedUtxos.filter(utxo => utxo.inscriptionId);
            // Runes and rare-sat utxos are sent value-preserved (fees come
            // from separate cardinal funding), never consolidated with
            // cardinals or spent as fees
            const utxosWithRunes = [];
            const runeNamesByUtxo = [];
            const utxosWithRareSats = [];
            const utxosWithoutInscription = [];
            // Verify against the backend in parallel batches — one awaited
            // request per utxo made preparing large sends take tens of
            // seconds — then classify in the original selection order so the
            // FIFO input/output mapping stays deterministic
            const uninscribedSelected = selectedUtxos.filter(u => !u.inscriptionId);
            const verifiedOutputs = [];
            const verifyBatchSize = 10;
            for (let i = 0; i < uninscribedSelected.length; i += verifyBatchSize) {
                const batch = uninscribedSelected.slice(i, i + verifyBatchSize);
                // eslint-disable-next-line no-await-in-loop
                const results = await Promise.all(batch.map(u => getVerifiedOutput(u)));
                verifiedOutputs.push(...results);
            }
            for (const [index, utxo] of uninscribedSelected.entries()) {
                const outpoint = `${utxo.txid}:${utxo.vout}`;
                // Require positive backend verification before classifying: a
                // utxo with no inscriptionId annotation may simply have been
                // fetched while the ordinals backend was degraded
                const output = verifiedOutputs[index];
                if (!output) {
                    throw new Error(`Unable to verify utxo ${outpoint} with the ordinals service. Please try again later.`);
                }
                if (Array.isArray(output.inscriptions) && output.inscriptions.length > 0) {
                    throw new Error(`Utxo ${outpoint} contains an inscription the wallet had not detected. Please refresh the page and try again.`);
                }
                const runeNames = runeNamesFromOutput(output);
                if (runeNames.length > 0) {
                    // A rune utxo carrying rare sats stays in the runes bucket;
                    // runes rules are stricter and the value (with its sats) is
                    // preserved either way
                    utxosWithRunes.push(utxo);
                    runeNamesByUtxo.push(runeNames);
                }
                else if (rareSatRaritiesFromOutput(output).length > 0) {
                    utxosWithRareSats.push(utxo);
                }
                else {
                    utxosWithoutInscription.push(utxo);
                }
            }
            if (utxosWithInscription.length === 0 &&
                utxosWithRunes.length === 0 &&
                utxosWithRareSats.length === 0 &&
                utxosWithoutInscription.length === 0) {
                throw new Error('At least one ordinal or utxo is required.');
            }
            // Runes always transfer to the first output no matter which input
            // carries them (unlike inscriptions, which map FIFO across
            // inputs/outputs), so runes sends must not mix with anything else
            if (utxosWithRunes.length > 0 &&
                (utxosWithInscription.length > 0 || utxosWithRareSats.length > 0 || utxosWithoutInscription.length > 0)) {
                throw new Error('Runes must be sent separately from inscriptions and other utxos.');
            }
            // Multiple runes utxos are allowed only when they all hold the same
            // rune, since they all get consolidated into a single output
            if (utxosWithRunes.length > 1) {
                const firstNames = runeNamesByUtxo[0];
                const sameRune = runeNamesByUtxo.every(names => names.length === 1 && names[0] === firstNames[0]);
                if (!sameRune) {
                    throw new Error('Only utxos holding the same rune can be sent together. Please send different runes separately.');
                }
            }
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider !== 'alby' && provider !== NOSTR_PROVIDER) {
                throw new Error('Signing not supported.');
            }
            // only used if selectedCardinalAmount is not large enough to cover fees.
            // A positive runes/rare-sats tag from the wallet's classification is
            // enough to exclude a candidate outright; the absence of a tag is NOT
            // enough to admit one (the annotation fetch could have been degraded),
            // so the survivors still get positively verified below
            const cardinalUtxos = ownedUtxos.filter(utxo => !selectedUtxos.some(selected => selected.txid === utxo.txid && selected.vout === utxo.vout))
                .filter((x) => x.status.confirmed)
                .filter(utxo => !utxo.inscriptionId)
                .filter(utxo => !(utxo.runes?.length > 0) && !(utxo.rareSats?.length > 0))
                .sort((a, b) => b.value - a.value);
            const selectedCardinalAmount = utxosWithoutInscription.reduce((acc, utxo) => acc + utxo.value, 0);
            // Value-preserved utxos: inscriptions and rare-sat utxos each
            // become a distinct same-value output (FIFO input→output mapping
            // keeps their sats intact); runes all consolidate into one output
            const preservedUtxos = [...utxosWithInscription, ...utxosWithRareSats, ...utxosWithRunes];
            const preservedOutputCount = utxosWithRunes.length > 0
                ? 1
                : utxosWithInscription.length + utxosWithRareSats.length;
            const inputs = [...preservedUtxos, ...utxosWithoutInscription];
            // Never fund with a utxo the ordinals backend can't positively
            // verify as free of inscriptions, runes, and rare sats: the
            // wallet's own annotations could be missing if the backend was
            // degraded when they were fetched. Candidates are verified in
            // parallel batches (still consumed largest-first) — checking one
            // per awaited round trip made preparing sends crawl in wallets
            // where the top candidates keep getting rejected as rare sats
            const verifiedFundingUtxos = [];
            let nextCandidateIndex = 0;
            const ensureVerifiedFundingUtxo = async () => {
                while (verifiedFundingUtxos.length === 0 && nextCandidateIndex < cardinalUtxos.length) {
                    const batch = cardinalUtxos.slice(nextCandidateIndex, nextCandidateIndex + 10);
                    nextCandidateIndex += batch.length;
                    // eslint-disable-next-line no-await-in-loop
                    const results = await Promise.all(batch.map(async (utxo) => ((await isVerifiedCardinal(utxo)) ? utxo : null)));
                    verifiedFundingUtxos.push(...results.filter(Boolean));
                }
                return verifiedFundingUtxos.shift();
            };
            let totalCardinalAmount = selectedCardinalAmount;
            let calculatedFee = 0;
            let isCardinalAdded = false;
            while (true) {
                calculatedFee = cryptoModule.calculateFee({
                    vins: inputs.length,
                    vouts: preservedOutputCount + (selectedCardinalAmount > 0 ? 1 : 0) + (isCardinalAdded ? 1 : 0),
                    recommendedFeeRate: sendFeeRate,
                    includeChangeOutput: 0,
                });
                if (totalCardinalAmount >= calculatedFee)
                    break;
                // eslint-disable-next-line no-await-in-loop
                const utxo = await ensureVerifiedFundingUtxo();
                if (!utxo) {
                    throw new Error(`Please add more cardinal funds to your wallet.`);
                }
                inputs.push(utxo);
                totalCardinalAmount += utxo.value;
                isCardinalAdded = true;
            }
            if (totalCardinalAmount < calculatedFee) {
                throw new Error(`Please add more cardinal funds to your wallet.`);
            }
            const inputAddressInfo = await addressModule.getAddressInfo(pubKey);
            const psbt = new bitcoin.Psbt({ network: config.NETWORK });
            for (const utxo of inputs) {
                const inputParams = psbtModule.getInputParams({ utxo, inputAddressInfo });
                psbt.addInput(inputParams);
            }
            const utxoType = (utxo) => {
                if (utxo.inscriptionId) return 'Ordinal';
                if (utxosWithRunes.includes(utxo)) return 'Runes';
                if (utxosWithRareSats.includes(utxo)) return 'Rare Sats';
                return 'Cardinal';
            };
            const metadata = {
                inputs: inputs.map((utxo, index) => ({
                    index,
                    type: utxoType(utxo),
                    value: utxo.value,
                })),
                outputs: [],
            };
            // Add value-preserved outputs
            if (utxosWithRunes.length > 0) {
                // Runes always land on the first output regardless of which
                // input carries them, so one consolidated output receives all
                // (same-rune) runes along with the combined utxo value
                const runesAmount = utxosWithRunes.reduce((acc, utxo) => acc + utxo.value, 0);
                psbt.addOutput({
                    address: destinationBtcAddress,
                    value: runesAmount,
                });
                metadata.outputs.push({ type: 'Runes' });
            }
            else {
                // Same order as the inputs (inscriptions then rare sats) so
                // the FIFO mapping sends each preserved utxo's sats to its
                // own same-value output
                utxosWithInscription.forEach(() => {
                    metadata.outputs.push({ type: 'Ordinal' });
                });
                utxosWithRareSats.forEach(() => {
                    metadata.outputs.push({ type: 'Rare Sats' });
                });
                [...utxosWithInscription, ...utxosWithRareSats].forEach(utxo => {
                    psbt.addOutput({
                        address: destinationBtcAddress,
                        value: utxo.value,
                    });
                });
            }
            let changeAmount = 0;
            // Add change output if we added cardinal funds
            if (isCardinalAdded) {
                changeAmount = totalCardinalAmount - selectedCardinalAmount - calculatedFee;
                psbt.addOutput({
                    address,
                    value: changeAmount,
                });
                metadata.outputs.push({ type: 'Change' });
                if (selectedCardinalAmount > 0) {
                    psbt.addOutput({
                        address: destinationBtcAddress,
                        value: selectedCardinalAmount,
                    });
                    metadata.outputs.push({ type: 'Cardinal' });
                }
            }
            else {
                psbt.addOutput({
                    address: destinationBtcAddress,
                    value: selectedCardinalAmount - calculatedFee,
                });
                metadata.outputs.push({ type: 'Cardinal' });
            }
            return {
                unsignedPsbtHex: psbt.toHex(),
                metadata
            };
        },
        // onProgress(signedCount, totalCount) is called before the first
        // signature and after each completed one
        signPsbtForMultipleSend: async (unsignedPsbtHex, onProgress) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider !== 'alby' && provider !== NOSTR_PROVIDER) {
                throw new Error('Signing not supported.');
            }
            const psbt = bitcoin.Psbt.fromHex(unsignedPsbtHex, { network: NETWORK });
            const witnessScripts = [];
            const witnessValues = [];
            psbt.data.inputs.forEach((input, i) => {
                if (!input.finalScriptWitness && !input.witnessUtxo) {
                    // @ts-ignore
                    const tx = bitcoin.Transaction.fromBuffer(psbt.data.inputs[i].nonWitnessUtxo);
                    const output = tx.outs[psbt.txInputs[i].index];
                    psbt.updateInput(i, {
                        witnessUtxo: output,
                    });
                    // @ts-ignore
                    witnessScripts.push(output.script);
                    // @ts-ignore
                    witnessValues.push(output.value);
                }
                else {
                    // @ts-ignore
                    witnessScripts.push(psbt.data.inputs[i].witnessUtxo.script);
                    // @ts-ignore
                    witnessValues.push(psbt.data.inputs[i].witnessUtxo.value);
                }
            });
            const psbtOutputs = psbt.data.inputs.map((_, index) => {
                // @ts-ignore
                const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(index, witnessScripts, witnessValues, bitcoin.Transaction.SIGHASH_DEFAULT);
                return {
                    index,
                    sigHash: sigHash.toString('hex')
                };
            });
            // Sign sequentially: the extension prompts for each input, and
            // signing one at a time lets the UI report progress accurately
            if (onProgress) {
                onProgress(0, psbtOutputs.length);
            }
            for (let i = 0; i < psbtOutputs.length; i += 1) {
                const output = psbtOutputs[i];
                // eslint-disable-next-line no-await-in-loop
                const signature = await psbtModule.signSchnorrHex(output.sigHash);
                psbt.updateInput(output.index, {
                    tapKeySig: serializeTaprootSignature(Buffer.from(signature, 'hex')),
                });
                if (onProgress) {
                    onProgress(i + 1, psbtOutputs.length);
                }
            }
            const finalSignedPsbt = psbt.finalizeAllInputs();
            const finalFee = finalSignedPsbt.getFee();
            const finalTx = finalSignedPsbt.extractTransaction();
            const finalVBytes = finalTx.virtualSize();
            const finalFeeRate = (finalFee / finalVBytes).toFixed(1);
            const finalSignedHexPsbt = finalSignedPsbt.toHex();
            return {
                finalFeeRate,
                finalFee,
                finalSignedHexPsbt,
                finalSignedPsbt,
            };
        },
        createAndSignPsbtForBoost: async ({ pubKey, utxo, destinationBtcAddress, sighashType }) => {
            const inputAddressInfo = await addressModule.getAddressInfo(pubKey);
            const psbt = psbtModule.createPsbt({
                utxo,
                inputAddressInfo,
                destinationBtcAddress,
                sighashType,
                output: config.BOOST_UTXO_VALUE,
            });
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider === 'unisat.io') {
                return window.unisat.signPsbt(psbt.toHex());
            }
            // @ts-ignore
            const sigHash = psbt.__CACHE.__TX.hashForWitnessV1(0, [inputAddressInfo.output], [utxo.value], 
            // eslint-disable-next-line no-bitwise
            bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY);
            const signed = await psbtModule.signSigHash({ sigHash });
            psbt.updateInput(0, {
                // @ts-ignore
                tapKeySig: serializeTaprootSignature(Buffer.from(signed, 'hex'), [
                    // @ts-ignore
                    bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
                ]),
            });
            // Finalize the PSBT. Note that the transaction will not be broadcast to the Bitcoin network yet.
            psbt.finalizeAllInputs();
            return psbt.toHex();
        },
        signPsbtListingXverse: async ({ psbt, address }) => {
            const signPsbtOptions = {
                onFinish: () => { },
                onCancel: () => { },
                payload: {
                    network: {
                        type: NETWORK_NAME,
                    },
                    message: 'Sign Transaction',
                    psbtBase64: psbt.toBase64(),
                    broadcast: false,
                    inputsToSign: [
                        {
                            address,
                            signingIndexes: [0],
                            sigHash: 131,
                        },
                    ],
                },
            };
            const psbtBase64 = await new Promise((resolve, reject) => {
                signPsbtOptions.onFinish = ({ psbtBase64: _psbtBase64 }) => {
                    resolve(_psbtBase64);
                };
                signPsbtOptions.onCancel = () => {
                    reject(new Error('Request canceled.'));
                };
                signTransaction(signPsbtOptions);
            });
            const finalPsbt = bitcoin.Psbt.fromBase64(psbtBase64, {
                network: NETWORK,
            }).finalizeInput(0);
            return finalPsbt;
        },
        signPsbtMessage: async (psbt, address, getPsbt = false, ignoreFinalizeDummies = false) => {
            const virtualToSign = bitcoin.Psbt.fromBase64(psbt, {
                network: NETWORK,
            });
            // if only 1 input, then this is a PSBT listing
            if (virtualToSign.inputCount === 1 && virtualToSign.txOutputs.length === 1) {
                const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
                if (provider === 'xverse') {
                    return psbtModule.signPsbtListingXverse({
                        psbt: virtualToSign,
                        address,
                    });
                }
                if (provider === 'unisat.io') {
                    const unisatSigned = await window.unisat.signPsbt(virtualToSign.toHex());
                    return bitcoin.Psbt.fromHex(unisatSigned, {
                        network: NETWORK,
                    });
                }
                // @ts-ignore
                const sigHash = virtualToSign.__CACHE.__TX.hashForWitnessV1(0, 
                // @ts-ignore
                [virtualToSign.data.inputs[0].witnessUtxo.script], 
                // @ts-ignore
                [virtualToSign.data.inputs[0].witnessUtxo.value], 
                // eslint-disable-next-line no-bitwise
                bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY);
                // @ts-ignore
                const sign = await psbtModule.signSigHash({ sigHash });
                virtualToSign.updateInput(0, {
                    // @ts-ignore
                    tapKeySig: serializeTaprootSignature(Buffer.from(sign, 'hex'), [
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
                if (!input.finalScriptWitness && !input.witnessUtxo) {
                    // @ts-ignore
                    const tx = bitcoin.Transaction.fromBuffer(virtualToSign.data.inputs[i].nonWitnessUtxo);
                    const output = tx.outs[virtualToSign.txInputs[i].index];
                    virtualToSign.updateInput(i, {
                        witnessUtxo: output,
                    });
                    // @ts-ignore
                    witnessScripts.push(output.script);
                    // @ts-ignore
                    witnessValues.push(output.value);
                }
                else {
                    // @ts-ignore
                    witnessScripts.push(virtualToSign.data.inputs[i].witnessUtxo.script);
                    // @ts-ignore
                    witnessValues.push(virtualToSign.data.inputs[i].witnessUtxo.value);
                }
            });
            // create and update resultant sighashes
            // eslint-disable-next-line no-restricted-syntax
            for (const [i, input] of virtualToSign.data.inputs.entries()) {
                const isDummy = i === 0 || i === 1;
                const finalizeFirstInputs = ignoreFinalizeDummies && isDummy;
                // Ignore first 2 dummy inputs
                if (!input.finalScriptWitness && !finalizeFirstInputs) {
                    // @ts-ignore
                    const sigHash = virtualToSign.__CACHE.__TX.hashForWitnessV1(i, witnessScripts, witnessValues, bitcoin.Transaction.SIGHASH_DEFAULT);
                    // eslint-disable-next-line no-await-in-loop
                    const signature = await psbtModule.signSigHash({ sigHash });
                    virtualToSign.updateInput(i, {
                        // @ts-ignore
                        tapKeySig: serializeTaprootSignature(Buffer.from(signature, 'hex')),
                    });
                    virtualToSign.finalizeInput(i);
                }
            }
            if (getPsbt) {
                return virtualToSign;
            }
            return virtualToSign.extractTransaction();
        },
        signPaymentInput: async ({ psbt }) => {
            const virtualToSign = bitcoin.Psbt.fromBase64(psbt.toBase64(), { network: config.NETWORK });
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider === 'xverse' || provider === 'unisat.io') {
                throw new Error('Signing not supported.');
            }
            const witnessScripts = [];
            const witnessValues = [];
            // update all witnesses and values
            virtualToSign.data.inputs.forEach((input, i) => {
                if (!input.finalScriptWitness && !input.witnessUtxo) {
                    // @ts-ignore
                    const tx = bitcoin.Transaction.fromBuffer(virtualToSign.data.inputs[i].nonWitnessUtxo);
                    const output = tx.outs[virtualToSign.txInputs[i].index];
                    virtualToSign.updateInput(i, {
                        witnessUtxo: output,
                    });
                    // @ts-ignore
                    witnessScripts.push(output.script);
                    // @ts-ignore
                    witnessValues.push(output.value);
                }
                else {
                    // @ts-ignore
                    witnessScripts.push(virtualToSign.data.inputs[i].witnessUtxo.script);
                    // @ts-ignore
                    witnessValues.push(virtualToSign.data.inputs[i].witnessUtxo.value);
                }
            });
            for (const [index, input] of virtualToSign.data.inputs.entries()) {
                if (input.sighashType === bitcoin.Transaction.SIGHASH_ALL) {
                    // @ts-ignore
                    const sigHash = virtualToSign.__CACHE.__TX.hashForWitnessV1(index, witnessScripts, witnessValues, bitcoin.Transaction.SIGHASH_ALL);
                    const signature = await psbtModule.signSigHash({ sigHash });
                    virtualToSign.updateInput(index, {
                        // @ts-ignore
                        tapKeySig: serializeTaprootSignature(Buffer.from(signature, 'hex'), [
                            bitcoin.Transaction.SIGHASH_ALL,
                        ]),
                    });
                    virtualToSign.finalizeInput(index);
                }
            }
            return virtualToSign.toBase64();
        },
        signBuyOrderWithXverse: async ({ psbt, address }) => {
            const inputsToSign = [];
            console.log('address', address);
            console.log('signBuyOrderWithXverse', psbt.toBase64());
            const currentPsbt = bitcoin.Psbt.fromBase64(psbt.toBase64(), {
                network: NETWORK,
            });
            for (const [i, input] of currentPsbt.data.inputs.entries()) {
                if (input.sighashType === bitcoin.Transaction.SIGHASH_ALL && input.redeemScript) {
                    inputsToSign.push({
                        address,
                        signingIndexes: [i],
                        sigHash: bitcoin.Transaction.SIGHASH_ALL,
                    });
                }
            }
            const signPsbtOptions = {
                onFinish: () => { },
                onCancel: () => { },
                payload: {
                    network: {
                        type: NETWORK_NAME,
                    },
                    message: 'Sign Transaction',
                    psbtBase64: psbt.toBase64(),
                    broadcast: false,
                    inputsToSign,
                },
            };
            const signedPsbtBase64 = await new Promise((resolve, reject) => {
                signPsbtOptions.onFinish = ({ psbtBase64: _psbtBase64, txId: _txId }) => {
                    resolve(_psbtBase64);
                };
                signPsbtOptions.onCancel = () => {
                    reject(new Error('Request canceled.'));
                };
                try {
                    signTransaction(signPsbtOptions);
                }
                catch (error) {
                    console.error(error);
                    reject(error);
                }
            });
            const finalPsbt = bitcoin.Psbt.fromBase64(signedPsbtBase64, {
                network: NETWORK,
            });
            for (const i in inputsToSign) {
                finalPsbt.finalizeInput(inputsToSign[i].signingIndexes[0]);
            }
            return finalPsbt.toBase64();
        },
        signPsbtListingForBuy: async ({ psbt, ordinalAddress, paymentAddress }) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            let signedPsbt;
            if (provider === 'unisat.io') {
                const finalPopulatedPsbt = await window.unisat.signPsbt(psbt.toHex(), { autoFinalize: false });
                const buffer = Buffer.from(finalPopulatedPsbt, 'hex');
                signedPsbt = buffer.toString('base64');
            }
            else if (provider === 'xverse') {
                signedPsbt = await psbtModule.signBuyOrderWithXverse({
                    psbt,
                    address: paymentAddress,
                });
            }
            else {
                const finalPopulatedPsbt = await psbtModule.signPsbtMessage(psbt.toBase64(), ordinalAddress, true, true);
                // @ts-ignore
                signedPsbt = finalPopulatedPsbt.toBase64();
            }
            return signedPsbt;
        },
        signPsbtListingForBid: async ({ psbt, paymentAddress }) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider === 'unisat.io') {
                const finalPopulatedPsbt = await window.unisat.signPsbt(psbt.toHex(), { autoFinalize: false });
                const buffer = Buffer.from(finalPopulatedPsbt, 'hex');
                return buffer.toString('base64');
            }
            else if (provider === 'xverse') {
                const finalPsbt = await psbtModule.signBidWithXverse({
                    psbt,
                    paymentAddress
                });
                return finalPsbt;
            }
            else {
                const finalPsbt = await psbtModule.signPaymentInput({ psbt });
                return finalPsbt;
            }
        },
        signBidWithXverse: async ({ psbt, paymentAddress }) => {
            const inputsToSign = [];
            console.log('signBuyOrderWithXverse', psbt.toBase64());
            const currentPsbt = bitcoin.Psbt.fromBase64(psbt.toBase64(), {
                network: NETWORK,
            });
            for (const [i, input] of currentPsbt.data.inputs.entries()) {
                if (input.sighashType === bitcoin.Transaction.SIGHASH_ALL && input.redeemScript) {
                    inputsToSign.push({
                        address: paymentAddress,
                        signingIndexes: [i],
                        sigHash: bitcoin.Transaction.SIGHASH_ALL,
                    });
                }
            }
            const signPsbtOptions = {
                onFinish: () => { },
                onCancel: () => { },
                payload: {
                    network: {
                        type: NETWORK_NAME,
                    },
                    message: 'Sign Transaction',
                    psbtBase64: psbt.toBase64(),
                    broadcast: false,
                    inputsToSign,
                },
            };
            const signedPsbtBase64 = await new Promise((resolve, reject) => {
                signPsbtOptions.onFinish = ({ psbtBase64: _psbtBase64, txId: _txId }) => {
                    resolve(_psbtBase64);
                };
                signPsbtOptions.onCancel = () => {
                    reject(new Error('Request canceled.'));
                };
                try {
                    signTransaction(signPsbtOptions);
                }
                catch (error) {
                    console.error(error);
                    reject(error);
                }
            });
            const finalPsbt = bitcoin.Psbt.fromBase64(signedPsbtBase64, {
                network: NETWORK,
            });
            for (const i in inputsToSign) {
                finalPsbt.finalizeInput(inputsToSign[i].signingIndexes[0]);
            }
            return finalPsbt.toBase64();
        },
        signAcceptBid: async ({ psbt }) => {
            const virtualToSign = bitcoin.Psbt.fromBase64(psbt.toBase64(), { network: config.NETWORK });
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider === 'xverse') {
                throw new Error('Signing with xverse is not supported yet.');
            }
            if (provider === 'unisat.io') {
                const signedTx = await window.unisat.signPsbt(virtualToSign.toHex());
                return window.unisat.pushPsbt(signedTx);
            }
            for (const [index, input] of virtualToSign.data.inputs.entries()) {
                // Ignore signed inputs
                if (!input.finalScriptWitness) {
                    // @ts-ignore
                    const sigHash = virtualToSign.__CACHE.__TX.hashForWitnessV1(index, virtualToSign.data.inputs.map((i) => i.witnessUtxo?.script), virtualToSign.data.inputs.map((i) => i.witnessUtxo?.value), bitcoin.Transaction.SIGHASH_ALL);
                    // eslint-disable-next-line no-await-in-loop
                    const signature = await psbtModule.signSigHash({ sigHash });
                    virtualToSign.updateInput(index, {
                        // @ts-ignore
                        tapKeySig: serializeTaprootSignature(Buffer.from(signature, 'hex'), [
                            bitcoin.Transaction.SIGHASH_ALL,
                        ]),
                    });
                    virtualToSign.finalizeInput(index);
                }
            }
            const txId = await psbtModule.broadcastPsbt(virtualToSign);
            return txId;
        },
    };
    return psbtModule;
};
export { Psbt };
