import Image from "next/image";
import Button from "@ui/button";

const HeroArea = ({ onConnectHandler }: { onConnectHandler: () => void }) => (
    <div className="slider-one rn-section-gapTop">
        <div className="container">
            <div className="row row-reverce-sm align-items-center">
                <div className="col-lg-5 col-md-6 col-sm-12 mt_sm--50">
                    <h2 className="title">Keep your Ordinals secure and accessible with our Bitcoin web wallet.</h2>
                    <p className="slide-disc">
                        Manage your ordinals in a safe and convenient way with our wallet. Fully open source and
                        integrated with Nostr, Alby, (and soon OpenOrdex)
                    </p>
                    <div className="button-group">
                        <Button onClick={onConnectHandler}>Connect Wallet</Button>
                    </div>
                </div>
                <div className="col-lg-5 col-md-6 col-sm-12 offset-lg-1">
                    <div className="slider-thumbnail">
                        <Image
                            src="/images/slider/astralbabe.png"
                            alt="Astral babe inscription"
                            width={585}
                            height={593}
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default HeroArea;
