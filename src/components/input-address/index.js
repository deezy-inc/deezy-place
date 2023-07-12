import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import { useAddress } from "src/hooks/use-address";
import { useEffect } from "react";

export const InputAddress = ({
  placeholder = "",
  label = "",
  defaultAddress,
  setAddress,
  setIsAddressValid,
}) => {
  const {
    isAddressValid,
    address,
    onChange,
    onBlur,
    onFocus,
    onDoubleClick,
    isInputEditable,
    maskedAddress,
  } = useAddress({
    defaultAddress,
  });

  const onChangeAddress = (event) => {
    onChange(event.target.value);
  };

  useEffect(() => {
    setAddress(address);
  }, [address]);

  useEffect(() => {
    setIsAddressValid(isAddressValid);
    if (!isAddressValid) {
    }
  }, [isAddressValid]);

  return isInputEditable ? (
    <InputGroup>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control
        value={address}
        onChange={onChangeAddress}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-describedby={placeholder}
        isInvalid={!isAddressValid}
        autoFocus
      />
    </InputGroup>
  ) : (
    <span onDoubleClick={onDoubleClick}>{maskedAddress || "---"}</span>
  );
};
