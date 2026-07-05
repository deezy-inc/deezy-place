/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extra-boolean-cast, react/no-array-index-key */
import { useMemo, useEffect, useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";
import { toast } from "react-toastify";
import Image from "next/image";
import {
	getInscriptions,
	satsToFormattedDollarString,
	shortenStr,
} from "@services/nosft";
import { collectionAuthor, applyFilters } from "@containers/helpers";
import { useWallet } from "@context/wallet-context";
import Slider, { SliderItem } from "@ui/slider";
import Button from "@ui/button";
import useBitcoinPrice from "src/hooks/use-bitcoin-price";
import { useRunes } from "@hooks";
import { SendBulkModal } from "@components/modals/send-bulk-modal";

const SliderOptions = {
	infinite: true,
	slidesToShow: 5,
	slidesToScroll: 1,
	autoplay: true,
	speed: 4000,
	responsive: [
		{
			breakpoint: 1399,
			settings: {
				slidesToShow: 4,
				slidesToScroll: 1,
			},
		},
		{
			breakpoint: 1200,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
			},
		},
		{
			breakpoint: 992,
			settings: {
				slidesToShow: 2,
				slidesToScroll: 1,
			},
		},
		{
			breakpoint: 576,
			settings: {
				slidesToShow: 1,
				slidesToScroll: 1,
			},
		},
	],
};

const sendBulkSupportedWallets = ["alby"];

