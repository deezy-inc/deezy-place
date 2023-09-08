import { NOSFT_WSS } from "@services/nosft";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const wsLink = `${NOSFT_WSS}`;

export default function useDeezySockets({
  onSale = false,
  limitSaleResults = false,
  onAuction = false,
  limitAuctionResults = false,
}) {
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sales, setSales] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingAuctions, setLoadingAuctions] = useState(true);

  useEffect(() => {
    const limitOnSale = limitSaleResults ? ":10" : "";
    const limitOnAuction = limitAuctionResults ? ":10" : "";
    if (!socket.current) {
      socket.current = io(wsLink);

      const onConnect = () => {
        console.log("Connected to the server");
        setIsConnected(true);
        if (onSale) {
          socket.current.emit("joinChannel", `onSale${limitOnSale}`);
        }
        if (onAuction) {
          socket.current.emit("joinChannel", `onAuction${limitOnAuction}`);
        }
      };

      const onDisconnect = () => {
        console.log("Disconnected from the server");
        setIsConnected(false);
      };

      const onUpdate = (data) => {
        console.log("[Received update]", data);
        if (data.channel.startsWith("onSale")) {
          setSales(data.payload);
          setLoadingSales(false);
        } else if (data.channel.startsWith("onAuction")) {
          setAuctions(
            data.payload.map((auction) => ({ ...auction, auction: true })),
          );
          setLoadingAuctions(false);
        }
      };

      const onConnectError = (err) => {
        setLoadingSales(false);
        console.log(`Connect Error: ${err.message}`);
      };

      socket.current.on("connect", onConnect);
      socket.current.on("disconnect", onDisconnect);
      socket.current.on("update", onUpdate);
      socket.current.on("connect_error", onConnectError);

      return () => {
        socket.current.off("connect", onConnect);
        socket.current.off("disconnect", onDisconnect);
        socket.current.off("update", onUpdate);
        socket.current.off("connect_error", onConnectError);
      };
    }
  }, []);

  return { isConnected, sales, auctions, loadingSales, loadingAuctions };
}
