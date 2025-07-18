import PropTypes from "prop-types";
import { Badge } from "react-bootstrap";

const RuneDisplay = ({ runes }) => {
  if (!runes || runes.length === 0) {
    return null;
  }

  const formatRuneAmount = (amount, divisibility) => {
    if (divisibility === 0) {
      return amount.toLocaleString();
    }
    
    const divisor = Math.pow(10, divisibility);
    const formattedAmount = (amount / divisor).toFixed(divisibility);
    
    // Remove trailing zeros after decimal
    return formattedAmount.replace(/\.?0+$/, '');
  };

  return (
    <div className="rune-display">
      {runes.map(([runeName, runeData], index) => (
        <div key={index} className="rune-item mb-2">
          <Badge 
            bg="warning" 
            text="dark" 
            className="rune-badge"
            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
          >
            <span className="rune-symbol me-1">{runeData.symbol}</span>
            <span className="rune-name">{runeName}</span>
            <span className="rune-amount ms-2">
              {formatRuneAmount(runeData.amount, runeData.divisibility)}
            </span>
          </Badge>
        </div>
      ))}
    </div>
  );
};

RuneDisplay.propTypes = {
  runes: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          amount: PropTypes.number.isRequired,
          divisibility: PropTypes.number.isRequired,
          symbol: PropTypes.string.isRequired,
        }),
      ])
    )
  ),
};

export default RuneDisplay; 