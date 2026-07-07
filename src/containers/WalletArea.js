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
import { TailSpin } from "react-loading-icons";

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

const sendBulkSupportedWallets = ["alby", "nostr"];

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
	const { getRunesForUtxo, getRareSatsForUtxo, outputData, loading: runesLoading } = useRunes(ownedUtxos);

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
			return { disabled: true, label: "Checking for runes and rare sats..." };
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
		const rareSatCount = selectedUtxos.filter(
			(u) =>
				!u.inscriptionId &&
				runeNamesForUtxo(u).length === 0 &&
				getRareSatsForUtxo(u).length > 0,
		).length;
		const utxoCount =
			selectedUtxos.length - inscriptionCount - runeCount - rareSatCount;
		const parts = [];
		if (inscriptionCount > 0)
			parts.push(`${inscriptionCount} inscription${inscriptionCount === 1 ? "" : "s"}`);
		if (runeCount > 0) parts.push(`${runeCount} rune${runeCount === 1 ? "" : "s"}`);
		if (rareSatCount > 0)
			parts.push(`${rareSatCount} rare sat${rareSatCount === 1 ? "" : "s"}`);
		if (utxoCount > 0)
			parts.push(`${utxoCount} cardinal utxo${utxoCount === 1 ? "" : "s"}`);
		const joined =
			parts.length > 2
				? `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
				: parts.join(" and ");
		return `Send ${joined}`;
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

	// The bulk-send modal groups and labels rare-sat utxos, so hand it
	// selection objects annotated with their rarities
	const selectedUtxosWithRareSats = useMemo(
		() =>
			selectedUtxos.map((u) => ({
				...u,
				rareSats: getRareSatsForUtxo(u),
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[selectedUtxos, outputData],
	);

	// Owned utxos get the same tags so the fee-funding search can skip
	// candidates already known to hold runes or rare sats without having to
	// re-verify them one by one
	const ownedUtxosWithTags = useMemo(
		() =>
			ownedUtxos.map((u) => ({
				...u,
				runes: getRunesForUtxo(u),
				rareSats: getRareSatsForUtxo(u),
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ownedUtxos, outputData],
	);

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

	// Partition the wallet into the display sections. Inscriptions are known
	// as soon as the wallet loads; runes and rare sats need per-output
	// classification, so until that resolves the uninscribed utxos are shown
	// NOWHERE — never temporarily as cardinal, which would invite spending
	// something special. A utxo holding both an inscription (or runes) and
	// rare sats stays in its first matching section; the only hard rule is
	// that anything special never lands in Cardinal UTXOs.
	const inscriptionUtxos = filteredOwnedUtxos.filter((u) => !!u.inscriptionId);
	const runeUtxos = runesLoading
		? []
		: filteredOwnedUtxos.filter(
				(u) => !u.inscriptionId && runeNamesForUtxo(u).length > 0,
			);
	const rareSatUtxos = runesLoading
		? []
		: filteredOwnedUtxos.filter(
				(u) =>
					!u.inscriptionId &&
					runeNamesForUtxo(u).length === 0 &&
					getRareSatsForUtxo(u).length > 0,
			);
	const cardinalUtxos = runesLoading
		? []
		: filteredOwnedUtxos.filter(
				(u) =>
					!u.inscriptionId &&
					runeNamesForUtxo(u).length === 0 &&
					getRareSatsForUtxo(u).length === 0,
			);

	const renderUtxoCard = (inscription) => (
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
				rareSats={getRareSatsForUtxo(inscription)}
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
	);

	// Runes/rare sats/cardinals need per-output classification, so their
	// sections stay visible with a loading state until it resolves (except in
	// inscriptions-only mode, where those utxos aren't shown at all)
	const sections = [
		{ title: "Inscriptions", utxos: inscriptionUtxos },
		{
			title: "Runes",
			utxos: runeUtxos,
			classified: !runesLoading,
			emptyLabel: "No runes detected",
			alwaysShow: !displayOnlyInscriptions,
		},
		{
			title: "Rare Sats",
			utxos: rareSatUtxos,
			classified: !runesLoading,
			emptyLabel: "No rare sats detected",
			alwaysShow: !displayOnlyInscriptions,
		},
		{
			title: "Cardinal UTXOs",
			utxos: cardinalUtxos,
			classified: !runesLoading,
			emptyLabel: "No cardinal utxos detected",
			alwaysShow: !displayOnlyInscriptions,
		},
	];

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

				{utxosReady && ownedUtxos.length > 0 && (
					<>
						{sections
							.filter(
								(section) => section.utxos.length > 0 || section.alwaysShow,
							)
							.map((section) => (
								<div key={section.title} className="mb--40">
									<SectionTitle
										className="mb--20"
										{...{ title: section.title }}
									/>
									{section.utxos.length > 0 && (
										<div className="row g-5">
											{section.utxos.map((inscription) =>
												renderUtxoCard(inscription),
											)}
										</div>
									)}
									{section.utxos.length === 0 && !section.classified && (
										<div className="text-center py-4">
											<TailSpin stroke="#fec823" speed={0.75} width={64} height={64} />
										</div>
									)}
									{section.utxos.length === 0 && section.classified && (
										<p className="text-muted" style={{ fontSize: "14px" }}>
											{section.emptyLabel}
										</p>
									)}
								</div>
							))}
					</>
				)}

				{utxosReady && ownedUtxos.length === 0 && (
					<div>
						This address does not own anything yet..
						<br />
					</div>
				)}

				{!utxosReady && (
					<div className="row g-5">
						<Slider options={SliderOptions} className="slick-gutter-15">
							{[...Array(5)].map((_, index) => (
								<SliderItem key={index} className="ordinal-slide">
									<OrdinalCard overlay />
								</SliderItem>
							))}
						</Slider>
					</div>
				)}
			</div>
			{showSendBulkModal && (
				<SendBulkModal
					ownedUtxos={ownedUtxosWithTags}
					selectedUtxos={selectedUtxosWithRareSats}
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
