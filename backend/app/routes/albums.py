from flask import Blueprint, request
from sqlalchemy import func

from .. import deezer
from ..extensions import db
from ..models import AlbumLike, Review, ShelfItem
from ..services import get_or_create_album
from ..utils import current_user_id, require_login

bp = Blueprint("albums", __name__, url_prefix="/api/albums")
require_login(bp)


@bp.get("/search")
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return {"albums": []}
    return {"albums": deezer.search_albums(query)}


@bp.get("/<int:album_id>")
def detail(album_id):
    user_id = current_user_id()
    album = deezer.get_album(album_id)
    album["tracks"] = deezer.get_album_tracks(album_id)

    average, rating_count = (
        db.session.query(func.avg(Review.rating), func.count(Review.rating))
        .filter(Review.album_id == album_id)
        .one()
    )
    album["stats"] = {
        "average_rating": round(float(average), 2) if average is not None else None,
        "rating_count": rating_count,
        "review_count": Review.query.filter(Review.album_id == album_id, Review.body.isnot(None)).count(),
        "like_count": AlbumLike.query.filter_by(album_id=album_id).count(),
    }

    my_review = Review.query.filter_by(user_id=user_id, album_id=album_id).first()
    album["me"] = {
        "review": my_review.to_dict(user_id) if my_review else None,
        "liked": db.session.get(AlbumLike, (user_id, album_id)) is not None,
        "shelved": db.session.get(ShelfItem, (user_id, album_id)) is not None,
    }
    return album


@bp.get("/<int:album_id>/reviews")
def reviews(album_id):
    user_id = current_user_id()
    items = (
        Review.query.filter(Review.album_id == album_id, Review.body.isnot(None))
        .order_by(Review.created_at.desc())
        .limit(50)
    )
    return {"reviews": [review.to_dict(user_id) for review in items]}


@bp.put("/<int:album_id>/review")
def save_review(album_id):
    """Create or update the user's rating and/or review for this album."""
    user_id = current_user_id()
    data = request.get_json(silent=True) or {}
    rating = data.get("rating")
    body = (data.get("body") or "").strip() or None

    if rating is not None:
        try:
            rating = float(rating)
        except (TypeError, ValueError):
            return {"error": "Rating must be a number."}, 400
        if not 0.5 <= rating <= 5 or (rating * 2) % 1 != 0:
            return {"error": "Rating must be between 0.5 and 5, in steps of 0.5."}, 400
    if rating is None and body is None:
        return {"error": "Add a rating or write a review."}, 400
    if body and len(body) > 5000:
        return {"error": "Reviews can have at most 5000 characters."}, 400

    get_or_create_album(album_id)
    review = Review.query.filter_by(user_id=user_id, album_id=album_id).first()
    if not review:
        review = Review(user_id=user_id, album_id=album_id)
        db.session.add(review)
    review.rating = rating
    review.body = body
    db.session.commit()
    return review.to_dict(user_id)


@bp.delete("/<int:album_id>/review")
def delete_review(album_id):
    review = Review.query.filter_by(user_id=current_user_id(), album_id=album_id).first()
    if review:
        db.session.delete(review)
        db.session.commit()
    return {"deleted": True}


def set_flag(model, album_id, active):
    """Add or remove a (user, album) row, used for likes and the shelf."""
    user_id = current_user_id()
    if active:
        get_or_create_album(album_id)
        if not db.session.get(model, (user_id, album_id)):
            db.session.add(model(user_id=user_id, album_id=album_id))
    else:
        model.query.filter_by(user_id=user_id, album_id=album_id).delete()
    db.session.commit()


@bp.post("/<int:album_id>/like")
def like(album_id):
    set_flag(AlbumLike, album_id, True)
    return {"liked": True}


@bp.delete("/<int:album_id>/like")
def unlike(album_id):
    set_flag(AlbumLike, album_id, False)
    return {"liked": False}


@bp.post("/<int:album_id>/shelf")
def add_to_shelf(album_id):
    set_flag(ShelfItem, album_id, True)
    return {"shelved": True}


@bp.delete("/<int:album_id>/shelf")
def remove_from_shelf(album_id):
    set_flag(ShelfItem, album_id, False)
    return {"shelved": False}
