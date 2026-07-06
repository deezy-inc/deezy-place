import axios from 'axios';
import LocalStorage, { LocalStorageKeys } from '../services/local-storage';
const Collection = function (config) {
    const collectionModule = {
        getCollection: async (slug, fetchInscriptions) => {
            try {
                // const key = `${LocalStorageKeys.COLLECTION_META}:${slug}`;
                // const cache = await LocalStorage.get(key);
                // if (cache) {
                //     return cache;
                // }
                const queryParams = fetchInscriptions ? '?getAll=true' : '';
                const url = `${config.TURBO_API}/collection/${slug}${queryParams}`;
                const result = await axios.get(url);
                // await LocalStorage.set(key, result.data);
                return result.data;
            }
            catch (error) {
                console.error(error);
            }
            return undefined;
        },
        getInscriptions: async (slug) => {
            try {
                const key = `${LocalStorageKeys.COLLECTION_INSCRIPTIONS}:${slug}`;
                const cache = await LocalStorage.get(key);
                if (cache) {
                    return cache;
                }
                const result = await axios.get(`${config.TURBO_API}/collection/${slug}/inscriptions`);
                await LocalStorage.set(key, result.data);
                return result.data;
            }
            catch (error) {
                console.error(error);
            }
            return undefined;
        },
    };
    return collectionModule;
};
export { Collection };
