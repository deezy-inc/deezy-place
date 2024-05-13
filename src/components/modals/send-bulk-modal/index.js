/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
	signAndBroadcastMultipleUtxos,
	shortenStr,
	outputValue,
	fetchRecommendedFee,
	TESTNET,
	DEFAULT_FEE_RATE,
	MIN_OUTPUT_VALUE,
	BOOST_UTXO_VALUE,
} from "@services/nosft";

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import { InscriptionPreview } from "@components/inscription-preview";
import TransactionSent from "@components/transaction-sent-confirmation";
import { useDelayUnmount } from "@hooks";
import clsx from "clsx";
import { useWallet } from "@context/wallet-context";

bitcoin.initEccLib(ecc);

const getTitle = (sendingInscriptions, sendingUtxos) => {
    const inscriptionCount = sendingInscriptions.length;
    const utxoCount = sendingUtxos.length;
    const inscriptionText = `inscription${inscriptionCount !== 1 ? 's' : ''}`;
    const utxoText = `UTXO${utxoCount !== 1 ? 's' : ''}`;

    if (inscriptionCount && utxoCount) {
        return `You are about to send ${inscriptionCount} ${inscriptionText} and ${utxoCount} ${utxoText}`;
    }
    if (inscriptionCount) {
        return `You are about to send ${inscriptionCount} ${inscriptionText}`;
    }
    if (utxoCount) {
        return `You are about to send ${utxoCount} ${utxoText}`;
    }
    return '';
};

