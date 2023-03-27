import ScrollToTop from "@ui/scroll-to-top";
import { ToastContainer } from "react-toastify";
import { ReactNode } from "react";

const Wrapper = ({ children }: { children: ReactNode }) => (
    <>
        {children}
        <ScrollToTop />
        <ToastContainer theme="dark" autoClose={1500} pauseOnHover={false} pauseOnFocusLoss={false} />
    </>
);

export default Wrapper;
