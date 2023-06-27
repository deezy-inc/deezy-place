import { useState, useEffect } from "react";
import { connectWallet, onAccountChange } from "@services/nosft";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import LocalStorage from "@services/local-storage";

function useConnectWallet() {
  const [ordinalsPublicKey, setOrdinalsPublicKey] = useState("");
  const [ordinalsAddress, setOrdinalsAddress] = useState("");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [walletName, setWalletName] = useState("");

  const onConnectHandler = async (domain) => {
    const {
      ordinalsPublicKey: xOrdinalsPublicKey,
      walletName: xWalletName,
      ordinalsAddress: xOrdinalsAddress,
      paymentAddress: xPaymentAddress,
    } = await connectWallet(domain);
    SessionStorage.set(SessionsStorageKeys.WALLET_NAME, xWalletName);
    SessionStorage.set(SessionsStorageKeys.DOMAIN, domain);
    SessionStorage.set(SessionsStorageKeys.ORDINALS_ADDRESS, xOrdinalsAddress);
    SessionStorage.set(SessionsStorageKeys.PAYMENT_ADDRESS, xPaymentAddress);
    SessionStorage.set(
      SessionsStorageKeys.ORDINALS_PUBLIC_KEY,
      xOrdinalsPublicKey
    );
    setOrdinalsAddress(xOrdinalsAddress);
    setPaymentAddress(xPaymentAddress);
    setWalletName(xWalletName);
    setOrdinalsPublicKey(xOrdinalsPublicKey);
  };

  const onDisconnectHandler = async () => {
    SessionStorage.clear();
    LocalStorage.clear();
    setOrdinalsPublicKey("");
    setWalletName("");
    setPaymentAddress("");
  };

  onAccountChange(() => {
    onDisconnectHandler();
    // Reconnect with new address
    onConnectHandler(SessionStorage.get(SessionsStorageKeys.DOMAIN));
  });

  useEffect(() => {
    // TODO: We should ask the browser if we are connected to the wallet
    const xOrdinalsPublicKey = SessionStorage.get(
      SessionsStorageKeys.ORDINALS_PUBLIC_KEY
    );
    const xWalletName = SessionStorage.get(SessionsStorageKeys.WALLET_NAME);
    const ordinalsAddress = SessionStorage.get(
      SessionsStorageKeys.ORDINALS_ADDRESS
    );
    const paymentAddress = SessionStorage.get(
      SessionsStorageKeys.PAYMENT_ADDRESS
    );
    if (xOrdinalsPublicKey) {
      setOrdinalsPublicKey(xOrdinalsPublicKey);
    }
    if (xWalletName) {
      setWalletName(xWalletName);
    }
    if (ordinalsAddress) {
      setOrdinalsAddress(ordinalsAddress);
    }
    if (paymentAddress) {
      setPaymentAddress(paymentAddress);
    }
  }, []);

  return {
    ordinalsAddress,
    paymentAddress,
    ordinalsPublicKey,
    onConnectHandler,
    onDisconnectHandler,
    walletName,
  };
}

export default useConnectWallet;
