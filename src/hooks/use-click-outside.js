import { useCallback, useEffect, useRef } from "react";

export default (onClose) => {
  const ref = useRef(null);
  const escapeListener = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );
  const clickListener = useCallback(
    (e) => {
      if (!ref.current?.contains(e.target)) {
        onClose?.();
      }
    },
    [onClose, ref]
  );
  useEffect(() => {
    document.addEventListener("click", clickListener);
    document.addEventListener("keyup", escapeListener);
    return () => {
      document.removeEventListener("click", clickListener);
      document.removeEventListener("keyup", escapeListener);
    };
  }, [escapeListener, clickListener]);
  return ref;
};
