/* eslint-disable react/forbid-prop-types */
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
  getAvailableUtxosWithoutInscription,
  generatePSBTListingInscriptionForBuy,
  signPsbtMessage,
  broadcastTx,
  TESTNET,
  NETWORK,
  shortenStr,
  satsToFormattedDollarString,
} from "@services/nosft";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { TailSpin } from "react-loading-icons";
import { toast } from "react-toastify";
import { InscriptionPreview } from "@components/inscription-preview";
import { NostrEvenType } from "@utils/types";
import TransactionSent from "@components/transaction-sent-confirmation";
import { useDelayUnmount } from "@hooks";
import clsx from "clsx";
import { useWallet } from "@context/wallet-context";
import useBitcoinPrice from "src/hooks/use-bitcoin-price";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";

bitcoin.initEccLib(ecc);

const BuyModal = ({ show, handleModal, utxo, onSale, nostr }) => {
  const { nostrOrdinalsAddress, nostrPaymentsAddress, paymentPublicKey } =
    useWallet();
  const [isDestinationAddressValid, setIsDestinationAddressValid] =
    useState(true);
  const [destinationBtcAddress, setDestinationBtcAddress] =
    useState(nostrOrdinalsAddress);
  const [isOnBuy, setIsOnBuy] = useState(false);
  const [selectedUtxos, setSelectedUtxos] = useState([]);
  const [dummyUtxos, setDummyUtxos] = useState([]);
  const [buyTxId, setBuyTxId] = useState(null);

  const [isMounted, setIsMounted] = useState(true);
  const showDiv = useDelayUnmount(isMounted, 500);
  const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });

  const updatePayerAddress = async () => {
    try {
      const { selectedUtxos: _selectedUtxos, dummyUtxos: _dummyUtxos } =
        await getAvailableUtxosWithoutInscription({
          address: nostrPaymentsAddress,
          price: utxo.value,
        });

      if (_dummyUtxos.length < 2) {
        throw new Error(
          "No dummy UTXOs found. Please create them before continuing."
        );
      }

      setSelectedUtxos(_selectedUtxos);
      setDummyUtxos(_dummyUtxos);
    } catch (e) {
      setSelectedUtxos([]);
      throw e;
    }
  };

  const onChangeAddress = async (evt) => {
    const newaddr = evt.target.value;
    if (newaddr === "") {
      setIsDestinationAddressValid(true);
      return;
    }
    if (!validate(newaddr, TESTNET ? Network.testnet : Network.mainnet)) {
      setIsDestinationAddressValid(false);
      return;
    }
    setDestinationBtcAddress(newaddr);
  };

  useEffect(() => {
    const validatePayerAddress = async () => {
      setIsOnBuy(true);
      try {
        await updatePayerAddress();
      } catch (e) {
        if (e.message.includes("Not enough cardinal spendable funds")) {
          toast.error(e.message);
          return;
        }

        setIsDestinationAddressValid(false);
        toast.error(e.message);
        return;
      }

      setIsOnBuy(false);
    };

    validatePayerAddress();
  }, [nostrPaymentsAddress]);

  const buy = async () => {
    setIsOnBuy(true);

    try {
      await updatePayerAddress();
    } catch (e) {
      setIsDestinationAddressValid(false);
      toast.error(e.message);
      return;
    }

    try {
      const sellerSignedPsbt = bitcoin.Psbt.fromBase64(nostr.content, {
        network: NETWORK,
      });

      debugger;

      console.log("sellerSignedPsbt", nostr.content);
      console.log("destinationBtcAddress", destinationBtcAddress);

      debugger;

      const psbt = await generatePSBTListingInscriptionForBuy({
        payerAddress: nostrPaymentsAddress,
        payerPubkey: paymentPublicKey,
        receiverAddress: destinationBtcAddress,
        price: nostr.value,
        paymentUtxos: selectedUtxos,
        dummyUtxos,
        sellerSignedPsbt,
        inscription: utxo,
      });

      debugger;

      const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
      let txId;
      if (provider === "unisat.io") {
        const signedPsbt = await window.unisat.signPsbt(psbt.toHex());
        txId = await window.unisat.pushPsbt(signedPsbt);
      } else {
        debugger;
        console.log("[PSBT]", psbt.toHex());
        const tx = await signPsbtMessage(
          psbt.toBase64(),
          nostrOrdinalsAddress,
          nostrPaymentsAddress
        );
        txId = await broadcastTx(tx);
      }

      setBuyTxId(txId);
      toast.info(`Order successfully signed! ${txId}`);
      navigator.clipboard.writeText(txId);

      // Display confirmation component
      setIsMounted(!isMounted);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      debugger;
      setIsOnBuy(false);
    }
  };

  const closeModal = () => {
    onSale();
    handleModal();
  };

  const submit = async () => {
    if (!destinationBtcAddress) return;
    if (!isDestinationAddressValid) return;

    await buy();
  };

  const renderBody = () => {
    if (!showDiv) {
      return (
        <div className="show-animated">
          <TransactionSent
            txId={buyTxId}
            onClose={closeModal}
            title="Transaction Sent"
          />
        </div>
      );
    }

    return (
      <div className={clsx(!isMounted && "hide-animated")}>
        <p>You are about to buy this Ordinal</p>
        <div className="inscription-preview">
          <InscriptionPreview utxo={utxo} />
        </div>

        <div className="placebid-form-box">
          <div className="bid-content">
            <div className="bid-content-top">
              <div className="bid-content-left">
                <InputGroup className="mb-lg-5 notDummy">
                  <Form.Label>Address to receive ordinal</Form.Label>
                  <Form.Control
                    defaultValue={nostrOrdinalsAddress}
                    onChange={onChangeAddress}
                    placeholder="Buyer address"
                    aria-label="Buyer address"
                    aria-describedby="basic-addon2"
                    isInvalid={!isDestinationAddressValid}
                    autoFocus
                  />

                  <Form.Control.Feedback type="invalid">
                    <br />
                    No dummy UTXOs found for your address
                  </Form.Control.Feedback>
                </InputGroup>
              </div>
            </div>

            <div className="bid-content-mid">
              <div className="bid-content-left">
                {Boolean(destinationBtcAddress) && (
                  <span>Destination Address</span>
                )}
                {Boolean(nostr?.value) && <span>Price</span>}
              </div>
              <div className="bid-content-right">
                {Boolean(destinationBtcAddress) && (
                  <span>{shortenStr(destinationBtcAddress)}</span>
                )}
                {Boolean(nostr?.value) && bitcoinPrice && (
                  <span>{`$${satsToFormattedDollarString(
                    nostr.value,
                    bitcoinPrice
                  )}`}</span>
                )}
              </div>
            </div>
          </div>

          <div className="bit-continue-button notDummy">
            <Button
              size="medium"
              fullwidth
              disabled={!destinationBtcAddress}
              autoFocus
              className={isOnBuy ? "btn-loading" : ""}
              onClick={submit}
            >
              {isOnBuy ? <TailSpin stroke="#fec823" speed={0.75} /> : "Buy"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      className="rn-popup-modal placebid-modal-wrapper"
      show={show}
      onHide={handleModal}
      centered
    >
      {show && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={handleModal}
        >
          <i className="feather-x" />
        </button>
      )}
      {showDiv && (
        <Modal.Header>
          <h3 className={clsx("modal-title", !isMounted && "hide-animated")}>
            Buy {shortenStr(utxo && `${utxo.inscriptionId}`)}
          </h3>
        </Modal.Header>
      )}
      <Modal.Body>{renderBody()}</Modal.Body>
    </Modal>
  );
};

BuyModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  utxo: PropTypes.object,
  onSale: PropTypes.func,
  nostr: NostrEvenType,
};
export default BuyModal;
