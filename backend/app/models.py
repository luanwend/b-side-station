from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db


def utcnow():
    # Stored as naive UTC because MySQL DATETIME has no time zone.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(value):
    return value.isoformat() + "Z" if value else None


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.String(500), nullable=False, default="")
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, private=False):
        data = {
            "id": self.id,
            "username": self.username,
            "bio": self.bio,
            "created_at": iso(self.created_at),
        }
        if private:
            data["email"] = self.email
        return data


class Album(db.Model):
    """Local copy of the Deezer albums that users interacted with."""

    __tablename__ = "albums"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=False)  # Deezer album id
    title = db.Column(db.String(255), nullable=False)
    artist_id = db.Column(db.BigInteger)
    artist_name = db.Column(db.String(255))
    cover_url = db.Column(db.String(255))
    genre_id = db.Column(db.Integer)
    genre_name = db.Column(db.String(100))
    release_date = db.Column(db.String(10))

    def to_dict(self):
        # Same shape as deezer.album_summary(), so the frontend can treat both alike.
        return {
            "id": self.id,
            "title": self.title,
            "cover": self.cover_url,
            "artist": {"id": self.artist_id, "name": self.artist_name},
            "release_date": self.release_date,
        }


class Review(db.Model):
    """One entry per user and album: a star rating, a written review, or both."""

    __tablename__ = "reviews"
    __table_args__ = (db.UniqueConstraint("user_id", "album_id", name="uq_review_user_album"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    album_id = db.Column(db.BigInteger, db.ForeignKey("albums.id"), nullable=False, index=True)
    rating = db.Column(db.Numeric(2, 1))  # 0.5 to 5.0
    body = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = db.relationship("User")
    album = db.relationship("Album")
    likes = db.relationship("ReviewLike", cascade="all, delete-orphan")
    replies = db.relationship("Reply", cascade="all, delete-orphan")

    def to_dict(self, viewer_id=None, include_album=False):
        data = {
            "id": self.id,
            "rating": float(self.rating) if self.rating is not None else None,
            "body": self.body,
            "created_at": iso(self.created_at),
            "updated_at": iso(self.updated_at),
            "user": {"id": self.user.id, "username": self.user.username},
            "like_count": len(self.likes),
            "liked_by_me": any(like.user_id == viewer_id for like in self.likes),
            "reply_count": len(self.replies),
        }
        if include_album:
            data["album"] = self.album.to_dict()
        return data


class ReviewLike(db.Model):
    __tablename__ = "review_likes"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey("reviews.id"), primary_key=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)


class Reply(db.Model):
    __tablename__ = "replies"

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey("reviews.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    user = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "review_id": self.review_id,
            "body": self.body,
            "created_at": iso(self.created_at),
            "user": {"id": self.user.id, "username": self.user.username},
        }


class AlbumLike(db.Model):
    __tablename__ = "album_likes"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    album_id = db.Column(db.BigInteger, db.ForeignKey("albums.id"), primary_key=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    album = db.relationship("Album")


class ShelfItem(db.Model):
    """The user's "listen later" list."""

    __tablename__ = "shelf_items"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    album_id = db.Column(db.BigInteger, db.ForeignKey("albums.id"), primary_key=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    album = db.relationship("Album")


class FavoriteAlbum(db.Model):
    __tablename__ = "favorite_albums"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    album_id = db.Column(db.BigInteger, db.ForeignKey("albums.id"), primary_key=True)
    position = db.Column(db.Integer, nullable=False)

    album = db.relationship("Album")


class FavoriteArtist(db.Model):
    __tablename__ = "favorite_artists"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    artist_id = db.Column(db.BigInteger, primary_key=True, autoincrement=False)  # Deezer artist id
    name = db.Column(db.String(255), nullable=False)
    picture_url = db.Column(db.String(255))
    position = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {"id": self.artist_id, "name": self.name, "picture": self.picture_url}


class FavoriteGenre(db.Model):
    __tablename__ = "favorite_genres"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    genre_id = db.Column(db.Integer, primary_key=True, autoincrement=False)  # Deezer genre id
    name = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"id": self.genre_id, "name": self.name}
