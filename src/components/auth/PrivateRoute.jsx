import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../utils/auth'

const PrivateRoute = ({ children }) => {
  const location = useLocation()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const auth = isAuthenticated()
    setIsAuth(auth)
    setCheckingAuth(false)
  }, [])

  if (checkingAuth) {
    return <div className="text-center mt-20 text-white">Checking authentication...</div>
  }

  if (!isAuth) {
    return <Navigate to={`/login?redirect=${location.pathname}`} />
  }

  return children
}

export default PrivateRoute
