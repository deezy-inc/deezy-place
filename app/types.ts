export type Utxo = {
  txid: string;
  vout: string;
  status?: {
    confirmed: boolean;
    block_time: number;
  };
  value?: string,
  contentType: string | null
};


