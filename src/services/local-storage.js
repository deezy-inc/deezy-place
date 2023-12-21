const LocalStorageKeys = {
    INSCRIPTIONS_OUTPOINT: "INSCRIPTION_OUTPOINT",
    COLLECTION_INFO: "COLLECTION_INFO",
    ONEKEY_WALLET: "onekey_wallet_info_local_key",
};

const LocalStorage = {
    set: (id, data) => {
        if (typeof window === "undefined") {
            return undefined;
        }

        window.localStorage.setItem(id, JSON.stringify(data));
        return undefined;
    },
    get: (id) => {
        if (typeof window === "undefined") {
            return undefined;
        }

        const value = window.localStorage.getItem(id);

        if (!value || value === "undefined") {
            return undefined;
        }

        return JSON.parse(value);
    },
    remove: (id) => {
        if (typeof window === "undefined") {
            return undefined;
        }

        return window.localStorage.removeItem(id);
    },
    clear: () => {
        if (typeof window === "undefined") {
            return undefined;
        }

        return Object.keys(window.localStorage).forEach(key => {
            if (key !== "onekey_wallet_info_local_key") {
              window.localStorage.removeItem(key);
            }
        });
    },
};

export default LocalStorage;
export { LocalStorageKeys };
