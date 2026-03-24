/**
 * Generate the URL path for a recipe.
 * Uses SEO-friendly format /username/slug when available (GitHub-style),
 * falls back to /recipe/{id} for backwards compatibility.
 *
 * @param {Object} recipe - Recipe object (can have various shapes from different APIs)
 * @returns {string} URL path like "/johndoe/chocolate-chip-cookies" or "/recipe/{id}"
 */
export function getRecipeUrl(recipe) {
  if (!recipe) return '/feed'

  // Try to get slug and username from various possible field names
  const slug = recipe.slug || recipe.Slug
  const username = recipe.authorUsername || recipe.AuthorUsername ||
                   recipe.author?.username || recipe.user?.username

  // Use SEO-friendly URL if both slug and username are available
  if (slug && username) {
    return `/${username.toLowerCase()}/${slug}`
  }

  // Fall back to ID-based URL
  const id = recipe.id || recipe.Id || recipe.recipeId || recipe.RecipeId
  if (id) {
    return `/recipe/${id}`
  }

  return '/feed'
}

/**
 * Generate the full share URL for a recipe (for social sharing).
 * Uses the /api/share/recipe/{id} endpoint which handles OG tags.
 *
 * @param {Object} recipe - Recipe object
 * @returns {string} Full share URL
 */
export function getRecipeShareUrl(recipe) {
  const id = recipe?.id || recipe?.Id || recipe?.recipeId || recipe?.RecipeId
  if (!id) return window.location.origin
  return `${window.location.origin}/api/share/recipe/${id}`
}
