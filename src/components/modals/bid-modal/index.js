/* eslint-disable */
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
  generateBidPSBT,
  shortenStr,
  satsToFormattedDollarString,
  TESTNET,
  NETWORK,
  generateDeezyPSBTListingForBid,
  signPsbtListingForBid,
  getFundingUtxosForBid,
  DEFAULT_FEE_RATE,
  publishOrder,
  fetchRecommendedFee,
} from "@services/nosft";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { useWallet } from "@context/wallet-context";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { InscriptionPreview } from "@components/inscription-preview";
import useBitcoinPrice from "src/hooks/use-bitcoin-price";
import axios from "axios";

bitcoin.initEccLib(ecc);

const BidModal = ({ show, handleModal, utxo, onBid, suggestedPrice }) => {
  const {
    nostrOrdinalsAddress,
    nostrPaymentAddress,
    paymentPublicKey,
    ordinalsPublicKey,
  } = useWallet();

  const [isBtcAmountValid, setIsBtcAmountValid] = useState(true);
  const [bidPrice, setBidPrice] = useState(
    suggestedPrice > 0 ? suggestedPrice : utxo?.value,
  );
  const [bidFeeRate, setBidFeeRate] = useState(DEFAULT_FEE_RATE);
  const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });
  const [isOnBid, setIsOnBid] = useState(false);
  const feeRateOnChange = (evt) => setBidFeeRate(parseInt(evt.target.value));

  useEffect(() => {
    const fetchFee = async () => {
      const fee = await fetchRecommendedFee();
      setBidFeeRate(fee);
    };
    fetchFee();
  }, []);

  const bid = async () => {
    setIsOnBid(true);

    try {
      // add input: ordinal to be bought (NOT SIGNED YET)
      // add output: payment to seller of ordinal (address where ordinal currently lives)
      const basePsbt = await generateBidPSBT({
        utxo,
        ownerAddresss: utxo.owner,
        price: bidPrice,
      });

      const { data: populatedData } = await axios.post(
        `https://api${
          TESTNET ? "-testnet" : ""
        }.deezy.io/v1/ordinals/psbt/populate`,
        {
          psbt: basePsbt.toBase64(),
          ordinal_receive_address: nostrOrdinalsAddress,
        },
      );

      const populatedPsbt = bitcoin.Psbt.fromHex(populatedData.psbt, {
        network: NETWORK,
      });

      const { selectedUtxos } = await getFundingUtxosForBid({
        address: nostrPaymentAddress,
        bidPrice: bidPrice,
        utxoPrice: utxo.value,
        psbt: populatedPsbt,
        selectedFeeRate: bidFeeRate,
      });

      const { psbt: bidPsbt } = await generateDeezyPSBTListingForBid({
        paymentAddress: nostrPaymentAddress,
        ordinalsDestinationAddress: nostrOrdinalsAddress,
        paymentPublicKey,
        ordinalsPublicKey,
        bidPrice: bidPrice,
        utxoPrice: utxo.value,
        paymentUtxos: selectedUtxos,
        psbt: populatedPsbt,
        selectedFeeRate: bidFeeRate,
      });

      const signedPsbt = await signPsbtListingForBid({
        psbt: bidPsbt,
        ordinalsAddress: nostrOrdinalsAddress,
        paymentAddress: nostrPaymentAddress,
      });

      // Step 4, we finalize the psbt and broadcast it
      const { data: finalizeData } = await axios.post(
        `https://api${
          TESTNET ? "-testnet" : ""
        }.deezy.io/v1/ordinals/psbt/finalize`,
        {
          psbt: signedPsbt, // (hex or base64)
          id: populatedData.id,
        },
      );

      if (!finalizeData.funded_signed_psbt)
        throw new Error("Unexpected error from API.");

      await publishOrder({
        utxo,
        ordinalValue: bidPrice,
        signedPsbt: finalizeData.funded_signed_psbt,
        type: "buy",
      });

      toast.info(`Order successfully published to Nostr!`);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }

    setIsOnBid(false);
    onBid();
    handleModal();
  };

  const submit = async () => {
    if (!isBtcAmountValid) return;
    await bid();
  };

  const priceOnChange = (evt) => {
    const newValue = evt.target.value;
    if (newValue === "") {
      setIsBtcAmountValid(true);
      return;
    }

    if (!newValue) {
      setIsBtcAmountValid(false);
      return;
    }

    setBidPrice(Number(newValue));
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
      <Modal.Header>
        <h3 className="modal-title">
          Bid {shortenStr(utxo && `${utxo.inscriptionId}`)}
        </h3>
      </Modal.Header>
      <Modal.Body>
        <p>You are about to Bid on this Ordinal</p>
        <div className="inscription-preview">
          <InscriptionPreview utxo={utxo} />
        </div>

        <div className="placebid-form-box">
          <div className="bid-content">
            <div className="bid-content-top">
              <div className="bid-content-left">
                <InputGroup className="mb-lg-5">
                  <Form.Label>Price (in Sats)</Form.Label>
                  <Form.Control
                    value={bidPrice}
                    onChange={priceOnChange}
                    type="number"
                    placeholder="Price (in Sats)"
                    aria-label="Price (in Sats)"
                    aria-describedby="basic-addon2"
                    isInvalid={!isBtcAmountValid}
                    autoFocus
                  />

                  <Form.Control.Feedback type="invalid">
                    <br />
                    Invalid amount
                  </Form.Control.Feedback>
                </InputGroup>

                <InputGroup className="mb-3">
                  <Form.Label>Select a fee rate</Form.Label>
                  <Form.Range
                    min="1"
                    max="100"
                    value={bidFeeRate}
                    onChange={feeRateOnChange}
                  />
                </InputGroup>
              </div>
            </div>

            <div className="bid-content-mid">
              <div className="bid-content-left">
                {!!utxo.owner && <span>Owner Address</span>}
                {Boolean(bidPrice) && bitcoinPrice && <span>Price</span>}
                <span>Fee rate</span>
              </div>
              <div className="bid-content-right">
                {!!utxo.owner && <span>{shortenStr(utxo.owner)}</span>}

                {Boolean(bidPrice) && bitcoinPrice && (
                  <span>{`$${satsToFormattedDollarString(
                    bidPrice,
                    bitcoinPrice,
                  )}`}</span>
                )}
                <span>{bidFeeRate} sat/vbyte</span>
              </div>
            </div>
          </div>

          <div className="bit-continue-button">
            <Button
              size="medium"
              fullwidth
              disabled={!utxo.owner}
              autoFocus
              className={isOnBid ? "btn-loading" : ""}
              onClick={submit}
            >
              {isOnBid ? <TailSpin stroke="#fec823" speed={0.75} /> : "Bid"}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

BidModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleModal: PropTypes.func.isRequired,
  utxo: PropTypes.object,
  onBid: PropTypes.func,
};
export default BidModal;
