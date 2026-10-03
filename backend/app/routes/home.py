from flask import Blueprint

from ..models import FavoriteArtist, FavoriteGenre, Review
from ..services import build_recommendations
from ..utils import current_user_id, require_login

bp = Blueprint("home", __name__, url_prefix="/api")
require_login(bp)


@bp.get("/home")
def home():
    user_id = current_user_id()
    recent = (
        Review.query.filter(Review.body.isnot(None))
        .order_by(Review.created_at.desc())
        .limit(10)
    )
    has_favorites = (
        FavoriteArtist.query.filter_by(user_id=user_id).first() is not None
        or FavoriteGenre.query.filter_by(user_id=user_id).first() is not None
    )
    return {
        "personalized": has_favorites,
        "sections": build_recommendations(user_id),
        "recent_reviews": [review.to_dict(user_id, include_album=True) for review in recent],
    }
