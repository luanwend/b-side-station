# B-Side Station

#### Video Demo: https://youtu.be/fZxbhnZu-h8

#### Description:

B-Side Station is a full-stack web application for discovering, rating, and reviewing music albums. Users can create an account, search for albums and artists, record what they think about an album, and see opinions shared by other members of the community.

The application was built with React on the frontend and Flask on the backend. MySQL stores user accounts and all community activity, while the Deezer API supplies album, artist, genre, cover, and track information. This separation lets the project keep its own social data without maintaining a large catalog of music metadata.

## Main Features

After registering or logging in, a user can search for an album or artist and open a detailed page. An album page displays its cover, artist, genres, label, release information, and track list. The user can give the album a rating from 0.5 to 5 stars, write a review, like it, or add it to a shelf for later listening. Ratings and reviews can be changed or deleted.

The community side of the application allows users to read recent reviews, like reviews, and post replies. Every user also has a public profile containing a biography, reviews, liked albums, shelf items, and selected favorite albums, artists, and genres. The home page uses those favorites to create simple personalized recommendation rows. If the user has not chosen any favorites, the page displays popular albums instead.

Authentication uses JSON Web Tokens. Passwords are stored as hashes rather than plain text, and protected API routes require a valid token. The React application keeps the login state in a shared authentication context and includes the token in requests made to Flask.

## Project Files

The `backend` directory contains the Flask API. `run.py` starts the development server, while `init_db.py` creates the MySQL database and its tables. `requirements.txt` lists the Python dependencies required by the project.

Inside `backend/app`, `__init__.py` creates and configures the Flask application. `config.py` loads settings such as the database address and JWT secret from environment variables. `extensions.py` defines the shared SQLAlchemy and JWT objects, and `models.py` contains the database models for users, albums, reviews, replies, likes, shelf items, and favorites. `utils.py` contains small helpers shared by the API routes.

`deezer.py` is responsible for communication with the Deezer API. It validates Deezer responses and keeps them in a short in-memory cache. `services.py` contains higher-level application logic, including saving basic album information locally and building recommendations from a user's favorite artists and genres.

The `backend/app/routes` directory divides the API into focused Flask blueprints. `auth.py` handles registration, login, and the current user. `albums.py` handles album searches, album details, ratings, reviews, likes, and shelf actions. `artists.py` provides artist search and artist pages. `reviews.py` manages likes and replies on reviews. `users.py` provides public profiles and profile editing. Finally, `home.py` returns recommendations and recent community reviews.

The `frontend` directory contains the React interface. `package.json` lists its JavaScript dependencies and scripts, and `vite.config.js` configures the development server and forwards API requests to Flask. `index.html` is the page loaded by Vite.

Inside `frontend/src`, `main.jsx` starts React and `App.jsx` defines the application routes. `api.js` is a shared wrapper for HTTP requests and attaches the authentication token. `utils.js` contains reusable formatting helpers, while `index.css` defines the layout and visual theme. `context/AuthContext.jsx` stores the current user and provides login and logout behavior throughout the application.

The `pages` directory contains the main screens: Home, Search, Album, Artist, Profile, Edit Profile, Login, and Register. The `components` directory contains reusable interface elements, including the navigation bar, album cards and grids, review cards, the star rating control, search pickers, and the protected-route wrapper.

## Design Choices

One important decision was to store only albums that users interact with instead of copying Deezer's entire catalog. Album metadata is added to the local database when it is needed, while searches and detailed music information continue to come from Deezer. This keeps the database smaller and gives users access to an external catalog that can change over time.

The browser does not call Deezer directly because its API does not provide the CORS headers required by the frontend. Flask therefore acts as a proxy. A fifteen-minute in-memory cache reduces repeated external requests and helps avoid Deezer's rate limit. This cache is intentionally simple because the project is designed to run as a single development server.

Recommendations are also intentionally understandable rather than based on a complex algorithm. The backend collects popular releases from each favorite artist and genre, excludes albums the user has already rated, reviewed, liked, shelved, or selected as a favorite, and avoids duplicates between rows. This approach produces relevant results while keeping the logic easy to inspect and explain.

## How to Run the Project

The project requires Python 3.12 or newer, Node.js 20 or newer, and MySQL 8. In the `backend` directory, create and activate a virtual environment, install the dependencies with `pip install -r requirements.txt`, and create a `.env` file containing `DATABASE_URL` and `JWT_SECRET_KEY`. Then run `python init_db.py` once to create the tables and `python run.py` to start the API.

In a second terminal, enter the `frontend` directory, run `npm install`, and then run `npm run dev`. The application will be available at `http://localhost:5173`, and the Flask API will run at `http://127.0.0.1:5000`.
