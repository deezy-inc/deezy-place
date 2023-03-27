import { useContext } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import Anchor from "@ui/anchor";
import ClientAvatar from "@ui/client-avatar";
import ProductBid from "@components/product-bid";
import { ORDINALS_WALLET } from "@lib/constants";
import WalletContext from "@context/wallet-context";
import { Author, Utxo } from "@utils/types";
import { shortenStr } from "@utils/crypto";
import { InscriptionPreview } from "@components/inscription-preview";

const CardOptions = dynamic(() => import("@components/card-options"), {
    ssr: false,
});

interface OrdinalCardProps {
    overlay: boolean;
    price: {
        amount: string;
        currency: string;
    };
    authors: Author[];
    utxo: Utxo;
    confirmed: boolean;
    date: number;
    type: "buy" | "sell" | "send";
    onSale: () => void;
}

const OrdinalCard = ({ overlay = false, price, type, utxo, authors, confirmed, date, onSale }: OrdinalCardProps) => {
    const { nostrAddress } = useContext(WalletContext);

    return (
        <div className={clsx("product-style-one", !overlay && "no-overlay")}>
            <div className="card-thumbnail">
                <InscriptionPreview utxo={utxo} />
            </div>
            <div className="inscription-details-area">
                {utxo.inscriptionId && <div className="inscription-number">#{utxo.num}</div>}
            </div>
            <div className="product-share-wrapper">
                <div className="profile-share">
                    {authors?.map((client) => (
                        <ClientAvatar
                            key={client.name}
                            name={utxo.inscriptionId || utxo.txid}
                            image={client.image}
                        />
                    ))}
                    <div className="more-author-text">
                        {Boolean(utxo.inscriptionId) && (
                            <Anchor
                                className="logo-dark"
                                path={`${ORDINALS_WALLET}/inscription/${utxo.inscriptionId}`}
                                target="_blank"
                            >
                                {shortenStr(utxo.inscriptionId)}
                            </Anchor>
                        )}
                    </div>
                </div>
                {nostrAddress && type !== "send" && type !== "buy" && <CardOptions utxo={utxo} onSale={onSale} />}
            </div>
            <ProductBid price={price} utxo={utxo} confirmed={confirmed} date={date} type={type} onSale={onSale} />
        </div>
    );
};

export default OrdinalCard;
