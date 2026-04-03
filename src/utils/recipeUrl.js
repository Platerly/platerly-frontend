/**
 * utils/recipeUrl.js — Layer: Utility / URL generation
 *
 * Generates internal navigation URLs and shareable external URLs for recipes.
 *
 * URL strategies:
 *  - SEO-friendly (preferred): /{username}/{slug}
 *    GitHub-style path that embeds author identity and a human-readable slug.
 *    Requires both `slug` and `authorUsername` (or equivalent) to be present.
 *
 *  - ID-based (fallback): /recipe/{id}
 *    Used for older recipes created before slug generation was added, or when
 *    the recipe object shape doesn't include slug/username fields.
 *
 * Both functions defensively handle multiple API response shapes (camelCase,
 * PascalCase, nested user/author objects) because recipes can come from several
 * endpoints with slightly different serialisation conventions.
 */

/**
 * Generates the internal SPA navigation path for a recipe.
 *
 * Field resolution order (first non-empty value wins):
 *  slug     : recipe.slug → recipe.Slug
 *  username : recipe.authorUsername → recipe.AuthorUsername
 *             → recipe.author?.username → recipe.user?.username
 *  id       : recipe.id → recipe.Id → recipe.recipeId → recipe.RecipeId
 *
 * @param {Object|null} recipe - Recipe object (any supported shape)
 * @returns {string} URL path: "/{username}/{slug}", "/recipe/{id}", or "/feed" as last resort
 */
export function getRecipeUrl(recipe) {
  if (!recipe) return '/feed'

  // Try to get slug and username from various possible field names
  const slug = recipe.slug || recipe.Slug
  const username = recipe.authorUsername || recipe.AuthorUsername ||
                   recipe.author?.username || recipe.user?.username

  // Use SEO-friendly URL if both slug and username are available
  if (slug && username) {
    // Lowercase the username segment for URL consistency
    return `/${username.toLowerCase()}/${slug}`
  }

  // Fall back to ID-based URL when slug or username is missing
  const id = recipe.id || recipe.Id || recipe.recipeId || recipe.RecipeId
  if (id) {
    return `/recipe/${id}`
  }

  // Last resort: navigate to the feed rather than producing a broken URL
  return '/feed'
}

/**
 * Generates the full shareable URL for a recipe, intended for use in social
 * share dialogs, copy-link buttons, and OG meta tags.
 *
 * Uses the /api/share/recipe/{id} endpoint rather than the SPA path because
 * that endpoint renders server-side Open Graph tags (og:title, og:image, etc.)
 * that social crawlers require for link previews.
 *
 * @param {Object|null} recipe - Recipe object (any supported shape)
 * @returns {string} Full absolute URL, or window.location.origin if no ID found
 */
export function getRecipeShareUrl(recipe) {
  const id = recipe?.id || recipe?.Id || recipe?.recipeId || recipe?.RecipeId
  if (!id) return window.location.origin
  return `${window.location.origin}/api/share/recipe/${id}`
}
