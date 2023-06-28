import Countdown, { zeroPad } from "react-countdown";
import PropTypes from "prop-types";

// TODO: Callback on complete, to remove item from live biddin
const CountdownTimer = ({ time }) => {
    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) return null;
        return (
            <div className="countdown">
                {days > 0 && (
                    <div className="countdown-container days">
                        <span className="countdown-value">{days}</span>
                        <span className="countdown-heading">Days</span>
                    </div>
                )}
                {hours > 0 && (
                    <div className="countdown-container days">
                        <span className="countdown-value">{hours}</span>
                        <span className="countdown-heading">Hours</span>
                    </div>
                )}
                {minutes > 0 && (
                    <div className="countdown-container minutes">
                        <span className="countdown-value">{zeroPad(minutes)}</span>
                        <span className="countdown-heading">Minutes</span>
                    </div>
                )}

                <div className="countdown-container seconds">
                    <span className="countdown-value">{zeroPad(seconds)}</span>
                    <span className="countdown-heading">Seconds</span>
                </div>
            </div>
        );
    };
    if (!time) return null;
    return <Countdown date={new Date(time)} renderer={renderer} />;
};

CountdownTimer.propTypes = {
    time: PropTypes.number.isRequired,
};

export default CountdownTimer;
