from flask import Blueprint, request

from .. import deezer
from ..utils import require_login

bp = Blueprint("artists", __name__, url_prefix="/api")
require_login(bp)


@bp.get("/artists/search")
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return {"artists": []}
    return {"artists": deezer.search_artists(query)}


@bp.get("/artists/<int:artist_id>")
def detail(artist_id):
    artist = deezer.get_artist(artist_id)
    albums = deezer.get_artist_albums(artist_id, artist)
    artist["albums"] = [album for album in albums if album["record_type"] != "single"]
    return artist


@bp.get("/genres")
def genres():
    return {"genres": deezer.get_genres()}
