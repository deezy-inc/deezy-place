import { useState, useEffect, useMemo } from "react";
import { useToggle } from "react-use";
import { getAddressInfo } from "@services/nosft";
import useConnectWallet from "./use-connect-wallet";

function useWalletState() {
    const { nostrPublicKey, onConnectHandler, onDisconnectHandler: onDisconnect } = useConnectWallet();
    const [nostrAddress, setNostrAddress] = useState();
    const [ethProvider, setEthProvider] = useState();
    const [showConnectModal, toggleWalletModal] = useToggle(false);

    const onHideConnectModal = () => {
        toggleWalletModal(false);
    };

    const onShowConnectModal = () => {
        toggleWalletModal(true);
    };

    const onDisconnectHandler = () => {
        onDisconnect();
        onHideConnectModal();
    };

    useEffect(() => {
        if (!nostrPublicKey) {
            setNostrAddress(undefined);
            return;
        }

        console.log(getAddressInfo(nostrPublicKey));
        const { address } = getAddressInfo(nostrPublicKey);
        setNostrAddress(address);
    }, [nostrPublicKey]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!window.ethereum) return;
        const provider = window.ethereum;
        setEthProvider(provider);
    }, []);

    const walletState = useMemo(
        () => ({
            nostrPublicKey,
            nostrAddress,
            ethProvider,
            showConnectModal,
            onConnectHandler,
            onDisconnectHandler,
            onHideConnectModal,
            onShowConnectModal,
        }),
        [nostrPublicKey, nostrAddress, ethProvider, showConnectModal, onConnectHandler, onDisconnectHandler]
    );

    return walletState;
}

export default useWalletState;
