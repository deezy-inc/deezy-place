import Logo from "@components/logo";
import Anchor from "@ui/anchor";

const LogoWidget = ({ data }: LogoWidgetProps) => (
    <div className="footer-left">
        <Logo logo={data.logo} path="https://deezy.io" />
        <div className="rn-footer-describe">
            Launch your own collection in collaboration with{" "}
            <Anchor path="https://deezy.io" target="_blank">
                Deezy
            </Anchor>
        </div>
    </div>
);

interface LogoWidgetProps {
    data: {
        logo: {
            src: string;
            alt: string;
        }[];
    };
}

export default LogoWidget;
