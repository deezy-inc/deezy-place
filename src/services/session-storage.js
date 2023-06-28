const SessionsStorageKeys = {
    ORDINALS_PUBLIC_KEY: "ORDINALS_PUBLIC_KEY",
    ORDINALS_ADDRESS: "ORDINALS_ADDRESS",
    INSCRIPTIONS_ON_SALE: "INSCRIPTIONS_ON_SALE",
    INSCRIPTIONS_OWNED: "INSCRIPTIONS_OWNED",
    DOMAIN: "DOMAIN",
    WALLET_NAME: "WALLET_NAME",
    PAYMENT_ADDRESS: "PAYMENT_ADDRESS",
};

const SessionStorage = {
    set: (id, data) => {
        if (typeof window === "undefined") {
            return undefined;
        }

        window.sessionStorage.setItem(id, JSON.stringify(data));
        return undefined;
    },
    get: (id) => {
        if (typeof window === "undefined") {
            return undefined;
        }

        const value = window.sessionStorage.getItem(id);

        if (!value || value === "undefined") {
            return undefined;
        }

        return JSON.parse(value);
    },
    remove: (id) => {
        if (typeof window === "undefined") {
            return undefined;
        }

        return window.sessionStorage.removeItem(id);
    },
    clear: () => {
        if (typeof window === "undefined") {
            return undefined;
        }

        return window.sessionStorage.clear();
    },
};

export default SessionStorage;
export { SessionsStorageKeys };
