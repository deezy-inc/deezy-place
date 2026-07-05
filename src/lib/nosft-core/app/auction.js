/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { Nostr } from './nostr';
import { auctionService as _auctionService } from '../services/auction';
const Auction = function (config) {
    const nostrModule = Nostr(config);
    const auctionService = _auctionService(config);
    const auctionModule = {
        getAuctions: async () => {
            return auctionService.list();
        },
        subscribeOrders: async ({ callback, limit = 5 }) => {
            const inscriptions = await auctionService.list();
            const cb = async (error, order) => {
                if (error) {
                    callback(error);
                }
                const auction = inscriptions.find((i) => i.inscriptionId === order.inscriptionId);
                callback(undefined, { ...order, auction });
            };
            // Display only running inscriptions
            const metadata = inscriptions
                .filter((i) => i.status === 'RUNNING')
                .reduce((acc, i) => {
                const events = i.metadata.filter((m) => m.nostrEventId).map((m) => m.nostrEventId || '');
                return acc.concat(...events);
            }, []);
            // Get specific auction events!
            return nostrModule.subscribeOrders({
                callback: cb,
                limit,
                filter: { ids: metadata },
            });
        },
        subscribeMyAuctions: async ({ callback, address, limit = 5, }) => {
            const inscriptions = await auctionService.getByAddress(address);
            const cb = async (error, order) => {
                if (error) {
                    callback(error);
                }
                const auction = inscriptions.find((i) => i.inscriptionId === order.inscriptionId);
                callback(undefined, { ...order, auction });
            };
            // Display only running inscriptions
            const metadata = inscriptions.reduce((acc, i) => {
                const events = i.metadata.filter((m) => m.nostrEventId).map((m) => m.nostrEventId || '');
                return acc.concat(...events);
            }, []);
            // Get specific auction events!
            return nostrModule.subscribeOrders({
                callback: cb,
                limit,
                filter: { ids: metadata },
            });
        },
        getAuctionByInscription: async (inscriptionId) => {
            const auctions = await auctionService.getInscription(inscriptionId);
            return auctions;
        },
        getAuctionByCollection: async (collection) => {
            const auctions = await auctionService.getByCollection(collection);
            return auctions;
        },
        listAuctionInscriptions: async () => {
            try {
                const auctions = await auctionService.list();
                return auctions;
            }
            catch (e) {
                console.error(e);
            }
            return [];
        },
        createAuction: async (auction) => {
            return auctionService.create(auction);
        },
        cancelAuction: async (auctionId) => {
            return auctionService.cancelAuction(auctionId);
        },
    };
    return auctionModule;
};
export { Auction };
