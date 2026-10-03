import { useState } from 'react'

/**
 * Shows 0.5 to 5 stars. Pass `onChange` to make it clickable:
 * each star has a left half (x.5) and a right half (x.0).
 */
export default function StarRating({ value, onChange, size = 'md' }) {
  const [hover, setHover] = useState(null)
  const shown = hover ?? value ?? 0
  const interactive = Boolean(onChange)

  return (
    <div
      className={`stars stars-${size}${interactive ? ' interactive' : ''}`}
      onMouseLeave={() => setHover(null)}
      aria-label={value ? `${value} out of 5 stars` : 'Not rated'}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = shown >= star ? 'full' : shown >= star - 0.5 ? 'half' : 'empty'
        return (
          <span key={star} className={`star ${fill}`}>
            ★
            {interactive && (
              <>
                <button
                  type="button"
                  className="star-half left"
                  aria-label={`${star - 0.5} stars`}
                  onMouseEnter={() => setHover(star - 0.5)}
                  onClick={() => onChange(star - 0.5)}
                />
                <button
                  type="button"
                  className="star-half right"
                  aria-label={`${star} stars`}
                  onMouseEnter={() => setHover(star)}
                  onClick={() => onChange(star)}
                />
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}
