import { useState, useEffect } from "react";
import { connectWallet } from "@utils/wallet";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import LocalStorage from "@services/local-storage";

function useConnectWallet() {
  const [ordinalsPublicKey, setOrdinalsPublicKey] = useState("");
  const [ordinalsAddress, setOrdinalsAddress] = useState("");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [walletName, setWalletName] = useState("");

  const onConnectHandler = async ({ metamask, xverse }) => {
    const {
      pubKey,
      wallet,
      ordinalsAddress: walletOrdinalsAddress,
      paymentAddress: walletPaymentAddress,
    } = await connectWallet({ metamask, xverse });
    SessionStorage.set(SessionsStorageKeys.WALLET_NAME, wallet);
    SessionStorage.set(SessionsStorageKeys.DOMAIN, metamask);
    SessionStorage.set(
      SessionsStorageKeys.ORDINALS_ADDRESS,
      walletOrdinalsAddress
    );
    SessionStorage.set(
      SessionsStorageKeys.PAYMENT_ADDRESS,
      walletPaymentAddress
    );
    SessionStorage.set(SessionsStorageKeys.ORDINALS_PUBLIC_KEY, pubKey);
    setOrdinalsPublicKey(pubKey);
    setOrdinalsAddress(walletOrdinalsAddress);
    setPaymentAddress(walletPaymentAddress);
    setWalletName(wallet);
  };

  const onDisconnectHandler = async () => {
    SessionStorage.clear();
    LocalStorage.clear();
    setOrdinalsPublicKey("");
    setWalletName("");
    setPaymentAddress("");
  };

  useEffect(() => {
    // TODO: We should ask the browser if we are connected to the wallet
    const pubKey = SessionStorage.get(SessionsStorageKeys.ORDINALS_PUBLIC_KEY);
    const walletName = SessionStorage.get(SessionsStorageKeys.WALLET_NAME);
    const ordinalsAddress = SessionStorage.get(
      SessionsStorageKeys.ORDINALS_ADDRESS
    );
    const paymentAddress = SessionStorage.get(
      SessionsStorageKeys.PAYMENT_ADDRESS
    );
    if (pubKey) {
      setOrdinalsPublicKey(pubKey);
    }
    if (walletName) {
      setWalletName(walletName);
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
