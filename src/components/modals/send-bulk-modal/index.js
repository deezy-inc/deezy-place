/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
	signMultipleUtxosForSend,
	shortenStr,
	fetchRecommendedFee,
	TESTNET,
	DEFAULT_FEE_RATE,
	broadcastPsbt
} from "@services/nosft";

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { toast } from "react-toastify";
import { TailSpin } from "react-loading-icons";
import TransactionSent from "@components/transaction-sent-confirmation";
import { useDelayUnmount } from "@hooks";
import clsx from "clsx";
import { useWallet } from "@context/wallet-context";
import { BtcTransactionTree } from "@components/btc-transaction-tree";

bitcoin.initEccLib(ecc);

const getTitle = (sendingInscriptions, sendingUtxos) => {
	const inscriptionCount = sendingInscriptions.length;
	const utxoCount = sendingUtxos.length;
	const inscriptionText = `inscription${inscriptionCount !== 1 ? 's' : ''}`;
	const utxoText = `UTXO${utxoCount !== 1 ? 's' : ''}`;

	if (inscriptionCount && utxoCount) {
		return `You are about to send ${inscriptionCount} ${inscriptionText} and ${utxoCount} ${utxoText}.`;
	}
	if (inscriptionCount) {
		return `You are about to send ${inscriptionCount} ${inscriptionText}.`;
	}
	if (utxoCount) {
		return `You are about to send ${utxoCount} ${utxoText}.`;
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
	const [sentTxId, setSentTxId] = useState(null);
	const { ordinalsPublicKey, nostrOrdinalsAddress } = useWallet();
	const [isSending, setIsSending] = useState(false);
	const [txFee, setTxFee] = useState("");
	const [txFeeRate, setTxFeeRate] = useState("");
	const [finalHexPsbt, setFinalHexPsbt] = useState(null);
	const [metadata, setMetadata] = useState(null);

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

	const closeModal = () => {
		onSend();
		handleModal();
	};

	const prepareTx = async () => {
		setIsSending(true);

		try {
			const {
				final_fee_rate,
				final_fee,
				final_signed_hex_psbt,
				metadata: _metadata,
			} = await signMultipleUtxosForSend({
				pubKey: ordinalsPublicKey,
				address: nostrOrdinalsAddress,
				selectedUtxos,
				ownedUtxos,
				destinationBtcAddress,
				sendFeeRate,
			});

			setFinalHexPsbt(final_signed_hex_psbt);
			setTxFee(final_fee);
			setTxFeeRate(final_fee_rate);
			setFinalHexPsbt(final_signed_hex_psbt);
			setMetadata(_metadata);

			try {
				await navigator.clipboard.writeText(final_signed_hex_psbt);
				toast.success(`Tx hex copied to clipboard`);
			} catch (error) {
				toast.error(error.message);
			}
		} catch (error) {
			console.error(error);
			toast.error(error.message);
		} finally {
			setIsSending(false);
		}
	};

	const confirmTx = async () => {
		setIsSending(true);
		try {
			// const txId = await broadcastPsbt(finalHexPsbt);
			const txId = "txId";
			setSentTxId(txId);
			try {
				await navigator.clipboard.writeText(txId);
				toast.success(`Tx id copied to clipboard`);
			} catch (error) {
				toast.error(error.message);
			}
			setFinalHexPsbt(null);
			// Display confirmation component
			setIsMounted(!isMounted);
		}
		catch (error) {
			console.error(error);
			toast.error(error.message);
		}
		finally {
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
				{txFee ? <p>
					{`Tx fee: ${txFee} sats / ${txFeeRate} sat/vbyte. Please double check the inputs and outputs.`}
				</p> : null}

				{finalHexPsbt ? <BtcTransactionTree finalHexPsbt={finalHexPsbt} fee={txFee} feeRate={txFeeRate} metadata={metadata} /> : null}

				{!finalHexPsbt ? <div className="placebid-form-box">
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
							</div>
						</div>
						<div className="bid-content-mid">
							<div className="bid-content-left">
								{!!destinationBtcAddress && <span>Destination</span>}
								<span>Fee rate</span>
							</div>
							<div className="bid-content-right">
								{!!destinationBtcAddress && (
									<span>{shortenStr(destinationBtcAddress)}</span>
								)}
								<span>{sendFeeRate} sat/vbyte</span>
							</div>
						</div>
					</div>

					<div className="bit-continue-button">
						<Button
							size="medium"
							fullwidth
							disabled={!destinationBtcAddress}
							className={isSending ? "btn-loading" : ""}
							onClick={prepareTx}
						>
							{isSending ? <TailSpin stroke="#fec823" speed={0.75} /> : "Prepare Tx"}
						</Button>
					</div>
				</div> : <>
					<div className="bit-continue-button">
						<Button
							size="medium"
							fullwidth
							className={isSending ? "btn-loading" : ""}
							onClick={confirmTx}
						>
							{isSending ? <TailSpin stroke="#fec823" speed={0.75} /> : "Confirm"}
						</Button>
					</div>
				</>}
			</div>
		);
	};

	const sendingInscriptions = selectedUtxos.filter((utxo) => utxo.inscriptionId);
	const sendingUtxos = selectedUtxos.filter((utxo) => !Boolean(utxo.inscriptionId));

	return (
		<Modal
			className={finalHexPsbt ? `modal-50 placebid-modal-wrapper` : `rn-popup-modal placebid-modal-wrapper`}
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
