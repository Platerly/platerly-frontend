const TOKEN_KEY = 'platerly_token'
const USER_ID_KEY = 'platerly_user_id'

export const login = (token, userId) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_ID_KEY, userId)
}

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
}

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

export const getCurrentUserId = () => {
  return localStorage.getItem(USER_ID_KEY)
}
