import axios from "axios";
import { PROCESSOR } from "../lib/constants.config";

async function buyOrdinalWithLightning({ psbt, receive_address, on_chain_fee_rate, refund_lightning_address }) {
    return axios.post(`https://api.deezy.io/v1/inscriptions/buy`, {
        psbt,
        receive_address,
        on_chain_fee_rate,
        refund_lightning_address,
        processor: PROCESSOR,
    });
}

export { buyOrdinalWithLightning };
