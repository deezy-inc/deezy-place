import axios from 'axios';
const Collection = function (config) {
    const collectionModule = {
        getCollection: async (slug, fetchInscriptions) => {
            try {
                const queryParams = fetchInscriptions ? '?getAll=true' : '';
                const url = `${config.TURBO_API}/collection/${slug}${queryParams}`;
                const result = await axios.get(url);
                return result.data;
            }
            catch (error) {
                console.error(error);
            }
            return undefined;
        },
        getInscriptions: async (slug) => {
            try {
                const result = await axios.get(`${config.TURBO_API}/collection/${slug}/inscriptions`);
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
