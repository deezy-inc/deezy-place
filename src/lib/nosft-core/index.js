import { Address } from './app/address';
import { Wallet } from './app/wallet';
import { Crypto } from './app/crypto';
import { Inscriptions } from './app/inscriptions';
import { Utxo } from './app/utxo';
import { Config } from './config/config';
import { Psbt } from './app/psbt';
import { OpenOrdex } from './app/openOrdex';
import { Nostr } from './app/nostr';
import { Auction } from './app/auction';
import { Collection } from './app/collections';
const Nosft = (configOverrides = {}) => {
    const config = new Config(configOverrides);
    const wallet = Wallet(config);
    const address = Address(config);
    const crypto = Crypto(config);
    const inscriptions = Inscriptions(config);
    const utxo = Utxo(config);
    const psbt = Psbt(config);
    const openOrdex = OpenOrdex(config);
    const nostr = Nostr(config);
    const auction = Auction(config);
    const collection = Collection(config);
    return {
        wallet,
        address,
        crypto,
        inscriptions,
        utxo,
        psbt,
        openOrdex,
        nostr,
        auction,
        config,
        collection,
    };
};
export { Nosft };
