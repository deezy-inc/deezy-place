const LocalStorageKeys = {
    INSCRIPTIONS_OUTPOINT: 'INSCRIPTION_OUTPOINT',
    COLLECTION_META: 'COLLECTION_META',
    COLLECTION_INSCRIPTIONS: 'COLLECTION_INSCRIPTIONS',
    INSCRIPTIONS: 'INSCRIPTIONS',
};
const LocalStorage = {
    set: (id, data) => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        window.localStorage.setItem(id, JSON.stringify(data));
        return undefined;
    },
    get: (id) => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        const value = window.localStorage.getItem(id);
        if (!value || value === 'undefined') {
            return undefined;
        }
        return JSON.parse(value);
    },
    remove: (id) => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        return window.localStorage.removeItem(id);
    },
    clear: () => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        return window.localStorage.clear();
    },
    removePattern: (pattern) => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(pattern)) {
                localStorage.removeItem(key);
            }
        }
        return undefined;
    },
};
export default LocalStorage;
export { LocalStorageKeys };
