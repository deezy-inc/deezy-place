import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import ProgressBar from "react-bootstrap/ProgressBar";
import Button from "@ui/button";
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

const SendBulkModal = ({ show, handleModal, onSend, onSent, ownedUtxos, selectedUtxos }) => {
	const [isBtcInputAddressValid, setIsBtcInputAddressValid] = useState(true);
	const [destinationBtcAddress, setDestinationBtcAddress] = useState("");
	const [sendFeeRate, setSendFeeRate] = useState(DEFAULT_FEE_RATE);
	const [sentTxId, setSentTxId] = useState(null);
	const { ordinalsPublicKey, nostrOrdinalsAddress, walletName } = useWallet();
	// Raw-key signing happens locally without per-signature approval prompts
	const usesWalletExtension = walletName !== "nostr";
	const [isSending, setIsSending] = useState(false);
	const [txFee, setTxFee] = useState("");
	const [txFeeRate, setTxFeeRate] = useState("");
	const [hexPsbt, setHexPsbt] = useState(null);
	const [signedPsbt, setSignedPsbt] = useState(null);
	const [metadata, setMetadata] = useState(null);
	const [btcTreeReady, setBtcTreeReady] = useState(false);
	const [step, setStep] = useState(1);
	const [signProgress, setSignProgress] = useState(null);
	// Advanced: strip inscription / rare-sat outputs down to a target size
	// and split the extra padding into its own output
	const [stripPadding, setStripPadding] = useState(false);
	const [paddingSendTo, setPaddingSendTo] = useState("change");
	const [paddingTargetSize, setPaddingTargetSize] = useState(330);

	// Same precedence as the psbt classification: a runes utxo counts as
	// runes even if it also carries rare sats
	const sendingInscriptions = selectedUtxos.filter((utxo) => utxo.inscriptionId);
	const sendingRunes = selectedUtxos.filter(
		(utxo) => !utxo.inscriptionId && utxo.runes?.length > 0,
	);
	const sendingRareSats = selectedUtxos.filter(
		(utxo) =>
			!utxo.inscriptionId &&
			!(utxo.runes?.length > 0) &&
			utxo.rareSats?.length > 0,
	);
	const sendingUtxos = selectedUtxos.filter(
		(utxo) =>
			!Boolean(utxo.inscriptionId) &&
			!(utxo.runes?.length > 0) &&
			!(utxo.rareSats?.length > 0),
	);
	// Stripping padding only applies to inscriptions and rare sats; runes
	// sends already consolidate to a first-input-sized output
	const stripPaddingAvailable =
		(sendingInscriptions.length > 0 || sendingRareSats.length > 0) &&
		sendingRunes.length === 0;

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
		// Sub-1 rates (down to 0.1 sat/vbyte) are allowed, so keep the decimal
		setSendFeeRate(Number.parseFloat(evt.target.value));
	};

	// One slider step per click, clamped to the slider's range; rounding
	// keeps float steps from accumulating (0.30000000000000004 etc.)
	const adjustFeeRate = (delta) => {
		setSendFeeRate((prev) => {
			const next = Math.round((prev + delta) * 10) / 10;
			return Math.min(100, Math.max(0.2, next));
		});
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
				stripPadding:
					stripPaddingAvailable && stripPadding
						? { sendTo: paddingSendTo, targetSize: paddingTargetSize }
						: null,
			});
			setHexPsbt(unsignedPsbtHex);
			setMetadata(metadata);
			setStep(2);
		} catch (error) {
			console.error(error);
			toast.error("Failed to prepare transaction. " + error.message);
		} finally {
			setIsSending(false);
		}
	};

	// Show the "Begin Signing" overlay first; the extension prompts don't
	// start until the user confirms
	const requestSign = () => {
		const total = metadata?.inputs?.length || 0;
		setSignProgress({ done: 0, total, pending: true });
	};

	const sign = async () => {
		setIsSending(true);
		try {
			const {
				finalFeeRate,
				finalFee,
				finalSignedHexPsbt,
				finalSignedPsbt,
			} = await signPsbtForMultipleSend(hexPsbt, (done, total) =>
				setSignProgress({ done, total }),
			);
			setTxFee(finalFee);
			setTxFeeRate(finalFeeRate);
			setSignedPsbt(finalSignedPsbt);
			console.log("Fully signed PSBT (hex):", finalSignedHexPsbt);
			console.log("Fully signed PSBT (base64):", finalSignedPsbt.toBase64());
			setSignProgress((prev) => ({
				done: prev?.total ?? 0,
				total: prev?.total ?? 0,
				ready: true,
			}));
		} catch (error) {
			toast.error("Failed to sign transaction. " + error.message);
			setSignProgress(null);
		} finally {
			setIsSending(false);
		}
	};

	const send = async () => {
		setIsSending(true);
		try {
			const txId = await broadcastPsbt(signedPsbt);
			setSentTxId(txId);
			setSignProgress(null);
			setStep(3);
			if (onSent) {
				// Report every spent outpoint from the actual transaction, which
				// also covers funding utxos added beyond the user's selection
				const spentOutpoints = signedPsbt.txInputs.map((input) => {
					const txidHex = [...input.hash]
						.reverse()
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");
					return `${txidHex}:${input.index}`;
				});
				onSent({ spentOutpoints, txId });
			}
		} catch (error) {
      console.error(error)
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
						sendingRunes={sendingRunes}
						sendingRareSats={sendingRareSats}
						sendingUtxos={sendingUtxos}
						stripPaddingAvailable={stripPaddingAvailable}
						stripPadding={stripPadding}
						onStripPaddingChange={setStripPadding}
						paddingSendTo={paddingSendTo}
						onPaddingSendToChange={setPaddingSendTo}
						paddingTargetSize={paddingTargetSize}
						onPaddingTargetSizeChange={setPaddingTargetSize}
						destinationBtcAddress={destinationBtcAddress}
						isBtcInputAddressValid={isBtcInputAddressValid}
						sendFeeRate={sendFeeRate}
						addressOnChange={addressOnChange}
						feeRateOnChange={feeRateOnChange}
						onFeeRateAdjust={adjustFeeRate}
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
						sign={requestSign}
						send={send}
						back={() => setStep(1)}
						isSending={isSending}
						btcTreeReady={btcTreeReady}
						selectedUtxos={selectedUtxos}
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
				return "Send";
			case 2:
				return "Review and Sign Transaction";
			case 3:
				return "Transaction Sent";
			default:
				return "";
		}
	};
	const isCompact = step !== 2 || Boolean(signProgress);
	return (
		<Modal
			className={isCompact ? `rn-popup-modal placebid-modal-wrapper` : `modal-xl placebid-modal-wrapper`}
			show={show}
			onHide={handleModal}
			centered
			size={isCompact ? undefined : "xl"}
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
			<Modal.Body>
				{/* keep the review step mounted (hidden) so its state survives */}
				<div style={{ display: signProgress ? "none" : undefined }}>
					{renderStepContent()}
				</div>
				{signProgress && (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							padding: "40px 24px",
							textAlign: "center",
						}}
					>
						{signProgress.ready && (
							<>
								<h5 className="mb-2">
									Signing completed, ready to broadcast
								</h5>
								<p
									className="mb-4"
									style={{ fontSize: "0.9em", color: "#a0a0b8" }}
								>
									{signProgress.total} of {signProgress.total} signatures
									completed
								</p>
								<Button
									color="primary"
									size="medium"
									className={isSending ? "btn-loading" : ""}
									onClick={send}
								>
									Broadcast Transaction
								</Button>
								<button
									type="button"
									className="btn-transparent"
									style={{
										fontSize: "0.9em",
										color: "#a0a0b8",
										marginTop: "40px",
									}}
									onClick={handleModal}
								>
									Cancel
								</button>
							</>
						)}
						{!signProgress.ready && (signProgress.pending ? (
							<>
								<h5 className="mb-2">
									{signProgress.total} signature
									{signProgress.total === 1 ? "" : "s"} required, 0 of{" "}
									{signProgress.total} completed
								</h5>
								<p
									className="mb-4"
									style={{ fontSize: "0.9em", color: "#a0a0b8" }}
								>
									{usesWalletExtension
										? "Your wallet extension will ask you to approve each signature"
										: "Signatures will be created with your nostr key"}
								</p>
								<Button
									color="primary"
									size="medium"
									className={isSending ? "btn-loading" : ""}
									onClick={sign}
								>
									Begin Signing
								</Button>
								<button
									type="button"
									className="btn-transparent mt-4"
									style={{ fontSize: "0.9em", color: "#a0a0b8" }}
									onClick={() => setSignProgress(null)}
								>
									Cancel
								</button>
							</>
						) : (
							<>
								<h5 className="mb-4">
									{signProgress.done} of {signProgress.total} signatures
									completed
								</h5>
								<div style={{ width: "80%", maxWidth: "400px" }}>
									<ProgressBar
										variant="warning"
										now={
											signProgress.total > 0
												? (signProgress.done / signProgress.total) * 100
												: 0
										}
										style={{ height: "10px" }}
									/>
								</div>
								<p
									className="mt-4 mb-0"
									style={{ fontSize: "0.9em", color: "#a0a0b8" }}
								>
									{usesWalletExtension
										? "Approve each signature in your wallet extension"
										: "Signing with your nostr key..."}
								</p>
							</>
						))}
					</div>
				)}
			</Modal.Body>
		</Modal>
	);
};

SendBulkModal.propTypes = {
	show: PropTypes.bool.isRequired,
	handleModal: PropTypes.func.isRequired,
	onSend: PropTypes.func.isRequired,
	onSent: PropTypes.func,
	ownedUtxos: PropTypes.array.isRequired,
	selectedUtxos: PropTypes.array.isRequired,
};

export { SendBulkModal };
