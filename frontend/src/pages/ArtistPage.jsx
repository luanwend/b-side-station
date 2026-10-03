import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api.js'
import AlbumGrid from '../components/AlbumGrid.jsx'
import { ARTIST_PLACEHOLDER } from '../utils.js'

export default function ArtistPage() {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setArtist(null)
    setError('')
    api
      .get(`/artists/${id}`)
      .then((data) => !cancelled && setArtist(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!artist) return <p className="status">Loading...</p>

  return (
    <>
      <section className="artist-header">
        <img src={artist.picture || ARTIST_PLACEHOLDER} alt={artist.name} />
        <div>
          <p className="muted small">ARTIST</p>
          <h1>{artist.name}</h1>
          {artist.fans != null && <p className="muted">{artist.fans.toLocaleString('en-US')} fans on Deezer</p>}
        </div>
      </section>
      <section className="section">
        <h2 className="section-title">Albums &amp; EPs</h2>
        <AlbumGrid albums={artist.albums} />
      </section>
    </>
  )
}
