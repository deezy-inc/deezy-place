import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import NostrKey from "@lib/nosft-core/services/nostr-key";
import NostrKeyModal from "@components/modals/nostr-key-modal";

// Mounted once in _app.js. When a raw-nostr-key user tries to sign but no
// private key is in memory (e.g. connected view-only, or the page was
// refreshed), NostrKey dispatches a window event and this modal collects the
// nsec so the pending signature can proceed.
const NostrSignModal = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onKeyRequested = () => {
      console.log("[nostr-sign-modal] private key request received; opening modal");
      setShow(true);
    };
    console.log(
      "[nostr-sign-modal] mounted; listening for",
      NostrKey.NOSTR_PRIVATE_KEY_REQUEST_EVENT
    );
    window.addEventListener(
      NostrKey.NOSTR_PRIVATE_KEY_REQUEST_EVENT,
      onKeyRequested
    );
    return () =>
      window.removeEventListener(
        NostrKey.NOSTR_PRIVATE_KEY_REQUEST_EVENT,
        onKeyRequested
      );
  }, []);

  const onHide = useCallback(() => {
    setShow(false);
    // Closing without a key aborts the signing that requested it
    NostrKey.cancelPrivateKeyRequests();
  }, []);

  const onSubmit = useCallback(({ value }) => {
    NostrKey.providePrivateKey(value);
    setShow(false);
    toast.success("Private key loaded. Signing...");
  }, []);

  return (
    <NostrKeyModal
      show={show}
      onHide={onHide}
      description="Reconnect with your private key to sign this transaction."
      submitLabel="Sign"
      onSubmit={onSubmit}
    />
  );
};

export default NostrSignModal;
