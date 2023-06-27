import { useState, useEffect } from "react";
import { connectWallet, onAccountChange } from "@services/nosft";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import LocalStorage from "@services/local-storage";

function useConnectWallet() {
    const [nostrPublicKey, setNostrPublicKey] = useState();

    const onDisconnectHandler = async () => {
        SessionStorage.clear();
        LocalStorage.clear();
        setNostrPublicKey(undefined);
    };

    const onConnectHandler = async (provider) => {
        const pubKey = await connectWallet(provider);
        SessionStorage.set(SessionsStorageKeys.DOMAIN, provider);
        SessionStorage.set(SessionsStorageKeys.NOSTR_PUBLIC_KEY, pubKey);
        setNostrPublicKey(pubKey);

        onAccountChange(() => {
            onDisconnectHandler();
            // Reconnect with new address
            onConnectHandler(SessionStorage.get(SessionsStorageKeys.DOMAIN));
        });
    };

    useEffect(() => {
        if (nostrPublicKey) {
            SessionStorage.set(SessionsStorageKeys.NOSTR_PUBLIC_KEY, nostrPublicKey);
        }
    }, [nostrPublicKey]);

    useEffect(() => {
        // TODO: We should ask the browser if we are connected to the wallet
        const pubKey = SessionStorage.get(SessionsStorageKeys.NOSTR_PUBLIC_KEY);

        if (pubKey) {
            setNostrPublicKey(pubKey);
        }
    }, []);

    return { nostrPublicKey, onConnectHandler, onDisconnectHandler };
}

export default useConnectWallet;
