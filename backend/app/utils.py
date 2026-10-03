from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request


def require_login(blueprint):
    """Make every route of the blueprint require a valid JWT."""

    @blueprint.before_request
    def check_token():
        verify_jwt_in_request()


def current_user_id():
    return int(get_jwt_identity())


def parse_id_list(values, limit, label):
    """Turn a list of ids into unique ints (keeping order). Raises ValueError."""
    if values is None:
        return []
    try:
        ids = list(dict.fromkeys(int(value) for value in values))
    except (TypeError, ValueError):
        raise ValueError(f"Favorite {label} must be a list of ids.") from None
    if len(ids) > limit:
        raise ValueError(f"You can pick up to {limit} favorite {label}.")
    return ids
