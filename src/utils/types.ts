import PropTypes from "prop-types";

export const IDType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

export const HeadingType = PropTypes.shape({
    id: IDType,
    content: PropTypes.string.isRequired,
});

export const TextType = PropTypes.shape({
    id: IDType,
    content: PropTypes.string.isRequired,
});

export const ButtonComponentType = {
    children: PropTypes.node.isRequired,
    type: PropTypes.oneOf(["button", "submit", "reset"]),
    label: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string,
    path: PropTypes.string,
    size: PropTypes.oneOf(["large", "small", "medium"]),
    color: PropTypes.oneOf(["primary", "primary-alta"]),
    fullwidth: PropTypes.bool,
};

// eslint-disable-next-line no-unused-vars
const { children, ...restButtonTypes } = ButtonComponentType;

export const ButtonType = PropTypes.shape({
    content: PropTypes.string.isRequired,
    ...restButtonTypes,
});

export const SectionTitleType = PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
});

export const ItemType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    path: PropTypes.string,
    description: PropTypes.string,
    images: PropTypes.arrayOf(ImageType),
    image: ImageType,
});

export const OrdinalType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.shape({
        amount: PropTypes.number.isRequired,
        currency: PropTypes.string.isRequired,
    }).isRequired,
    likeCount: PropTypes.number,
    image: ImageType,
    authors: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            slug: PropTypes.string.isRequired,
            image: ImageType,
        })
    ),
    utxo: PropTypes.number,
});

export const SellerType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    total_sale: PropTypes.number.isRequired,
    image: ImageType.isRequired,
    top_since: PropTypes.string,
    isVarified: PropTypes.bool,
});

export const CollectionType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    total_item: PropTypes.number.isRequired,
    image: ImageType.isRequired,
    thumbnails: PropTypes.arrayOf(ImageType).isRequired,
    profile_image: ImageType.isRequired,
});

export const FeatureProductsType = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    author: PropTypes.shape({
        name: PropTypes.string.isRequired,
        slug: PropTypes.string,
    }),
    image: ImageType.isRequired,
});

export const NotifactionType = PropTypes.shape({
    id: IDType,
    title: PropTypes.string,
    description: PropTypes.string,
    path: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    image: ImageType,
});

export interface Meta {
    name: string;
}

export interface RawInscription {
    collection: unknown;
    content_type: string;
    escrow: number | undefined;
    id: string;
    meta: Meta | undefined;
    num: number;
}

export interface RawUtxo {
    txid: string;
    version: number;
    locktime: number;
    vin: Vin[];
    vout: Vout[];
    size: number;
    weight: number;
    fee: number;
    status: Status;
}

export interface Vin {
    txid: string;
    vout: number;
    prevout: null[];
    scriptsig: string;
    scriptsig_asm: string;
    witness: null[];
    is_coinbase: boolean;
    sequence: number;
}

export interface Vout {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address: string;
    value: number;
}

export interface Inscription {
    txid: string;
    version: number;
    locktime: number;
    size: number;
    weight: number;
    fee: number;
    status: Status;
    inscriptionId: string;
    collection: Collection;
    content_type: string;
    escrow: number | null;
    id: string;
    meta: Meta;
    num: number;
    value: number;
}

export interface Collection {
    creator_address: string | null;
    name: string;
    slug: string;
}

export interface Meta {
    name: string;
}

export interface Status {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
}

export interface ImageType {
    src: string | {};
    alt: string;
    width: number;
    height: number;
    layout: string;
}

export interface Author {
    name: string;
    slug: string;
    image: ImageType;
}
