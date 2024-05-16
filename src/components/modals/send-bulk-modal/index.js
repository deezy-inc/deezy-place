/* eslint-disable react/forbid-prop-types */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "@ui/button";
import { validate, Network } from "bitcoin-address-validation";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import {
	preparePsbtForMultipleSend,
	signPsbtForMultipleSend,
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
	onSend,
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
	const [hexPsbt, setHexPsbt] = useState(null);
	const [signedPsbt, setSignedPsbt] = useState(null);
	const [metadata, setMetadata] = useState(null);
	const [btcTreeReady, setBtcTreeReady] = useState(false);

	const [isMounted, setIsMounted] = useState(true);
	const showDiv = useDelayUnmount(isMounted, 500);

	useEffect(() => {
		const fetchFee = async () => {
			const fee = await fetchRecommendedFee();
			setSendFeeRate(fee);
		};

		fetchFee();
	}, []);

	const resetPsbt = () => {
		setHexPsbt(null);
		setTxFee("");
		setTxFeeRate("");
		setMetadata(null);
	};



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

	const toggleBtcTreeReady = (isReady) => {
		setBtcTreeReady(isReady);
	};

	const preparePsbt = async () => {
		setIsSending(true);
		resetPsbt();

		try {
			const {
				unsignedPsbtHex: _unsignedPsbtHex,
				metadata: _metadata,
			} = await preparePsbtForMultipleSend({
				pubKey: ordinalsPublicKey,
				address: nostrOrdinalsAddress,
				selectedUtxos,
				ownedUtxos,
				destinationBtcAddress,
				sendFeeRate,
			});

			setHexPsbt(_unsignedPsbtHex);
			setMetadata(_metadata);

			try {
				await navigator.clipboard.writeText(_unsignedPsbtHex);
				toast.success(`Psbt copied to clipboard`);
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

	const signPsbt = async () => {
		setIsSending(true);
		try {
			const {
				finalFeeRate,
				finalFee,
				finalSignedHexPsbt,
				finalSignedPsbt,
			} = await signPsbtForMultipleSend(hexPsbt);
			setTxFee(finalFee);
			setTxFeeRate(finalFeeRate);
			setHexPsbt(finalSignedHexPsbt);
			setSignedPsbt(finalSignedPsbt);
			try {
				await navigator.clipboard.writeText(finalSignedHexPsbt);
				toast.success(`Signed psbt copied to clipboard`);
			} catch (error) {
				toast.error(error.message);
			}
			setHexPsbt(null);
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
				{txFee ? (
					<p className="btc-fee-text">
						{`Tx fee: `}
						<span>
							{`${txFee} sats (${txFeeRate} sat/vbyte)`}
						</span>
						{`. Please double check the inputs and outputs.`}
					</p>
				) : null}

				{hexPsbt ? <BtcTransactionTree hexPsbt={hexPsbt} metadata={metadata} toggleBtcTreeReady={toggleBtcTreeReady} /> : null}

				{(!hexPsbt) ?
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
								onClick={preparePsbt}
							>
								{isSending ? <TailSpin stroke="#fec823" speed={0.75} /> : "Prepare Tx"}
							</Button>
						</div>
					</div> :
					<>
						<div className="bit-continue-button">
							<Button
								size="medium"
								fullwidth
								className={isSending ? "btn-loading" : ""}
								onClick={signPsbt}
								disabled={isSending || !btcTreeReady}
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
			className={hexPsbt ? `modal-50 placebid-modal-wrapper` : `rn-popup-modal placebid-modal-wrapper`}
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
			<Modal.Body>{renderBody()}</Modal.Body>
		</Modal>
	);
};

SendBulkModal.propTypes = {
	show: PropTypes.bool.isRequired,
	handleModal: PropTypes.func.isRequired,
	onSend: PropTypes.func.isRequired,
	ownedUtxos: PropTypes.array,
	selectedUtxos: PropTypes.array,
};

export default SendBulkModal;
