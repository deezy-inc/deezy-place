import PropTypes from "prop-types";
// import Lottie from "lottie-react";
// import checkAnimation from "./loading-bar.json";
import { TailSpin } from "react-loading-icons";

const LoadingAnimation = () => {
  return <TailSpin stroke="#fec823" speed={0.75} />;
  //   return (
  //     <Lottie
  //       animationData={checkAnimation}
  //       loop
  //       style={{ height: 150 }}
  //       autoplay
  //     />
  //   );
};

LoadingAnimation.propTypes = {};

export default LoadingAnimation;
