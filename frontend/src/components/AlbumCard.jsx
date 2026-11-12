import { Link } from "react-router-dom";
import { yearOf } from "../utils.js";

export default function AlbumCard({ album }) {
  return (
    <Link
      to={`/albums/${album.id}`}
      className="album-card"
      title={`${album.title} — ${album.artist?.name ?? ""}`}
    >
      <img
        src={
          album.cover ||
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232c3440'/%3E%3Ccircle cx='50' cy='50' r='30' fill='%2314181c'/%3E%3Ccircle cx='50' cy='50' r='6' fill='%23678'/%3E%3C/svg%3E"
        }
        alt={album.title}
        loading="lazy"
      />
      <span className="album-card-title">{album.title}</span>
      <span className="album-card-artist">
        {album.artist?.name}
        {album.release_date && ` · ${yearOf(album.release_date)}`}
      </span>
    </Link>
  );
}
