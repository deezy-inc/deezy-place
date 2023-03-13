import { createClient } from "redis";
import axios from "axios";

const client = createClient({
    password: "3iDYgEOi88yy688sQ7ZbnfnWdlxbfzrF", 
    socket: {
        host: "redis-13884.c277.us-east-1-3.ec2.cloud.redislabs.com",
        port: 13884,
    }
});

client.on("error", (err) => console.log("Redis Client Error", err));

export default async function handler(req, res) {
    const { utxoKey } = req.query;
    await client.connect();
    let inscriptionId = await client.get(utxoKey);
    if (inscriptionId) {
        return inscriptionId;
    }

    const response = await axios.get(`https://ordinals.com/output/${utxoKey}`);
    inscriptionId = response.data.match(/<a href=\/inscription\/(.*?)>/)?.[1];
    await client.set(utxoKey, inscriptionId);
    return { inscriptionId };
}
