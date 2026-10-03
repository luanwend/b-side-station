from flask import Flask

from .config import Config
from .deezer import DeezerError
from .extensions import db, jwt


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)

    from . import models  # noqa: F401  (registers the tables)
    from .routes import albums, artists, auth, home, reviews, users

    for module in (auth, albums, artists, reviews, users, home):
        app.register_blueprint(module.bp)

    @app.errorhandler(DeezerError)
    def handle_deezer_error(error):
        return {"error": str(error)}, 404 if error.not_found else 502

    return app
