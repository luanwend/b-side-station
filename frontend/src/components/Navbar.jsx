import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch(event) {
    event.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-dot" />
          B-Side Station
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to={`/users/${user.username}`}>Profile</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <form className="nav-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search albums or artists"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  )
}
