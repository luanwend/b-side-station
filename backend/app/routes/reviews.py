from flask import Blueprint, request

from ..extensions import db
from ..models import Reply, Review, ReviewLike
from ..utils import current_user_id, require_login

bp = Blueprint("reviews", __name__, url_prefix="/api")
require_login(bp)


def find_review(review_id):
    return db.session.get(Review, review_id)


@bp.post("/reviews/<int:review_id>/like")
def like(review_id):
    user_id = current_user_id()
    review = find_review(review_id)
    if not review:
        return {"error": "Review not found."}, 404
    if not db.session.get(ReviewLike, (user_id, review_id)):
        db.session.add(ReviewLike(user_id=user_id, review_id=review_id))
        db.session.commit()
    return review.to_dict(user_id)


@bp.delete("/reviews/<int:review_id>/like")
def unlike(review_id):
    user_id = current_user_id()
    review = find_review(review_id)
    if not review:
        return {"error": "Review not found."}, 404
    ReviewLike.query.filter_by(user_id=user_id, review_id=review_id).delete()
    db.session.commit()
    return review.to_dict(user_id)


@bp.get("/reviews/<int:review_id>/replies")
def replies(review_id):
    items = Reply.query.filter_by(review_id=review_id).order_by(Reply.created_at)
    return {"replies": [reply.to_dict() for reply in items]}


@bp.post("/reviews/<int:review_id>/replies")
def add_reply(review_id):
    if not find_review(review_id):
        return {"error": "Review not found."}, 404
    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        return {"error": "Reply cannot be empty."}, 400
    if len(body) > 2000:
        return {"error": "Replies can have at most 2000 characters."}, 400

    reply = Reply(review_id=review_id, user_id=current_user_id(), body=body)
    db.session.add(reply)
    db.session.commit()
    return reply.to_dict(), 201


@bp.delete("/replies/<int:reply_id>")
def delete_reply(reply_id):
    reply = db.session.get(Reply, reply_id)
    if not reply:
        return {"error": "Reply not found."}, 404
    if reply.user_id != current_user_id():
        return {"error": "You can only delete your own replies."}, 403
    db.session.delete(reply)
    db.session.commit()
    return {"deleted": True}
