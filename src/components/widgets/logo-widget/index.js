import PropTypes from "prop-types";
import Logo from "@components/logo";
import Anchor from "@ui/anchor";

const LogoWidget = ({ data }) => (
    <div className="footer-left">
        <Logo logo={data.logo} path="https://deezy.io" />
        {/* {data?.text && <p className="rn-footer-describe">{data.text}</p>} */}
        <div className="rn-footer-describe">
            Launch your own collection in collaboration with{" "}
            <Anchor path="https://deezy.io" target="_blank">
                Deezy
            </Anchor>
        </div>
    </div>
);

LogoWidget.propTypes = {
    data: PropTypes.shape({
        logo: PropTypes.arrayOf(
            PropTypes.shape({
                src: PropTypes.string.isRequired,
                alt: PropTypes.string,
            })
        ),
        text: PropTypes.string,
    }),
};

export default LogoWidget;
