import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import AlbumGrid from '../components/AlbumGrid.jsx'
import ReviewCard from '../components/ReviewCard.jsx'
import { ARTIST_PLACEHOLDER } from '../utils.js'

const TABS = [
  { key: 'reviews', label: 'Reviews' },
  { key: 'likes', label: 'Likes' },
  { key: 'shelf', label: 'Shelf' },
]

export default function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('reviews')
  const [tabData, setTabData] = useState(null)

  useEffect(() => {
    let cancelled = false
    setProfile(null)
    setError('')
    setTab('reviews')
    api
      .get(`/users/${username}`)
      .then((data) => !cancelled && setProfile(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [username])

  useEffect(() => {
    let cancelled = false
    setTabData(null)
    api
      .get(`/users/${username}/${tab}`)
      .then((data) => !cancelled && setTabData({ tab, items: data.reviews || data.albums }))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [username, tab])

  if (error) return <p className="error">{error}</p>
  if (!profile) return <p className="status">Loading...</p>

  const { favorites, stats } = profile

  return (
    <>
      <section className="profile-header">
        <div className="avatar avatar-lg">{profile.username[0].toUpperCase()}</div>
        <div className="profile-info">
          <h1>{profile.username}</h1>
          {profile.bio && <p>{profile.bio}</p>}
          {profile.is_me && (
            <Link to="/settings" className="btn btn-small">
              Edit profile
            </Link>
          )}
        </div>
        <div className="profile-stats">
          <div>
            <strong>{stats.reviews}</strong>
            <span>Albums rated</span>
          </div>
          <div>
            <strong>{stats.likes}</strong>
            <span>Likes</span>
          </div>
          <div>
            <strong>{stats.shelf}</strong>
            <span>Shelf</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Favorite albums</h2>
        <AlbumGrid albums={favorites.albums} empty="No favorite albums yet." />
      </section>

      <div className="profile-columns">
        <section className="section">
          <h2 className="section-title">Favorite artists</h2>
          {favorites.artists.length ? (
            <div className="artist-row">
              {favorites.artists.map((artist) => (
                <Link key={artist.id} to={`/artists/${artist.id}`} className="artist-card">
                  <img src={artist.picture || ARTIST_PLACEHOLDER} alt={artist.name} loading="lazy" />
                  <span>{artist.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">No favorite artists yet.</p>
          )}
        </section>
        <section className="section">
          <h2 className="section-title">Favorite genres</h2>
          {favorites.genres.length ? (
            <div className="chips">
              {favorites.genres.map((genre) => (
                <span key={genre.id} className="chip">
                  {genre.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">No favorite genres yet.</p>
          )}
        </section>
      </div>

      <nav className="tabs">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={tab === item.key ? 'active' : ''}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tabData?.tab !== tab ? (
        <p className="status">Loading...</p>
      ) : tab === 'reviews' ? (
        tabData.items.length ? (
          tabData.items.map((review) => <ReviewCard key={review.id} review={review} showAlbum />)
        ) : (
          <p className="muted">No reviews yet.</p>
        )
      ) : (
        <AlbumGrid albums={tabData.items} empty={tab === 'likes' ? 'No liked albums yet.' : 'The shelf is empty.'} />
      )}
    </>
  )
}
