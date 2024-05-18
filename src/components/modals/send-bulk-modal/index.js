import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import { useWallet } from "@context/wallet-context";
import { preparePsbtForMultipleSend, signPsbtForMultipleSend, fetchRecommendedFee, DEFAULT_FEE_RATE, broadcastPsbt } from "@services/nosft";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { validate, Network } from "bitcoin-address-validation";
import { SelectRateStep } from "./select-rate-step";
import { PreviewTransactionStep } from "./preview-transaction-step";
import { TransactionSentStep } from "./transaction-sent-step";

bitcoin.initEccLib(ecc);

const SendBulkModal = ({ show, handleModal, onSend, ownedUtxos, selectedUtxos }) => {
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
	const [step, setStep] = useState(1);

	const sendingInscriptions = selectedUtxos.filter((utxo) => utxo.inscriptionId);
	const sendingUtxos = selectedUtxos.filter((utxo) => !Boolean(utxo.inscriptionId));

	useEffect(() => {
		const fetchFee = async () => {
			const fee = await fetchRecommendedFee();
			setSendFeeRate(fee);
		};

		fetchFee();
	}, []);

	const resetPsbt = () => {
		setHexPsbt(null);
		setSignedPsbt(null);
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
		if (!validate(newaddr, Network.mainnet)) {
			setIsBtcInputAddressValid(false);
			return;
		}

		setIsBtcInputAddressValid(true);
		setDestinationBtcAddress(newaddr);
	};

	const feeRateOnChange = (evt) => {
		setSendFeeRate(Number.parseInt(evt.target.value));
	};

	const copyToClipboard = async (text, message) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(message);
		} catch (error) {
			toast.error(error.message);
		}
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
			const { unsignedPsbtHex, metadata } = await preparePsbtForMultipleSend({
				pubKey: ordinalsPublicKey,
				address: nostrOrdinalsAddress,
				selectedUtxos,
				ownedUtxos,
				destinationBtcAddress,
				sendFeeRate,
			});
			setHexPsbt(unsignedPsbtHex);
			setMetadata(metadata);
			copyToClipboard(unsignedPsbtHex, "Psbt copied to clipboard.");
			setStep(2);
		} catch (error) {
			console.error(error);
			toast.error("Failed to prepare transaction. " + error.message);
		} finally {
			setIsSending(false);
		}
	};

	const sign = async () => {
		setIsSending(true);
		try {
			const {
				finalFeeRate,
				finalFee,
				finalSignedHexPsbt,
				finalSignedPsbt,
			} = await signPsbtForMultipleSend(hexPsbt, ordinalsPublicKey);
			setTxFee(finalFee);
			setTxFeeRate(finalFeeRate);
			setSignedPsbt(finalSignedPsbt);
			copyToClipboard(finalSignedHexPsbt, "Psbt signed and copied to clipboard.");
		} catch (error) {
			toast.error("Failed to sign transaction. " + error.message);
		} finally {
			setIsSending(false);
		}
	};

	const send = async () => {
		setIsSending(true);
		try {
			const txId = await broadcastPsbt(signed);
			setSentTxId(txId);
			copyToClipboard(txId, "Transaction id copied to clipboard.");
			setStep(3);
		} catch (error) {
			toast.error("Failed to send transaction.");
		} finally {
			setIsSending(false);
		}
	};
	const renderStepContent = () => {
		switch (step) {
			case 1:
				return (
					<SelectRateStep
						sendingInscriptions={sendingInscriptions}
						sendingUtxos={sendingUtxos}
						destinationBtcAddress={destinationBtcAddress}
						isBtcInputAddressValid={isBtcInputAddressValid}
						sendFeeRate={sendFeeRate}
						addressOnChange={addressOnChange}
						feeRateOnChange={feeRateOnChange}
						preparePsbt={preparePsbt}
						isSending={isSending}
					/>
				);
			case 2:
				return (
					<PreviewTransactionStep
						txFee={txFee}
						txFeeRate={txFeeRate}
						hexPsbt={hexPsbt}
						metadata={metadata}
						toggleBtcTreeReady={toggleBtcTreeReady}
						sign={sign}
						send={send}
						isSending={isSending}
						btcTreeReady={btcTreeReady}
					/>
				);
			case 3:
				return (
					<TransactionSentStep
						sentTxId={sentTxId}
						onClose={closeModal}
					/>
				);
			default:
				return null;
		}
	};
	const getTitle = (step, txFee, signedPsbt) => {
		if (txFee && signedPsbt && step === 2) {
			return "Send Transaction";
		}
		switch (step) {
			case 1:
				return "Send Bulk";
			case 2:
				return "Sign Transaction";
			case 3:
				return "Transaction Sent";
			default:
				return "";
		}
	};
	return (
		<Modal
			className={hexPsbt ? `modal-50 placebid-modal-wrapper` : `rn-popup-modal placebid-modal-wrapper`}
			show={show}
			onHide={handleModal}
			centered
		>
			<button
				type="button"
				className="btn-close"
				aria-label="Close"
				onClick={handleModal}
			>
				<i className="feather-x" />
			</button>
			<Modal.Header>
				<h3 className="modal-title">
					{getTitle(step, txFee, signedPsbt)}
				</h3>
			</Modal.Header>
			<Modal.Body>{renderStepContent()}</Modal.Body>
		</Modal>
	);
};

SendBulkModal.propTypes = {
	show: PropTypes.bool.isRequired,
	handleModal: PropTypes.func.isRequired,
	onSend: PropTypes.func.isRequired,
	ownedUtxos: PropTypes.array.isRequired,
	selectedUtxos: PropTypes.array.isRequired,
};

export { SendBulkModal };
