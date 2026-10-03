import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import ReviewCard from '../components/ReviewCard.jsx'
import StarRating from '../components/StarRating.jsx'
import { COVER_PLACEHOLDER, formatDuration, plural, yearOf } from '../utils.js'

export default function AlbumPage() {
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [reviews, setReviews] = useState([])
  const [error, setError] = useState('')
  const [rating, setRating] = useState(null)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const [albumData, reviewData] = await Promise.all([
      api.get(`/albums/${id}`),
      api.get(`/albums/${id}/reviews`),
    ])
    setAlbum(albumData)
    setReviews(reviewData.reviews)
    return albumData
  }, [id])

  useEffect(() => {
    setAlbum(null)
    setError('')
    setMessage('')
    load()
      .then((albumData) => {
        setRating(albumData.me.review?.rating ?? null)
        setBody(albumData.me.review?.body ?? '')
      })
      .catch((err) => setError(err.message))
  }, [load])

  async function saveReview(nextRating, nextBody) {
    setSaving(true)
    setMessage('')
    try {
      if (nextRating == null && !nextBody.trim()) {
        await api.del(`/albums/${id}/review`)
      } else {
        await api.put(`/albums/${id}/review`, { rating: nextRating, body: nextBody })
      }
      await load()
      setMessage('Saved!')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Clicking a star saves right away, keeping the review text that is already saved.
  function handleRate(value) {
    setRating(value)
    saveReview(value, album.me.review?.body ?? '')
  }

  async function toggle(kind, active) {
    try {
      if (active) await api.del(`/albums/${id}/${kind}`)
      else await api.post(`/albums/${id}/${kind}`)
      await load()
    } catch (err) {
      setMessage(err.message)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!album) return <p className="status">Loading...</p>

  const { stats, me } = album
  const average = stats.average_rating
  const details = [yearOf(album.release_date), album.genres.map((genre) => genre.name).join(', '), album.label]

  return (
    <>
      <section className="album-hero">
        <img className="album-cover" src={album.cover_xl || album.cover || COVER_PLACEHOLDER} alt={album.title} />
        <div className="album-info">
          <p className="muted small">{details.filter(Boolean).join(' · ')}</p>
          <h1>{album.title}</h1>
          <p className="album-artist">
            by <Link to={`/artists/${album.artist.id}`}>{album.artist.name}</Link>
          </p>

          <div className="album-stats">
            <div className="album-average">
              <StarRating value={average ? Math.round(average * 2) / 2 : 0} size="sm" />
              <strong>{average ? average.toFixed(1) : '–'}</strong>
              <span className="muted">({plural(stats.rating_count, 'rating')})</span>
            </div>
            <span className="muted">♥ {plural(stats.like_count, 'like')}</span>
            <span className="muted">{plural(stats.review_count, 'review')}</span>
          </div>

          <div className="album-actions">
            <button type="button" className={`btn${me.liked ? ' btn-liked' : ''}`} onClick={() => toggle('like', me.liked)}>
              {me.liked ? '♥ Liked' : '♡ Like'}
            </button>
            <button
              type="button"
              className={`btn${me.shelved ? ' btn-active' : ''}`}
              onClick={() => toggle('shelf', me.shelved)}
            >
              {me.shelved ? '✓ On your shelf' : '+ Add to shelf'}
            </button>
          </div>

          <div className="panel">
            <div className="your-rating">
              <h3>Your rating</h3>
              <StarRating value={rating} onChange={handleRate} size="lg" />
              {rating != null && (
                <button type="button" className="link-button small" onClick={() => handleRate(null)}>
                  Clear
                </button>
              )}
            </div>
            <textarea
              placeholder="Write your review..."
              value={body}
              maxLength={5000}
              rows={4}
              onChange={(event) => setBody(event.target.value)}
            />
            <div className="panel-footer">
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() => saveReview(rating, body)}
              >
                {saving ? 'Saving...' : me.review?.body ? 'Update review' : 'Save review'}
              </button>
              {message && <span className="muted small">{message}</span>}
            </div>
          </div>
        </div>
      </section>

      <div className="album-columns">
        <section>
          <h2 className="section-title">Reviews</h2>
          {reviews.length ? (
            reviews.map((review) => <ReviewCard key={`${review.id}-${review.updated_at}`} review={review} />)
          ) : (
            <p className="muted">No reviews yet. Be the first!</p>
          )}
        </section>
        <aside>
          <h2 className="section-title">Tracklist</h2>
          <ol className="tracklist">
            {album.tracks.map((track, index) => (
              <li key={track.id}>
                <span className="muted">{index + 1}.</span>
                <span className="track-title">{track.title}</span>
                <span className="muted">{formatDuration(track.duration)}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  )
}
