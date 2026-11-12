import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import SearchPicker from "../components/SearchPicker.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [genreIds, setGenreIds] = useState([]);
  const [genres, setGenres] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/users/${user.username}`), api.get("/genres")])
      .then(([profile, genreData]) => {
        setBio(profile.bio);
        setAlbums(profile.favorites.albums);
        setArtists(profile.favorites.artists);
        setGenreIds(profile.favorites.genres.map((genre) => genre.id));
        setGenres(genreData.genres);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.username]);

  function toggleGenre(id) {
    setGenreIds((ids) => {
      if (ids.includes(id)) return ids.filter((genreId) => genreId !== id);
      return ids.length >= 5 ? ids : [...ids, id];
    });
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await api.put("/me/profile", {
        bio,
        favorite_album_ids: albums.map((album) => album.id),
        favorite_artist_ids: artists.map((artist) => artist.id),
        favorite_genre_ids: genreIds,
      });
      navigate(`/users/${user.username}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <p className="status">Loading...</p>;

  return (
    <div className="settings">
      <h1 className="page-title">Edit profile</h1>

      <section className="panel">
        <h2>Bio</h2>
        <textarea
          value={bio}
          maxLength={500}
          rows={3}
          placeholder="Tell people about your taste in music"
          onChange={(event) => setBio(event.target.value)}
        />
      </section>

      <section className="panel">
        <h2>Favorite albums</h2>
        <SearchPicker
          selected={albums}
          onChange={setAlbums}
          search={(query) =>
            api
              .get(`/albums/search?q=${encodeURIComponent(query)}`)
              .then((data) => data.albums)
          }
          getLabel={(album) => `${album.title} — ${album.artist?.name ?? ""}`}
          getImage={(album) => album.cover}
          placeholder={
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232c3440'/%3E%3Ccircle cx='50' cy='50' r='30' fill='%2314181c'/%3E%3Ccircle cx='50' cy='50' r='6' fill='%23678'/%3E%3C/svg%3E"
          }
          max={5}
        />
      </section>

      <section className="panel">
        <h2>Favorite artists</h2>
        <SearchPicker
          selected={artists}
          onChange={setArtists}
          search={(query) =>
            api
              .get(`/artists/search?q=${encodeURIComponent(query)}`)
              .then((data) => data.artists)
          }
          getLabel={(artist) => artist.name}
          getImage={(artist) => artist.picture}
          placeholder={
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232c3440'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23678'/%3E%3Cellipse cx='50' cy='90' rx='32' ry='26' fill='%23678'/%3E%3C/svg%3E"
          }
          max={5}
          round
        />
      </section>

      <section className="panel">
        <h2>Favorite genres</h2>
        <p className="muted small">
          {genreIds.length}/{5} picked
        </p>
        <div className="chips">
          {genres.map((genre) => {
            const selected = genreIds.includes(genre.id);
            return (
              <button
                key={genre.id}
                type="button"
                className={`chip${selected ? " selected" : ""}`}
                onClick={() => toggleGenre(genre.id)}
                disabled={!selected && genreIds.length >= 5}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </section>

      {error && <p className="error">{error}</p>}
      <div className="settings-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </div>
    </div>
  );
}
