import ApiService from '../utils/httpService';
class Auction extends ApiService {
    config;
    constructor(config) {
        if (!config) {
            throw new Error('Config is required in order to initialize Auction.');
        }
        super(config.AUCTION_URL);
        this.config = config;
    }
    async list() {
        return this.get(`/auctions`);
    }
    async getInscription(inscriptionId) {
        return this.get(`/auctions/inscription/${inscriptionId}`);
    }
    async cancelAuction(auctionId) {
        return this.delete(`/auction/${auctionId}`);
    }
    async create(auction) {
        return this.post(`/auction`, auction);
    }
    async getByAddress(address) {
        return this.get(`/auctions/address/${address}`);
    }
    async getByCollection(collection) {
        return this.get(`/auctions/collection/${collection}`);
    }
}
const auctionService = (config) => new Auction(config);
export { auctionService };
