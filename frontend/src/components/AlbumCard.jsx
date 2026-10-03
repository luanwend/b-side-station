import { Link } from 'react-router-dom'
import { COVER_PLACEHOLDER, yearOf } from '../utils.js'

export default function AlbumCard({ album }) {
  return (
    <Link to={`/albums/${album.id}`} className="album-card" title={`${album.title} — ${album.artist?.name ?? ''}`}>
      <img src={album.cover || COVER_PLACEHOLDER} alt={album.title} loading="lazy" />
      <span className="album-card-title">{album.title}</span>
      <span className="album-card-artist">
        {album.artist?.name}
        {album.release_date && ` · ${yearOf(album.release_date)}`}
      </span>
    </Link>
  )
}
