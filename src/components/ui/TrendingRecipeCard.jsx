import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame } from 'lucide-react'

const TrendingRecipeCard = ({
  id,
  rank,
  title,
  imageUrl,
}) => {
  const navigate = useNavigate()

  return (
    <article
      onClick={() => navigate(`/recipe/${id}`)}
      className="group relative flex items-center gap-3 p-3 bg-recipzee-card border border-recipzee-border rounded-xl cursor-pointer
                 transition-all duration-200 hover:border-orange-500/40 hover:bg-recipzee-light/30"
    >
      {/* Rank Badge - Top Left Corner */}
      <div className="absolute -top-2 -left-2 flex items-center gap-0.5 px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 shadow-md">
        <Flame className="w-3 h-3 text-white" />
        <span className="text-white font-bold text-xs">#{rank}</span>
      </div>

      {/* Image */}
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
        <img
          src={imageUrl || '/placeholder.png'}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Title Only */}
      <h3 className="flex-1 min-w-0 text-xs font-medium text-recipzee-text leading-snug line-clamp-2 break-words group-hover:text-orange-400 transition-colors">
        {title}
      </h3>
    </article>
  )
}

export default TrendingRecipeCard
