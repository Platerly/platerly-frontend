import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'
import RecipeCard from '../components/ui/RecipeCard'

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) return

      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error('Failed to fetch search results')
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Unexpected response format')
        setResults(data)
      } catch (err) {
        console.error(err)
        setError('Something went wrong while searching.')
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-6">Search results for: <span className="text-green-400">{query}</span></h1>

      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <p className="text-gray-500">No matching users or recipes found.</p>
      )}

      <div className="flex flex-col gap-6">
        {results.map((item, index) => {
          if (item.type === 'recipe') {
            return (
              <RecipeCard
                key={item.recipeId}
                id={item.recipeId}
                author={item.authorUsername}
                title={item.title}
                description={item.description}
                imageUrl={item.imageUrl}
                likes={item.likes}
                ingredients={item.ingredients}
                userAllergies={[]} // Optional for search page
              />
            )
          } else if (item.type === 'user') {
            return (
              <div
                key={item.username}
                className="border border-platerly-border p-4 rounded-lg bg-platerly-card hover:bg-platerly-card/80 transition cursor-pointer"
                onClick={() => window.location.href = `/profile/${item.username}`}
              >
                <h3 className="text-lg font-semibold">@{item.username}</h3>
                <p className="text-sm text-gray-400">{item.displayName}</p>
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

export default SearchResultsPage
