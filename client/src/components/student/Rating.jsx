import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const Rating = ({ initialRating = 0, onRate, readOnly = false, size = 'md' }) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const handleClick = (value) => {
    if (!readOnly) {
      setRating(value);
      if (onRate) onRate(value);
    }
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${sizeClasses[size]} transition-colors ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'} ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          disabled={readOnly}
        >
          ★
        </button>
      ))}
    </div>
  );
};

Rating.propTypes = {
  initialRating: PropTypes.number,
  onRate: PropTypes.func,
  readOnly: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default Rating;