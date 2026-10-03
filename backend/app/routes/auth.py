import re

from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required

from ..extensions import db
from ..models import User
from ..utils import current_user_id

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,30}$")


def auth_response(user):
    token = create_access_token(identity=str(user.id))
    return {"token": token, "user": user.to_dict(private=True)}


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not USERNAME_RE.match(username):
        return {"error": "Username must have 3-30 letters, numbers or underscores."}, 400
    if "@" not in email or len(email) > 120:
        return {"error": "Please enter a valid email."}, 400
    if len(password) < 6:
        return {"error": "Password must have at least 6 characters."}, 400
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return {"error": "Username or email is already in use."}, 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return auth_response(user), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    login_name = (data.get("username") or "").strip()  # username or email
    password = data.get("password") or ""

    user = User.query.filter(
        (User.username == login_name) | (User.email == login_name.lower())
    ).first()
    if not user or not user.check_password(password):
        return {"error": "Invalid username or password."}, 401
    return auth_response(user)


@bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, current_user_id())
    if not user:
        return {"error": "User not found."}, 404
    return user.to_dict(private=True)
