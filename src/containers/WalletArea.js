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
import useBitcoinPrice from "src/hooks/use-bitcoin-price";
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
	const { nostrOrdinalsAddress, walletName } = useWallet();
	const [balance, setBalance] = useState(0);
	const [utxosReady, setUtxosReady] = useState(false);
	const [ownedUtxos, setOwnedUtxos] = useState([]);
	const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
	const [refreshHack, setRefreshHack] = useState(false);
	const { bitcoinPrice } = useBitcoinPrice({ nostrOrdinalsAddress });
	const [showSendBulkModal, setShowSendBulkModal] = useState(false);
	const [selectedUtxos, setSelectedUtxos] = useState([]);
	const sendBulkSupported = sendBulkSupportedWallets.includes(walletName);

	const onSend = async (utxo, amount, address) => {};

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
							{sendBulkSupported && selectedUtxos.length > 0 && (
								<div className="mx-3">
									<button
										className="pd-react-area btn-transparent"
										type="button"
										onClick={handleSendBulkModal}
									>
										<div className="action">
											<i className="feather-send" />
											<span>Send Bulk</span>
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

							{sendBulkSupported && <div className="form-check mt-2">
								<input
									className="form-check-input"
									type="checkbox"
									id={"checkbox-select-all"}
									checked={
										selectedUtxos.length === filteredOwnedUtxos.length &&
										selectedUtxos.length > 0
									}
									onChange={(e) =>
										setSelectedUtxos(e.target.checked ? filteredOwnedUtxos : [])
									}
								/>
								<label
									className="form-check-label"
									htmlFor={"checkbox-select-all"}
								>
									Select for sending
								</label>
							</div>}
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
										onSale={handleRefreshHack}
									/>
									{sendBulkSupported && (
										<div className="form-check mt-2">
											<input
												className="form-check-input"
												type="checkbox"
												id={`checkbox-${inscription.key}`}
												checked={selectedUtxos.some(
													(selected) =>
														inscription.key && selected.key === inscription.key,
												)}
												onChange={(e) =>
													handleUtxoSelection(inscription, e.target.checked)
												}
											/>
											<label
												className="form-check-label"
												htmlFor={`checkbox-${inscription.key}`}
											>
												Select for sending
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
