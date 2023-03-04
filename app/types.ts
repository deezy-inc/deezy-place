export type Utxo = {
  txid: string;
  vout: number;
  status?: {
    confirmed: boolean;
    block_time: number;
  };
  value?: number;
  contentType: string | null;
};
