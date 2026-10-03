from flask import Blueprint, request

from .. import deezer
from ..extensions import db
from ..models import AlbumLike, FavoriteAlbum, FavoriteArtist, FavoriteGenre, Review, ShelfItem, User
from ..services import get_or_create_album
from ..utils import current_user_id, parse_id_list, require_login

bp = Blueprint("users", __name__, url_prefix="/api")
require_login(bp)

MAX_FAVORITES = 5


def profile_dict(user):
    favorite_albums = FavoriteAlbum.query.filter_by(user_id=user.id).order_by(FavoriteAlbum.position)
    favorite_artists = FavoriteArtist.query.filter_by(user_id=user.id).order_by(FavoriteArtist.position)
    favorite_genres = FavoriteGenre.query.filter_by(user_id=user.id).order_by(FavoriteGenre.name)
    return {
        **user.to_dict(),
        "is_me": user.id == current_user_id(),
        "favorites": {
            "albums": [favorite.album.to_dict() for favorite in favorite_albums],
            "artists": [favorite.to_dict() for favorite in favorite_artists],
            "genres": [favorite.to_dict() for favorite in favorite_genres],
        },
        "stats": {
            "reviews": Review.query.filter_by(user_id=user.id).count(),
            "likes": AlbumLike.query.filter_by(user_id=user.id).count(),
            "shelf": ShelfItem.query.filter_by(user_id=user.id).count(),
        },
    }


def find_user(username):
    return User.query.filter_by(username=username).first()


@bp.get("/users/<username>")
def profile(username):
    user = find_user(username)
    if not user:
        return {"error": "User not found."}, 404
    return profile_dict(user)


@bp.get("/users/<username>/reviews")
def user_reviews(username):
    user = find_user(username)
    if not user:
        return {"error": "User not found."}, 404
    items = Review.query.filter_by(user_id=user.id).order_by(Review.updated_at.desc()).limit(100)
    viewer_id = current_user_id()
    return {"reviews": [review.to_dict(viewer_id, include_album=True) for review in items]}


@bp.get("/users/<username>/likes")
def user_likes(username):
    user = find_user(username)
    if not user:
        return {"error": "User not found."}, 404
    items = AlbumLike.query.filter_by(user_id=user.id).order_by(AlbumLike.created_at.desc())
    return {"albums": [item.album.to_dict() for item in items]}


@bp.get("/users/<username>/shelf")
def user_shelf(username):
    user = find_user(username)
    if not user:
        return {"error": "User not found."}, 404
    items = ShelfItem.query.filter_by(user_id=user.id).order_by(ShelfItem.created_at.desc())
    return {"albums": [item.album.to_dict() for item in items]}


@bp.put("/me/profile")
def update_profile():
    """Update the bio and replace the favorite albums, artists and genres (max 5 each)."""
    user = db.session.get(User, current_user_id())
    data = request.get_json(silent=True) or {}

    try:
        album_ids = parse_id_list(data.get("favorite_album_ids"), MAX_FAVORITES, "albums")
        artist_ids = parse_id_list(data.get("favorite_artist_ids"), MAX_FAVORITES, "artists")
        genre_ids = parse_id_list(data.get("favorite_genre_ids"), MAX_FAVORITES, "genres")
    except ValueError as exc:
        return {"error": str(exc)}, 400

    genre_names = {genre["id"]: genre["name"] for genre in deezer.get_genres()}
    unknown = [genre_id for genre_id in genre_ids if genre_id not in genre_names]
    if unknown:
        return {"error": f"Unknown genre id: {unknown[0]}."}, 400

    # Fetch everything from Deezer before changing the database.
    albums = [get_or_create_album(album_id) for album_id in album_ids]
    artists = [deezer.get_artist(artist_id) for artist_id in artist_ids]

    user.bio = (data.get("bio") or "").strip()[:500]

    FavoriteAlbum.query.filter_by(user_id=user.id).delete()
    FavoriteArtist.query.filter_by(user_id=user.id).delete()
    FavoriteGenre.query.filter_by(user_id=user.id).delete()

    for position, album in enumerate(albums, start=1):
        db.session.add(FavoriteAlbum(user_id=user.id, album_id=album.id, position=position))
    for position, artist in enumerate(artists, start=1):
        db.session.add(
            FavoriteArtist(
                user_id=user.id,
                artist_id=artist["id"],
                name=artist["name"],
                picture_url=artist["picture"],
                position=position,
            )
        )
    for genre_id in genre_ids:
        db.session.add(FavoriteGenre(user_id=user.id, genre_id=genre_id, name=genre_names[genre_id]))

    db.session.commit()
    return profile_dict(user)
