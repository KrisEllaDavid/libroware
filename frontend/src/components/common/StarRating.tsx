import React from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label, e.g. "4.2 out of 5 stars (12 reviews)" */
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

/** Star rating display, or interactive 1-5 picker when onChange is provided. */
const StarRating: React.FC<StarRatingProps> = ({ value, onChange, size = 'md', label }) => {
  const interactive = !!onChange;
  const starSize = sizeClasses[size];

  return (
    <div
      className={interactive ? 'inline-flex items-center -ml-0.5' : 'inline-flex items-center gap-0.5'}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={label || `${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const starEl = (
          <svg
            className={`${starSize} transition-colors duration-150 ${
              filled ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.363 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
          </svg>
        );

        if (!interactive) {
          return <span key={star}>{starEl}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === Math.round(value)}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onClick={() => onChange?.(star)}
            /* A touch target you can actually hit: the star glyph alone is
               16-20px, well under the 24px minimum, so the padding does the
               work while the visual size stays the same. */
            className="rounded-md p-0.5 transition-transform duration-150 ease-spring hover:scale-110 active:scale-95"
          >
            {starEl}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
