const LocalStorageKeys = {
    INSCRIPTIONS_OUTPOINT: "INSCRIPTION_OUTPOINT",
    COLLECTION_INFO: "COLLECTION_INFO",
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

        return window.localStorage.clear();
    },
};

export default LocalStorage;
export { LocalStorageKeys };
