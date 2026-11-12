import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import AlbumGrid from "../components/AlbumGrid.jsx";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    setResults(null);
    setError("");
    const q = encodeURIComponent(query);
    Promise.all([
      api.get(`/albums/search?q=${q}`),
      api.get(`/artists/search?q=${q}`),
    ])
      .then(([albumData, artistData]) => {
        if (!cancelled)
          setResults({ albums: albumData.albums, artists: artistData.artists });
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (!query)
    return <p className="status">Type something in the search bar.</p>;

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
                  <Link
                    key={artist.id}
                    to={`/artists/${artist.id}`}
                    className="artist-card"
                  >
                    <img
                      src={
                        artist.picture ||
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232c3440'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23678'/%3E%3Cellipse cx='50' cy='90' rx='32' ry='26' fill='%23678'/%3E%3C/svg%3E"
                      }
                      alt={artist.name}
                      loading="lazy"
                    />
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
  );
}
