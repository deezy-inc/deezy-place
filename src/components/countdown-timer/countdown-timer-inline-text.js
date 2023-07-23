import Countdown, { zeroPad } from "react-countdown";
import PropTypes from "prop-types";

// TODO: Callback on complete, to remove item from live biddin
const CountdownTimerText = ({ time, className }) => {
  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) return null;
    const s = seconds < 10 ? `0${seconds}` : seconds;
    const m = minutes < 10 ? `0${minutes}` : minutes;
    const h = hours < 10 ? `0${hours}` : hours;

    return (
      <div>
        {Boolean(days) && <span>{`${days}${hours ? ":" : ""}`}</span>}
        {Boolean(hours) && <span>{`${h}${minutes ? ":" : ""}`}</span>}
        {Boolean(minutes) && <span>{`${m}${seconds ? ":" : ""}`}</span>}
        {Boolean(seconds) && <span>{s}</span>}
      </div>
    );
  };
  return <Countdown date={new Date(time)} renderer={renderer} />;
};

CountdownTimerText.propTypes = {
  time: PropTypes.number.isRequired,
  className: PropTypes.string,
};

export default CountdownTimerText;
