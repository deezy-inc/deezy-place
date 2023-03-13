import { createClient } from "redis";
import axios from "axios";

const client = createClient({
    password: "3iDYgEOi88yy688sQ7ZbnfnWdlxbfzrF",
    socket: {
        host: "redis-13884.c277.us-east-1-3.ec2.cloud.redislabs.com",
        port: 13884,
    },
});

client.connect();

client.on("error", (err) => console.log("Redis Client Error", err));

// eslint-disable-next-line consistent-return
export default async function handler(req, res) {
    const { utxoKey } = req.query;
    let inscriptionId = await client.get(utxoKey);
    if (inscriptionId) {
        console.log("inscriptions id", inscriptionId);
        res.status(200).json({ inscriptionId });
        return;
    }

    const response = await axios.get(`https://ordinals.com/output/${utxoKey}`);
    inscriptionId = response.data.match(/<a href=\/inscription\/(.*?)>/)?.[1];
    if (inscriptionId) {
        console.log("get inscription", inscriptionId);
        await client.set(utxoKey, inscriptionId);
    }
    res.status(200).json({ inscriptionId });
}
