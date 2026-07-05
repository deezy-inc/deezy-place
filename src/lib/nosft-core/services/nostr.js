import { SimplePool, getEventHash } from 'nostr-tools';
import SessionStorage, { SessionsStorageKeys } from './session-storage';
import { Psbt } from '../app/psbt';
import { isMetamaskProvider } from '../app/wallet';
function cleanEvent(event) {
    return {
        id: event.id,
        pubkey: event.pubkey,
        created_at: event.created_at,
        kind: event.kind,
        tags: event.tags,
        content: event.content,
        sig: event.sig,
    };
}
class NostrRelay {
    config;
    psbt;
    pool = new SimplePool();
    subs = [];
    relays = [];
    events = [];
    constructor(config) {
        this.config = config;
        if (!config) {
            throw new Error('Config is required in order to initialize Nostr.');
        }
        this.psbt = Psbt(config);
        this.relays = [...config.RELAYS];
    }
    subscribe(filter, onEvent, onEose) {
        const sub = this.pool.sub([...this.relays], filter);
        sub.on('event', onEvent);
        sub.on('eose', onEose);
        this.subs.push(sub);
        return sub;
    }
    unsubscribeAll() {
        this.subs.forEach((sub) => {
            sub.unsub();
        });
    }
    publish(_event, onSuccess, onError) {
        const event = cleanEvent(_event);
        const pubs = this.pool.publish(this.relays, event);
        const pubList = !Array.isArray(pubs) ? [pubs] : pubs;
        let notified = false;
        let totalPubsFailed = 0;
        // loop over all pubs and wait for all to be done
        pubList.forEach((pub) => {
            //@ts-ignore
            pub.on('ok', () => {
                // Callback success only once
                if (onSuccess && !notified) {
                    notified = true;
                    onSuccess();
                }
            });
            //@ts-ignore
            pub.on('failed', (reason) => {
                console.error(`failed to publish ${reason}`);
                // Callback error only if all pubs failed
                totalPubsFailed += 1;
                if (totalPubsFailed === pubList.length - 1) {
                    if (onError)
                        onError(reason);
                }
            });
        });
    }
    async list(filter) {
        const events = await this.pool.list([...this.relays], filter);
        return events;
    }
    // eslint-disable-next-line class-methods-use-this
    async sign(event) {
        const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
        const eventBase = { ...event, created_at: Math.floor(Date.now() / 1000) };
        const newEvent = {
            ...eventBase,
            id: getEventHash(eventBase),
        };
        if (provider && isMetamaskProvider(provider)) {
            const metamaskSigner = await this.psbt.getMetamaskSigner(provider);
            const signature = await metamaskSigner.signSchnorr(Buffer.from(newEvent.id, 'hex'));
            return {
                ...newEvent,
                sig: signature.toString('hex'),
            };
        }
        if (provider === 'unisat.io' || provider === 'xverse') {
            throw new Error('Unisat does not support shnorr signatures yet.');
        }
        // @ts-ignore
        return window.nostr.signEvent(newEvent);
    }
}
const nostrPool = (config) => new NostrRelay(config);
export { nostrPool };