const SendBulkModal = ({
	show,
	handleModal,
	utxo,
	onSend,
	isUninscribed = false,
	ownedUtxos,
	selectedUtxos,
}) => {
	const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
	const [destinationBtcAddress, setDestinationBtcAddress] = useState("");
	const [sendFeeRate, setSendFeeRate] = useState(DEFAULT_FEE_RATE);
	const [boostOutputValue, setBoostOutputValue] = useState(BOOST_UTXO_VALUE);
	const [sentTxId, setSentTxId] = useState(null);
	const { ordinalsPublicKey, nostrOrdinalsAddress } = useWallet();
	const [isSending, setIsSending] = useState(false);

	const [isMounted, setIsMounted] = useState(true);
	const showDiv = useDelayUnmount(isMounted, 500);

	useEffect(() => {
		const fetchFee = async () => {
			const fee = await fetchRecommendedFee();
			setSendFeeRate(fee);
		};

		fetchFee();
	}, []);

	const addressOnChange = (evt) => {
		const newaddr = evt.target.value;

		if (newaddr === "") {
			setIsBtcInputAddressValid(true);
			return;
		}
		if (!validate(newaddr, TESTNET ? Network.testnet : Network.mainnet)) {
			setIsBtcInputAddressValid(false);
			return;
		}

		setIsBtcInputAddressValid(true);
		setDestinationBtcAddress(newaddr);
	};

	const feeRateOnChange = (evt) => {
		setSendFeeRate(Number.parseInt(evt.target.value));
	};

	const boostOutputValueChange = (evt) => {
		setBoostOutputValue(Number.parseInt(evt.target.value));
	};

	const boostRequired =
		!!utxo &&
		!!sendFeeRate &&
		outputValue(utxo, sendFeeRate) < MIN_OUTPUT_VALUE;

	const closeModal = () => {
		onSend();
		handleModal();
	};

	const submit = async () => {
		setIsSending(true);

		try {
			debugger;
			const {txId} = await signAndBroadcastMultipleUtxos({
				pubKey: ordinalsPublicKey,
				address: nostrOrdinalsAddress,
				selectedUtxos,
				ownedUtxos,
				destinationBtcAddress,
				sendFeeRate,
			});

			debugger;

			setSentTxId(txId || "");
			toast.success(`Transaction sent: ${txId}, copied to clipboard`);
			navigator.clipboard.writeText(txId);

			// Display confirmation component
			setIsMounted(!isMounted);
		} catch (error) {
			console.error(error);
			toast.error(error.message);
		} finally {
			setIsSending(false);
		}
	};

	const renderBody = () => {
		if (!showDiv) {
			return (
				<div className="show-animated">
					<TransactionSent
						txId={sentTxId}
						onClose={closeModal}
						title="Transaction Sent"
					/>
				</div>
			);
		}

		return (
			<div className={clsx(!isMounted && "hide-animated")}>
				<p>
					{getTitle(sendingInscriptions, sendingUtxos)}
				</p>
				{!isUninscribed && (
					<div className="inscription-preview">
						<InscriptionPreview utxo={utxo} />
					</div>
				)}

				<div className="placebid-form-box">
					<div className="bid-content">
						<div className="bid-content-top">
							<div className="bid-content-left">
								<InputGroup className="mb-lg-5">
									<Form.Control
										onChange={addressOnChange}
										placeholder="Paste BTC address here"
										aria-label="Paste BTC address heres"
										aria-describedby="basic-addon2"
										isInvalid={!isBtcInputAddressValid}
										autoFocus
									/>

									<Form.Control.Feedback type="invalid">
										<br />
										That is not a valid {TESTNET ? "testnet" : "mainnet"} BTC
										address
									</Form.Control.Feedback>
								</InputGroup>
								<InputGroup className="mb-3">
									<Form.Label>Select a fee rate</Form.Label>
									<Form.Range
										min="1"
										max="1200"
										defaultValue={sendFeeRate}
										onChange={feeRateOnChange}
									/>
								</InputGroup>
								{boostRequired ? (
									<InputGroup className="mb-3">
										<Form.Label>Select an output value</Form.Label>
										<Form.Range
											min="330"
											max="10000"
											value={boostOutputValue}
											onChange={boostOutputValueChange}
										/>
									</InputGroup>
								) : (
									<></>
								)}
							</div>
						</div>
						<div className="bid-content-mid">
							<div className="bid-content-left">
								{!!destinationBtcAddress && <span>Destination</span>}
								<span>Fee rate</span>
								<span>Output Value</span>
							</div>
							<div className="bid-content-right">
								{!!destinationBtcAddress && (
									<span>{shortenStr(destinationBtcAddress)}</span>
								)}
								<span>{sendFeeRate} sat/vbyte</span>
								<span>
									{boostRequired
										? boostOutputValue
										: utxo &&
											sendFeeRate &&
											outputValue(utxo, sendFeeRate)}{" "}
									sats
								</span>
							</div>
						</div>
						{boostRequired && (
							<span>
								Sending will require a small lightning payment to boost the utxo
								value
								<br />
								<br />
							</span>
						)}
					</div>

					<div className="bit-continue-button">
						<Button
							size="medium"
							fullwidth
							disabled={!destinationBtcAddress}
							className={isSending ? "btn-loading" : ""}
							onClick={submit}
						>
							{isSending ? <TailSpin stroke="#fec823" speed={0.75} /> : "Send"}
						</Button>
					</div>
				</div>
			</div>
		);
	};

	const sendingInscriptions = selectedUtxos.filter((utxo) => utxo.inscriptionId);
	const sendingUtxos = selectedUtxos.filter((utxo) => !Boolean(utxo.inscriptionId));

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
						Send {shortenStr(utxo && `${utxo.txid}:${utxo.vout}`)}
					</h3>
				</Modal.Header>
			)}
			<Modal.Body>{renderBody()}</Modal.Body>
		</Modal>
	);
};

SendBulkModal.propTypes = {
	show: PropTypes.bool.isRequired,
	handleModal: PropTypes.func.isRequired,
	utxo: PropTypes.object,
	isUninscribed: PropTypes.bool,
	onSend: PropTypes.func.isRequired,
	ownedUtxos: PropTypes.array,
	selectedUtxos: PropTypes.array,
};

export default SendBulkModal;
