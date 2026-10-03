from . import deezer
from .extensions import db
from .models import Album, AlbumLike, FavoriteAlbum, FavoriteArtist, FavoriteGenre, Review, ShelfItem

SECTION_SIZE = 12


def get_or_create_album(album_id):
    """Return the local copy of a Deezer album, fetching and saving it the first time."""
    album = db.session.get(Album, album_id)
    if album:
        return album

    data = deezer.get_album(album_id)
    genre = data["genres"][0] if data["genres"] else None
    album = Album(
        id=data["id"],
        title=data["title"],
        artist_id=data["artist"]["id"],
        artist_name=data["artist"]["name"],
        cover_url=data["cover"],
        genre_id=genre["id"] if genre else None,
        genre_name=genre["name"] if genre else None,
        release_date=data["release_date"],
    )
    db.session.add(album)
    return album


def build_recommendations(user_id):
    """Album rows for the home page, based on the user's favorite artists and genres."""
    # Skip albums the user already knows about.
    seen = set()
    for model in (Review, AlbumLike, ShelfItem, FavoriteAlbum):
        rows = db.session.query(model.album_id).filter(model.user_id == user_id)
        seen.update(row.album_id for row in rows)

    sections = []

    def add_section(title, albums):
        picked = []
        for album in albums:
            if album["id"] in seen:
                continue
            seen.add(album["id"])  # also avoids repeating an album in two rows
            picked.append(album)
            if len(picked) == SECTION_SIZE:
                break
        if picked:
            sections.append({"title": title, "albums": picked})

    artists = FavoriteArtist.query.filter_by(user_id=user_id).order_by(FavoriteArtist.position)
    for artist in artists:
        try:
            albums = deezer.get_artist_albums(artist.artist_id, {"id": artist.artist_id, "name": artist.name})
        except deezer.DeezerError:
            continue
        add_section(f"More from {artist.name}", [a for a in albums if a["record_type"] == "album"])

    for genre in FavoriteGenre.query.filter_by(user_id=user_id):
        try:
            albums = deezer.get_chart_albums(genre.genre_id, limit=50)
        except deezer.DeezerError:
            continue
        add_section(f"Popular in {genre.name}", albums)

    if not sections:
        add_section("Popular right now", deezer.get_chart_albums(0, limit=50))

    return sections
