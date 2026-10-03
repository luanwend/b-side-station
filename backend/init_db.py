"""Create the MySQL database (if it does not exist yet) and all the tables.

Run once before starting the app:  python init_db.py
"""

import pymysql
from sqlalchemy.engine import make_url

from app import create_app
from app.config import Config
from app.extensions import db


def create_database():
    url = make_url(Config.SQLALCHEMY_DATABASE_URI)
    if not url.drivername.startswith("mysql"):
        return
    connection = pymysql.connect(
        host=url.host or "localhost",
        port=url.port or 3306,
        user=url.username,
        password=url.password or "",
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{url.database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
    finally:
        connection.close()


if __name__ == "__main__":
    create_database()
    app = create_app()
    with app.app_context():
        db.create_all()
    print("Database and tables are ready.")
