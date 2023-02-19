const SessionsStorageKeys = {
    NOSTR_PUBLIC_KEY: "NOSTR_PUBLIC_KEY",
};

class SessionStorage {
    set(id, data) {
        if (typeof window === "undefined") {
            return;
        }

        window.sessionStorage.setItem(id, JSON.stringify(data));
    }

    get(id) {
        if (typeof window === "undefined") {
            return;
        }

        const value = window.sessionStorage.getItem(id);

        if (!value || value === "undefined") {
            return;
        }

        return JSON.parse(value);
    }

    remove(id) {
        if (typeof window === "undefined") {
            return;
        }

        return window.sessionStorage.removeItem(id);
    }
}

export default new SessionStorage();
export { SessionsStorageKeys };
