export interface ItemType {
    id: string | number;
    title: string,
    subtitle: string,
    path: string,
    description: string,
    images: ImageType[],
    image: ImageType,
};

export interface OrdinalType {
    id: string | number;
    title: string;
    slug: string;
    description: string;
    price: {
        amount: number;
        currency: string;
    },
    likeCount: number;
    image: ImageType;
    authors: Author[];
    utxo: number;
};

export interface SellerType {
    id: string | number;
    name: string;
    slug: string;
    total_sale: number;
    image: ImageType;
    top_since: string;
    isVarified: boolean;
};

export interface CollectionType {
    id: string | number;
    title: string;
    slug: string;
    total_item: number;
    image: ImageType;
    thumbnails: ImageType[];
    profile_image: ImageType
};

export interface FeatureProductsType {
    id: string | number;
    title: string;
    slug: string;
    author: {
        name: string;
        slug: string;
    },
    image: ImageType;
};

export interface NotifactionType {
    id: string | number;
    title: string;
    description: string;
    path: string;
    date: string;
    time: string;
    image: ImageType;
};

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
