import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check URL for Google OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    const oauthUserStr = params.get('user');

    if (oauthToken && oauthUserStr) {
      try {
        const user = JSON.parse(decodeURIComponent(oauthUserStr));
        localStorage.setItem('token', oauthToken);
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
        setLoading(false);
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } catch (err) {
        console.error('OAuth URL parsing error:', err);
      }
    }

    // 2. Normal localStorage check
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setCurrentUser(JSON.parse(savedUser))
      authService.me()
        .then(res => {
          setCurrentUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setCurrentUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setCurrentUser(user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setCurrentUser(null)
  }

  const updateCurrentUser = (updatedUser) => {
    setCurrentUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
