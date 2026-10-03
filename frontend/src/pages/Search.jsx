import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import AlbumGrid from '../components/AlbumGrid.jsx'
import { ARTIST_PLACEHOLDER } from '../utils.js'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!query) return
    let cancelled = false
    setResults(null)
    setError('')
    const q = encodeURIComponent(query)
    Promise.all([api.get(`/albums/search?q=${q}`), api.get(`/artists/search?q=${q}`)])
      .then(([albumData, artistData]) => {
        if (!cancelled) setResults({ albums: albumData.albums, artists: artistData.artists })
      })
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [query])

  if (!query) return <p className="status">Type something in the search bar.</p>

  return (
    <>
      <h1 className="page-title">Results for “{query}”</h1>
      {error && <p className="error">{error}</p>}
      {!results && !error && <p className="status">Searching...</p>}
      {results && (
        <>
          <section className="section">
            <h2 className="section-title">Artists</h2>
            {results.artists.length ? (
              <div className="artist-row">
                {results.artists.map((artist) => (
                  <Link key={artist.id} to={`/artists/${artist.id}`} className="artist-card">
                    <img src={artist.picture || ARTIST_PLACEHOLDER} alt={artist.name} loading="lazy" />
                    <span>{artist.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted">No artists found.</p>
            )}
          </section>
          <section className="section">
            <h2 className="section-title">Albums</h2>
            <AlbumGrid albums={results.albums} empty="No albums found." />
          </section>
        </>
      )}
    </>
  )
}
