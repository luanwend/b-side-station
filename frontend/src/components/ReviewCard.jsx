import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { COVER_PLACEHOLDER, formatDate, plural, yearOf } from '../utils.js'
import StarRating from './StarRating.jsx'

export default function ReviewCard({ review: initialReview, showAlbum = false }) {
  const { user } = useAuth()
  const [review, setReview] = useState(initialReview)
  const [replies, setReplies] = useState(null)
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [error, setError] = useState('')
  const album = review.album

  async function toggleLike() {
    setError('')
    try {
      const path = `/reviews/${review.id}/like`
      setReview(review.liked_by_me ? await api.del(path) : await api.post(path))
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleReplies() {
    setError('')
    if (!showReplies && replies === null) {
      try {
        const data = await api.get(`/reviews/${review.id}/replies`)
        setReplies(data.replies)
      } catch (err) {
        setError(err.message)
        return
      }
    }
    setShowReplies(!showReplies)
  }

  async function sendReply(event) {
    event.preventDefault()
    if (!replyText.trim()) return
    setError('')
    try {
      const reply = await api.post(`/reviews/${review.id}/replies`, { body: replyText })
      setReplies([...replies, reply])
      setReview({ ...review, reply_count: review.reply_count + 1 })
      setReplyText('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteReply(replyId) {
    setError('')
    try {
      await api.del(`/replies/${replyId}`)
      setReplies(replies.filter((reply) => reply.id !== replyId))
      setReview({ ...review, reply_count: review.reply_count - 1 })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <article className="review-card">
      {showAlbum && album && (
        <Link to={`/albums/${album.id}`} className="review-cover">
          <img src={album.cover || COVER_PLACEHOLDER} alt={album.title} loading="lazy" />
        </Link>
      )}
      <div className="review-main">
        {showAlbum && album && (
          <h3 className="review-album-title">
            <Link to={`/albums/${album.id}`}>{album.title}</Link>{' '}
            <span className="muted">
              {album.artist?.name}
              {album.release_date && ` · ${yearOf(album.release_date)}`}
            </span>
          </h3>
        )}
        <div className="review-header">
          <Link to={`/users/${review.user.username}`} className="avatar avatar-sm">
            {review.user.username[0].toUpperCase()}
          </Link>
          <span className="muted">
            {review.body ? 'Review by' : 'Rated by'}{' '}
            <Link to={`/users/${review.user.username}`} className="username">
              {review.user.username}
            </Link>
          </span>
          {review.rating != null && <StarRating value={review.rating} size="sm" />}
          <span className="muted small">{formatDate(review.created_at)}</span>
        </div>

        {review.body && <p className="review-body">{review.body}</p>}

        {review.body && (
          <div className="review-actions">
            <button
              type="button"
              className={`link-button${review.liked_by_me ? ' liked' : ''}`}
              onClick={toggleLike}
            >
              ♥ {plural(review.like_count, 'like')}
            </button>
            <button type="button" className="link-button" onClick={toggleReplies}>
              {showReplies ? 'Hide replies' : plural(review.reply_count, 'reply', 'replies')}
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {showReplies && (
          <div className="replies">
            {replies.map((reply) => (
              <div key={reply.id} className="reply">
                <Link to={`/users/${reply.user.username}`} className="username">
                  {reply.user.username}
                </Link>
                <span className="muted small"> · {formatDate(reply.created_at)}</span>
                {reply.user.id === user.id && (
                  <button type="button" className="link-button small" onClick={() => deleteReply(reply.id)}>
                    Delete
                  </button>
                )}
                <p>{reply.body}</p>
              </div>
            ))}
            <form className="reply-form" onSubmit={sendReply}>
              <input
                placeholder="Write a reply..."
                value={replyText}
                maxLength={2000}
                onChange={(event) => setReplyText(event.target.value)}
              />
              <button type="submit" className="btn btn-small" disabled={!replyText.trim()}>
                Reply
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  )
}