const WalletArea = ({
	className,
	space,
	displayOnlyInscriptions,
	showOnlyOrdinals = true,
}) => {
	const { nostrOrdinalsAddress, walletName, setHeaderSendAction } = useWallet();
	const [balance, setBalance] = useState(0);
	const [utxosReady, setUtxosReady] = useState(false);
	const [ownedUtxos, setOwnedUtxos] = useState([]);
	const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
	const [refreshHack, setRefreshHack] = useState(false);
	const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });
	const [showSendBulkModal, setShowSendBulkModal] = useState(false);
	const [selectedUtxos, setSelectedUtxos] = useState([]);
	const sendBulkSupported = sendBulkSupportedWallets.includes(walletName);
	const { getRunesForUtxo, loading: runesLoading } = useRunes(ownedUtxos);

	const runeNamesForUtxo = (utxo) =>
		(getRunesForUtxo(utxo) || []).map(([name]) => name);

	const selectedRuneUtxos = selectedUtxos.filter(
		(u) => runeNamesForUtxo(u).length > 0,
	);
	const selectionHasNonRunes = selectedUtxos.some(
		(u) => runeNamesForUtxo(u).length === 0,
	);
	// The single rune every selected runes utxo holds, or null if none are
	// selected or any selected utxo holds multiple/different runes
	const selectedRuneName = (() => {
		if (selectedRuneUtxos.length === 0) return null;
		const names = runeNamesForUtxo(selectedRuneUtxos[0]);
		if (names.length !== 1) return null;
		const allSame = selectedRuneUtxos.every((u) => {
			const n = runeNamesForUtxo(u);
			return n.length === 1 && n[0] === names[0];
		});
		return allSame ? names[0] : null;
	})();

	// Runes sends are exclusive: only utxos holding the same single rune can
	// be selected together, and never alongside inscriptions/plain utxos
	const getCheckboxState = (utxo) => {
		const isSelected = selectedUtxos.some((s) => s.key === utxo.key);
		if (isSelected) {
			return { disabled: false, label: "Selected for sending" };
		}
		if (runesLoading) {
			return { disabled: true, label: "Checking for runes..." };
		}
		const runeNames = runeNamesForUtxo(utxo);
		if (runeNames.length === 0) {
			if (selectedRuneUtxos.length > 0) {
				return { disabled: true, label: "Runes send in progress" };
			}
			return { disabled: false, label: "Select for sending" };
		}
		if (selectionHasNonRunes) {
			return { disabled: true, label: "Runes - send separately" };
		}
		if (selectedRuneUtxos.length === 0) {
			return {
				disabled: false,
				label:
					runeNames.length === 1
						? `Select for sending (${runeNames[0]})`
						: "Select for sending (mixed runes)",
			};
		}
		if (runeNames.length === 1 && selectedRuneName && runeNames[0] === selectedRuneName) {
			return {
				disabled: false,
				label: `Select for sending (${selectedRuneName})`,
			};
		}
		return { disabled: true, label: "Different rune - send separately" };
	};

	const sendLabel = (() => {
		const inscriptionCount = selectedUtxos.filter((u) => u.inscriptionId).length;
		const runeCount = selectedRuneUtxos.length;
		const utxoCount = selectedUtxos.length - inscriptionCount - runeCount;
		const parts = [];
		if (inscriptionCount > 0)
			parts.push(`${inscriptionCount} inscription${inscriptionCount === 1 ? "" : "s"}`);
		if (runeCount > 0) parts.push(`${runeCount} rune${runeCount === 1 ? "" : "s"}`);
		if (utxoCount > 0) parts.push(`${utxoCount} utxo${utxoCount === 1 ? "" : "s"}`);
		return `Send ${parts.join(" and ")}`;
	})();

	useEffect(() => {
		if (!setHeaderSendAction) return undefined;
		if (selectedUtxos.length > 0) {
			setHeaderSendAction({
				label: sendLabel,
				onSend: () => setShowSendBulkModal(true),
				onDeselect: () => setSelectedUtxos([]),
			});
		} else {
			setHeaderSendAction(null);
		}
		return undefined;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedUtxos, sendLabel]);

	// Clear the header button when leaving the wallet page
	useEffect(
		() => () => setHeaderSendAction && setHeaderSendAction(null),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const onSend = async (utxo, amount, address) => {};

	// After a successful broadcast the backend may not reflect the spend for a
	// while, so hide the spent utxos locally instead of refetching
	const handleBulkSendComplete = ({ spentOutpoints }) => {
		const spentKeys = new Set(spentOutpoints);
		const remaining = ownedUtxos.filter(
			(u) => !spentKeys.has(`${u.txid}:${u.vout}`),
		);
		setOwnedUtxos(remaining);
		setBalance(remaining.reduce((acc, u) => acc + u.value, 0));
		setSelectedUtxos([]);
	};

	const handleUtxoSelection = (utxo, isSelected) => {
		if (isSelected) {
			setSelectedUtxos([...selectedUtxos, utxo]);
		} else {
			setSelectedUtxos(selectedUtxos.filter((u) => u.key !== utxo.key));
		}
	};

	const handleRefreshHack = () => {
		setRefreshHack(!refreshHack);
	};

	const handleSendBulkModal = () => {
		setShowSendBulkModal((prev) => !prev);
	};

	const onCopyAddress = () => {
		navigator.clipboard.writeText(nostrOrdinalsAddress);
		toast("Receive Address copied to clipboard!");
	};

	useMemo(() => {
		const filteredUtxos = applyFilters({
			showOnlyOrdinals: false,
			utxos: ownedUtxos,
		});
		setFilteredOwnedUtxos(filteredUtxos);
	}, [ownedUtxos]);

	const resetUtxos = () => {
		setOwnedUtxos([]);
		setFilteredOwnedUtxos([]);
		setUtxosReady(true);
	};

	useEffect(() => {
		if (!nostrOrdinalsAddress) {
			resetUtxos();
			return;
		}

		const loadUtxos = async () => {
			setUtxosReady(false);

			let utxosWithInscriptionData = [];

			try {
				utxosWithInscriptionData = await getInscriptions(nostrOrdinalsAddress);
				if (displayOnlyInscriptions) {
					utxosWithInscriptionData = utxosWithInscriptionData.filter(
						(utxo) => !!utxo.inscriptionId,
					);
				}
				setBalance(
					utxosWithInscriptionData.reduce((acc, utxo) => acc + utxo.value, 0),
				);
			} catch (error) {
				console.error(error);
				// TODO: handle error
			}

			setOwnedUtxos(utxosWithInscriptionData);
			setFilteredOwnedUtxos(utxosWithInscriptionData);
			setUtxosReady(true);
		};

		loadUtxos();
	}, [refreshHack, nostrOrdinalsAddress]);

	return (
		<div
			id="your-collection"
			className={clsx(
				"rn-product-area",
				"wallet",
				space === 1 && "rn-section-gapTop",
				className,
			)}
		>
			<div className="container">
				<div className="row mb--50 align-items-center">
					<div className="col-lg-6 col-md-6 col-sm-6 col-12">
						<div className="wallet-title">
							<SectionTitle
								className="mb--0"
								{...{ title: "Available Balance" }}
								isLoading={!utxosReady}
							/>
							{!!balance && (
								<span className="balance-info">
									<span className="price">
										${satsToFormattedDollarString(balance, bitcoinPrice)}
									</span>
								</span>
							)}
							{sendBulkSupported && (
								<div
									className="mx-3 d-xl-none"
									style={{
										visibility:
											selectedUtxos.length > 0 ? "visible" : "hidden",
									}}
								>
									<button
										className="pd-react-area btn-transparent"
										type="button"
										onClick={handleSendBulkModal}
									>
										<div className="action">
											<i className="feather-send" />
											<span>Send</span>
										</div>
									</button>
								</div>
							)}
						</div>

						<br />
						<span>
							<Image
								src="/images/logo/ordinals-white.svg"
								alt="Ordinal"
								width={15}
								height={15}
								className="mb-1"
								priority
							/>
							<button
								type="button"
								className="btn-transparent"
								onClick={onCopyAddress}
							>
								{" "}
								{shortenStr(nostrOrdinalsAddress)}
							</button>

							{sendBulkSupported && <div className="form-check mt-2" style={{ minHeight: "2em" }}>
								{selectedRuneUtxos.length > 0 ? (
									<span className="form-check-label text-muted">
										Runes send in progress
									</span>
								) : (
									<>
										<input
											className="form-check-input"
											type="checkbox"
											id={"checkbox-select-all"}
											checked={
												selectedUtxos.length === filteredOwnedUtxos.filter(utxo => !getRunesForUtxo(utxo)?.length).length &&
												selectedUtxos.length > 0
											}
											disabled={runesLoading}
											onChange={(e) =>
												setSelectedUtxos(e.target.checked ? filteredOwnedUtxos.filter(utxo => !getRunesForUtxo(utxo)?.length) : [])
											}
										/>
										<label
											className="form-check-label"
											htmlFor={"checkbox-select-all"}
										>
											Select all for sending (excluding runes)
										</label>
									</>
								)}
							</div>}
							{sendBulkSupported && (
								<div
									className="mt-2 d-xl-none"
									style={{
										visibility:
											selectedUtxos.length > 0 ? "visible" : "hidden",
									}}
								>
									<Button
										color="primary-alta"
										size="small"
										onClick={() => setSelectedUtxos([])}
									>
										Deselect all
									</Button>
								</div>
							)}
						</span>
					</div>
				</div>

				<div className="row g-5">
					{utxosReady && ownedUtxos.length > 0 && (
						<>
							{filteredOwnedUtxos.map((inscription) => (
								<div
									key={inscription.key}
									className="col-5 col-lg-4 col-md-6 col-sm-6 col-12"
								>
									<OrdinalCard
										overlay
										price={{
											amount: inscription.value.toLocaleString("en-US"),
											currency: "Sats",
										}}
										type="send"
										confirmed={inscription.status.confirmed}
										date={inscription.status.block_time}
										authors={collectionAuthor}
										utxo={inscription}
										runes={getRunesForUtxo(inscription)}
										onSale={handleRefreshHack}
									/>
									{sendBulkSupported && (
										<div className="form-check mt-2" style={{ minHeight: "3em" }}>
											<input
												className="form-check-input"
												type="checkbox"
												id={`checkbox-${inscription.key}`}
												checked={selectedUtxos.some(
													(selected) =>
														inscription.key && selected.key === inscription.key,
												)}
												disabled={getCheckboxState(inscription).disabled}
												onChange={(e) =>
													handleUtxoSelection(inscription, e.target.checked)
												}
											/>
											<label
												className={`form-check-label ${getCheckboxState(inscription).disabled ? 'text-muted' : ''}`}
												htmlFor={`checkbox-${inscription.key}`}
											>
												{getCheckboxState(inscription).label}
											</label>
										</div>
									)}
								</div>
							))}
							{filteredOwnedUtxos.length === 0 && (
								<div className="col-12">
									<div className="text-center">
										<h3>No results found</h3>
									</div>
								</div>
							)}
						</>
					)}

					{utxosReady && ownedUtxos.length === 0 && (
						<div>
							This address does not own anything yet..
							<br />
						</div>
					)}

					{!utxosReady && (
						<Slider options={SliderOptions} className="slick-gutter-15">
							{[...Array(5)].map((_, index) => (
								<SliderItem key={index} className="ordinal-slide">
									<OrdinalCard overlay />
								</SliderItem>
							))}
						</Slider>
					)}
				</div>
			</div>
			{showSendBulkModal && (
				<SendBulkModal
					ownedUtxos={ownedUtxos}
					selectedUtxos={selectedUtxos}
					show={showSendBulkModal}
					handleModal={handleSendBulkModal}
					utxo={""}
					isUninscribed={false}
					onSend={onSend}
					onSent={handleBulkSendComplete}
				/>
			)}
		</div>
	);
};

WalletArea.propTypes = {
	className: PropTypes.string,
	space: PropTypes.oneOf([1, 2]),
	onSale: PropTypes.func,
	displayOnlyInscriptions: PropTypes.bool,
	hideAddress: PropTypes.bool,
};

WalletArea.defaultProps = {
	space: 1,
};

export default WalletArea;
