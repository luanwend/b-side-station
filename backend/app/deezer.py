"""Small client for the public Deezer API (https://developers.deezer.com/api).

No API key is needed. Deezer does not send CORS headers, so the browser
cannot call it directly: the React app goes through these Flask routes.
"""

import time

import requests

BASE_URL = "https://api.deezer.com"
CACHE_TTL_SECONDS = 15 * 60
MAX_CACHE_ENTRIES = 1000

_session = requests.Session()
_session.headers.update({"Accept-Language": "en"})  # English genre names
_cache = {}


class DeezerError(Exception):
    def __init__(self, message, not_found=False):
        super().__init__(message)
        self.not_found = not_found


def _get(path, **params):
    key = (path, tuple(sorted(params.items())))
    cached = _cache.get(key)
    if cached and cached[0] > time.time():
        return cached[1]

    try:
        response = _session.get(BASE_URL + path, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise DeezerError("Could not reach the Deezer API.") from exc

    # Deezer reports errors with HTTP 200 and an "error" object.
    if isinstance(data, dict) and "error" in data:
        error = data["error"]
        not_found = error.get("code") == 800
        message = "Not found on Deezer." if not_found else error.get("message", "Deezer API error.")
        raise DeezerError(message, not_found=not_found)

    if len(_cache) >= MAX_CACHE_ENTRIES:
        _cache.clear()
    _cache[key] = (time.time() + CACHE_TTL_SECONDS, data)
    return data


def _image(url):
    # Items without an image come back with an empty hash, like ".../images/cover//500x500-...jpg".
    return url if url and "//" not in url.split("://", 1)[-1] else None


def album_summary(raw, artist=None):
    artist = raw.get("artist") or artist or {}
    return {
        "id": raw["id"],
        "title": raw.get("title"),
        "cover": _image(raw.get("cover_big")),
        "artist": {"id": artist.get("id"), "name": artist.get("name")},
        "release_date": raw.get("release_date"),
        "record_type": raw.get("record_type"),
    }


def artist_summary(raw):
    return {
        "id": raw["id"],
        "name": raw.get("name"),
        "picture": _image(raw.get("picture_medium")),
        "fans": raw.get("nb_fan"),
    }


def search_albums(query, limit=24):
    data = _get("/search/album", q=query, limit=limit)
    return [album_summary(album) for album in data.get("data", [])]


def search_artists(query, limit=12):
    data = _get("/search/artist", q=query, limit=limit)
    return [artist_summary(artist) for artist in data.get("data", [])]


def get_album(album_id):
    raw = _get(f"/album/{album_id}")
    genres = raw.get("genres", {}).get("data", [])
    return {
        **album_summary(raw),
        "cover_xl": _image(raw.get("cover_xl")),
        "label": raw.get("label"),
        "duration": raw.get("duration"),
        "nb_tracks": raw.get("nb_tracks"),
        "genres": [{"id": genre["id"], "name": genre["name"]} for genre in genres],
    }


def get_album_tracks(album_id):
    # The album endpoint only embeds the first 25 tracks, so ask for them separately.
    data = _get(f"/album/{album_id}/tracks", limit=100)
    return [
        {
            "id": track["id"],
            "title": track.get("title"),
            "duration": track.get("duration"),
            "position": track.get("track_position"),
            "disk": track.get("disk_number"),
        }
        for track in data.get("data", [])
    ]


def get_artist(artist_id):
    raw = _get(f"/artist/{artist_id}")
    return {**artist_summary(raw), "nb_album": raw.get("nb_album")}


def get_artist_albums(artist_id, artist):
    """Albums of an artist, most popular first. `artist` is {"id", "name"}."""
    data = _get(f"/artist/{artist_id}/albums", limit=100)
    albums = sorted(data.get("data", []), key=lambda album: album.get("fans", 0), reverse=True)
    return [album_summary(album, artist) for album in albums]


def get_genres():
    data = _get("/genre")
    return [
        {"id": genre["id"], "name": genre["name"], "picture": genre.get("picture_medium")}
        for genre in data.get("data", [])
        if genre["id"] != 0  # 0 is "All"
    ]


def get_chart_albums(genre_id=0, limit=25):
    data = _get(f"/chart/{genre_id}/albums", limit=limit)
    return [album_summary(album) for album in data.get("data", [])]
