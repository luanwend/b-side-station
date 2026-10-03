import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import AlbumGrid from '../components/AlbumGrid.jsx'
import ReviewCard from '../components/ReviewCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/home')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <>
      <section className="hero">
        <h1>Welcome back, {user.username}.</h1>
        <p className="muted">Here are some albums we think you'll like.</p>
      </section>

      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="status">Loading recommendations...</p>}

      {data && !data.personalized && (
        <p className="notice">
          Pick your favorite artists and genres in <Link to="/settings">Settings</Link> to get personal
          recommendations.
        </p>
      )}

      {data?.sections.map((section) => (
        <section key={section.title} className="section">
          <h2 className="section-title">{section.title}</h2>
          <AlbumGrid albums={section.albums} row />
        </section>
      ))}

      {data && (
        <section className="section">
          <h2 className="section-title">Recent reviews</h2>
          {data.recent_reviews.length ? (
            data.recent_reviews.map((review) => <ReviewCard key={review.id} review={review} showAlbum />)
          ) : (
            <p className="muted">No reviews yet. Find an album and write the first one!</p>
          )}
        </section>
      )}
    </>
  )
}
