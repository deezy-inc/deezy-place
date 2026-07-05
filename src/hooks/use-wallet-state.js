import { useState, useEffect, useMemo } from "react";
import { getAddressInfo } from "@services/nosft";
import useConnectWallet from "./use-connect-wallet";

export const useWalletState = () => {
  const {
    ordinalsPublicKey,
    paymentPublicKey,
    onConnectHandler: onConnect,
    onDisconnectHandler: onDisconnect,
    walletName,
    ordinalsAddress,
    paymentAddress,
  } = useConnectWallet();
  const [nostrOrdinalsAddress, setNostrOrdinalsAddress] = useState("");
  const [nostrPaymentAddress, setNostrPaymentAddress] = useState("");
  const [ethProvider, setEthProvider] = useState();
  const [showConnectModal, setShowConnectModal] = useState(false);
  // Set by WalletArea when utxos are selected but its inline Send button is
  // scrolled out of view; the header renders it as { label, onSend }
  const [headerSendAction, setHeaderSendAction] = useState(null);

  const onHideConnectModal = () => {
    setShowConnectModal(false);
  };

  const onShowConnectModal = () => {
    setShowConnectModal(true);
  };

  const onConnectHandler = (domain, callback) => {
    onConnect(domain, callback);
    onHideConnectModal();
  };

  const onDisconnectHandler = () => {
    onDisconnect();
    onHideConnectModal();
  };

  useEffect(() => {
    const syncAddress = async () => {
      if (!ordinalsPublicKey) {
        setNostrOrdinalsAddress("");
        setNostrPaymentAddress("");
        return;
      }

      if (ordinalsAddress && paymentAddress) {
        setNostrOrdinalsAddress(ordinalsAddress);
        setNostrPaymentAddress(paymentAddress);
        return;
      }
      const { address: nostrOrdinalsAddress } = await getAddressInfo(
        ordinalsPublicKey,
      );
      setNostrOrdinalsAddress(nostrOrdinalsAddress);
      setNostrPaymentAddress(nostrOrdinalsAddress);
    };
    syncAddress().catch(console.error);
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
      paymentPublicKey,
      nostrOrdinalsAddress,
      nostrPaymentAddress,
      ethProvider,
      showConnectModal,
      onConnectHandler,
      onDisconnectHandler,
      onHideConnectModal,
      onShowConnectModal,
      headerSendAction,
      setHeaderSendAction,
    }),
    [
      walletName,
      ordinalsPublicKey,
      paymentPublicKey,
      nostrOrdinalsAddress,
      nostrPaymentAddress,
      ethProvider,
      showConnectModal,
      onConnectHandler,
      onDisconnectHandler,
      headerSendAction,
    ],
  );

  return walletState;
};

export default useWalletState;
