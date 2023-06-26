import { useState, useEffect, useMemo } from "react";
import { useToggle } from "react-use";
import { getAddressInfo } from "@services/nosft";
import useConnectWallet from "./use-connect-wallet";

export const useWalletState = () => {
    const {
        ordinalsPublicKey,
        onConnectHandler: onConnect,
        onDisconnectHandler: onDisconnect,
        walletName,
        ordinalsAddress,
        paymentAddress,
    } = useConnectWallet();
    const [nostrOrdinalsAddress, setNostrOrdinalsAddress] = useState("");
    const [nostrPaymentsAddress, setNostrPaymentAddress] = useState("");
    const [ethProvider, setEthProvider] = useState();
    const [showConnectModal, setShowConnectModal] = useState(false);

    const onHideConnectModal = () => {
        setShowConnectModal(false);
    };

    const onShowConnectModal = () => {
        setShowConnectModal(true);
    };

    const onConnectHandler = (domain) => {
        onConnect(domain);
        onHideConnectModal();
    };

    const onDisconnectHandler = () => {
        onDisconnect();
        onHideConnectModal();
    };

    useEffect(() => {
        if (!ordinalsPublicKey) {
            setNostrOrdinalsAddress("");
            return;
        }

        if (ordinalsAddress && paymentAddress) {
            setNostrOrdinalsAddress(ordinalsAddress);
            setNostrPaymentAddress(paymentAddress);
            return;
        }
        const { address: nostrOrdinalsAddress } =
            getAddressInfo(ordinalsPublicKey);
        setNostrOrdinalsAddress(nostrOrdinalsAddress);
        setNostrPaymentAddress(nostrOrdinalsAddress);
    }, [ordinalsPublicKey, ordinalsAddress]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!window.ethereum) return;
        const provider = window.ethereum;
        setEthProvider(provider);
    }, []);

    const walletState = useMemo(
        () => ({
            walletName,
            ordinalsPublicKey,
            nostrOrdinalsAddress,
            nostrPaymentsAddress,
            ethProvider,
            showConnectModal,
            onConnectHandler,
            onDisconnectHandler,
            onHideConnectModal,
            onShowConnectModal,
        }),
        [
            walletName,
            ordinalsPublicKey,
            nostrOrdinalsAddress,
            nostrPaymentsAddress,
            ethProvider,
            showConnectModal,
            onConnectHandler,
            onDisconnectHandler,
        ]
    );

    return walletState;
};

export default useWalletState;
