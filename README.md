# B-Side Station

B-Side Station is a study project inspired by [Letterboxd](https://letterboxd.com), but for music albums. It has a Flask API with a MySQL database and a React frontend. Album data and cover art come from the free [Deezer API](https://developers.deezer.com/api).

## Features

- **Accounts:** sign up, log in and log out. Login uses JWT tokens.
- **Albums:** search albums and artists, and open an album page with its cover, genres, label and tracklist.
- **Ratings:** rate albums from 0.5 to 5 stars, in half-star steps.
- **Reviews:** write a review for an album, edit it later, or delete it.
- **Likes and shelf:** like an album, or add it to your **shelf** (a "listen later" list).
- **Social:** everyone can see everyone's ratings and reviews. Other users can like reviews and reply to them.
- **Profile:** pick up to 5 favorite albums, up to 5 favorite artists and up to 5 favorite genres. Each profile also has Reviews, Likes and Shelf tabs.
- **Recommendations:** the home page suggests albums based on your favorite artists and genres. It also shows the latest community reviews.

## Tech stack

| Part     | Tools                                                                                   |
| -------- | --------------------------------------------------------------------------------------- |
| Backend  | Python 3.12, Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended, PyMySQL, requests           |
| Database | MySQL 8                                                                                 |
| Frontend | React 19, React Router 7, Vite, plain CSS                                               |
| Data     | [Deezer API](https://developers.deezer.com/api): free, no API key needed                |

### Why the Deezer API?

- It is free and needs no API key or account.
- It returns cover images in 4 sizes, from 56 px to 1000 px.
- It covers everything this app needs: album search, album details with tracks, artist search, an artist's albums, a genre list, and the top albums for each genre.

Things to know about it:

- **No CORS headers.** The browser cannot call Deezer directly, so every call goes through Flask (`app/deezer.py`).
- **Rate limit of about 50 requests per 5 seconds.** The backend keeps responses in a 15-minute in-memory cache.
- **Errors come back as HTTP 200** with an `error` field. The client turns them into proper 404/502 responses.
- **Charts and genres depend on your country.** They are based on the server's location.
- **No commercial use** without an agreement with Deezer. That's fine for a study project.

## Getting started

### Prerequisites

- Python 3.12+
- Node.js 20+
- A running MySQL 8 server, plus a user that can create databases (for example `root`)

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set your MySQL user and password:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/album_review?charset=utf8mb4
JWT_SECRET_KEY=any-long-random-string-with-at-least-32-chars
```

Create the database and the tables. Only run this once; it is safe to run again.

```bash
python init_db.py
```

Start the API on http://127.0.0.1:5000:

```bash
python run.py
```

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and create an account. During development, Vite forwards every `/api` request to Flask (see `vite.config.js`).

## Project structure

```
album_review/
├── backend/
│   ├── app/
│   │   ├── __init__.py        # create_app(): config, extensions, blueprints
│   │   ├── config.py          # reads .env
│   │   ├── extensions.py      # SQLAlchemy + JWT objects
│   │   ├── models.py          # database tables
│   │   ├── deezer.py          # Deezer API client (with cache)
│   │   ├── services.py        # album cache + recommendations
│   │   ├── utils.py           # login check, helpers
│   │   └── routes/            # auth, albums, artists, reviews, users, home
│   ├── init_db.py             # creates the database and tables
│   ├── run.py                 # starts the dev server
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api.js             # fetch wrapper that sends the JWT
    │   ├── context/           # AuthContext (logged-in user)
    │   ├── components/        # Navbar, StarRating, AlbumCard, ReviewCard, SearchPicker...
    │   ├── pages/             # Home, Search, AlbumPage, ArtistPage, Profile, EditProfile, Login, Register
    │   └── index.css          # dark theme
    └── vite.config.js
```

## Data model

| Table              | What it stores                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `users`            | username, email, password hash, bio                                                                    |
| `albums`           | a local copy of the Deezer albums that users interacted with (the id is the Deezer album id)           |
| `reviews`          | one row per user and album: `rating` (0.5–5, optional) and `body` (text, optional), with at least one of the two |
| `review_likes`     | who liked which review                                                                                 |
| `replies`          | replies to reviews                                                                                     |
| `album_likes`      | liked albums                                                                                           |
| `shelf_items`      | albums on the user's shelf                                                                             |
| `favorite_albums`  | up to 5 per user, ordered                                                                              |
| `favorite_artists` | up to 5 per user (Deezer artist id, name and picture)                                                  |
| `favorite_genres`  | up to 5 per user (Deezer genre id and name)                                                            |

The tables are created with `db.create_all()`; the project uses no migrations, to keep it simple. If you change a model, drop the database and run `python init_db.py` again.

## API

All routes start with `/api`. Every route except `register` and `login` needs the header `Authorization: Bearer <token>`.

| Method          | Route                          | Description                                                                 |
| --------------- | ------------------------------ | --------------------------------------------------------------------------- |
| POST            | `/auth/register`               | Create an account and return `{token, user}`                                 |
| POST            | `/auth/login`                  | Log in with username (or email) and password                                |
| GET             | `/auth/me`                     | The logged-in user                                                          |
| GET             | `/albums/search?q=`            | Search albums on Deezer                                                     |
| GET             | `/albums/<id>`                 | Album details, tracks, community stats and your own rating, like and shelf status |
| GET             | `/albums/<id>/reviews`         | Written reviews of the album                                                |
| PUT / DELETE    | `/albums/<id>/review`          | Save (`{rating, body}`) or delete your rating and review                    |
| POST / DELETE   | `/albums/<id>/like`            | Like or unlike an album                                                     |
| POST / DELETE   | `/albums/<id>/shelf`           | Add an album to your shelf or remove it                                     |
| POST / DELETE   | `/reviews/<id>/like`           | Like or unlike a review                                                     |
| GET / POST      | `/reviews/<id>/replies`        | List the replies to a review, or add one                                    |
| DELETE          | `/replies/<id>`                | Delete one of your replies                                                  |
| GET             | `/artists/search?q=`           | Search artists on Deezer                                                    |
| GET             | `/artists/<id>`                | Artist info and albums                                                      |
| GET             | `/genres`                      | Deezer genre list                                                           |
| GET             | `/users/<username>`            | Profile, favorites and counts                                               |
| GET             | `/users/<username>/reviews`    | The user's ratings and reviews                                              |
| GET             | `/users/<username>/likes`      | The user's liked albums                                                     |
| GET             | `/users/<username>/shelf`      | The albums on the user's shelf                                              |
| PUT             | `/me/profile`                  | Update the bio and favorites (`favorite_album_ids`, `favorite_artist_ids`, `favorite_genre_ids`, max 5 each) |
| GET             | `/home`                        | Recommendation rows and recent reviews                                      |

## How recommendations work

`build_recommendations()` in `backend/app/services.py`:

1. Collects the albums you already know: the ones you rated, reviewed, liked, shelved or picked as favorites. These are never recommended.
2. For each **favorite artist**, it adds a "More from {artist}" row: that artist's studio albums, sorted by Deezer fans.
3. For each **favorite genre**, it adds a "Popular in {genre}" row with Deezer's top albums for that genre.
4. If you have no favorites yet, it shows a single "Popular right now" row from the global chart instead.

An album never shows up in two rows.

## Ideas to extend

- Pagination for reviews and lists
- Recommendations from related artists (`/artist/{id}/related` on Deezer)
- Profile pictures
- Following other users and a friends' activity feed
- Automated tests (pytest + Vitest)
- Database migrations with Flask-Migrate
