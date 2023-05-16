import { useState, useEffect } from "react";
import { connectWallet } from "@services/nosft";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import LocalStorage from "@services/local-storage";

function useConnectWallet() {
    const [nostrPublicKey, setNostrPublicKey] = useState();

    const onConnectHandler = async (metamask) => {
        const pubKey = await connectWallet(metamask);
        SessionStorage.set(SessionsStorageKeys.DOMAIN, metamask);
        SessionStorage.set(SessionsStorageKeys.NOSTR_PUBLIC_KEY, pubKey);
        setNostrPublicKey(pubKey);
    };

    const onDisconnectHandler = async () => {
        SessionStorage.clear();
        LocalStorage.clear();
        setNostrPublicKey(undefined);
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
