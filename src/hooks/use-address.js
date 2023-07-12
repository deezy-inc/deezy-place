import { useState } from "react";
import { TESTNET, shortenStr } from "@services/nosft";
import { validate, Network } from "bitcoin-address-validation";

export const useAddress = ({ defaultAddress }) => {
  const [isAddressValid, setAddressValid] = useState(true);
  const [address, setAddress] = useState(defaultAddress);
  const [maskedAddress, setMaskedAddress] = useState(
    shortenStr(defaultAddress)
  );
  const [isInputEditable, setInputEditable] = useState(false);
  const [error, setError] = useState("");

  const onChange = async (newaddr) => {
    if (!validate(newaddr, TESTNET ? Network.testnet : Network.mainnet)) {
      setAddressValid(false);
      setError("No dummy UTXOs found for your address.");
    } else {
      setError("");
      setAddressValid(true);
    }
    setAddress(newaddr);
    setMaskedAddress(newaddr);
  };

  const onBlur = () => {
    setMaskedAddress(shortenStr(address));
    setInputEditable(false);
  };

  const onFocus = () => {
    setMaskedAddress(address);
  };

  const onDoubleClick = () => {
    setInputEditable(true);
  };

  return {
    isAddressValid,
    address,
    maskedAddress,
    onChange,
    onBlur,
    onFocus,
    onDoubleClick,
    isInputEditable,
    error,
  };
};
