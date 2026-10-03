import AlbumCard from './AlbumCard.jsx'

/** A wrapping grid of albums, or a single scrollable row when `row` is set. */
export default function AlbumGrid({ albums, row = false, empty = 'No albums here yet.' }) {
  if (!albums.length) return <p className="muted">{empty}</p>
  return (
    <div className={row ? 'album-row' : 'album-grid'}>
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  )
}
