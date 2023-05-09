import axios from "axios";

async function buyOrdinalWithLightning({ psbt, receive_address, on_chain_fee_rate, refund_lightning_address }) {
    const { data } = await axios.post(`https://api.deezy.io/v1/inscriptions/buy`, {
        psbt,
        receive_address,
        on_chain_fee_rate,
        refund_lightning_address,
    });

    return data.bolt11_invoice;
}

export { buyOrdinalWithLightning };
