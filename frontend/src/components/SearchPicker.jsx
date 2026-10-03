import { useState } from 'react'

/**
 * Search for items (albums or artists) and pick up to `max` of them.
 * `selected` is a list of items with an `id`; `onChange` receives the new list.
 */
export default function SearchPicker({ selected, onChange, search, getLabel, getImage, placeholder, round = false, max = 5 }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const full = selected.length >= max

  async function runSearch() {
    if (!query.trim()) return
    setSearching(true)
    setError('')
    try {
      setResults(await search(query.trim()))
    } catch (err) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  function add(item) {
    if (full || selected.some((picked) => picked.id === item.id)) return
    onChange([...selected, item])
  }

  function remove(id) {
    onChange(selected.filter((item) => item.id !== id))
  }

  return (
    <div className="picker">
      <div className="picker-selected">
        {selected.map((item) => (
          <div key={item.id} className="picker-chip">
            <img src={getImage(item) || placeholder} alt="" className={round ? 'round' : ''} />
            <span>{getLabel(item)}</span>
            <button type="button" onClick={() => remove(item.id)} aria-label={`Remove ${getLabel(item)}`}>
              ×
            </button>
          </div>
        ))}
        {!selected.length && <p className="muted">Nothing picked yet.</p>}
      </div>
      <p className="muted small">
        {selected.length}/{max} picked
      </p>

      <div className="picker-search">
        <input
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              runSearch()
            }
          }}
        />
        <button type="button" className="btn btn-small" onClick={runSearch} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {results.length > 0 && (
        <ul className="picker-results">
          {results.map((item) => {
            const picked = selected.some((selectedItem) => selectedItem.id === item.id)
            return (
              <li key={item.id}>
                <img src={getImage(item) || placeholder} alt="" className={round ? 'round' : ''} />
                <span>{getLabel(item)}</span>
                <button type="button" className="btn btn-small" onClick={() => add(item)} disabled={picked || full}>
                  {picked ? 'Added' : 'Add'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
