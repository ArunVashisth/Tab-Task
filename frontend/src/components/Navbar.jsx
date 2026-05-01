import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, ChevronDown, LogOut, User, Settings, Menu, Check, X, FolderKanban, CheckSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { invitationService, projectService, taskService } from '../services'
import { BACKEND_URL } from '../services/api'
import toast from 'react-hot-toast'



// ── Global search hook ───────────────────────────────────────────────────────
function useSearch() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState({ projects: [], tasks: [] })
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)
  const cacheRef = useRef({ projects: [], tasks: [] })

  // Fetch data once on mount
  useEffect(() => {
    const prefetch = async () => {
      try {
        const [pr, tr] = await Promise.all([projectService.getAll(), taskService.getAll()])
        cacheRef.current = { projects: pr.data, tasks: tr.data }
      } catch { /* silent */ }
    }
    prefetch()
  }, [])

  const search = useCallback((q) => {
    const trimmed = q.trim().toLowerCase()
    if (!trimmed) { setResults({ projects: [], tasks: [] }); setOpen(false); return }

    const projects = cacheRef.current.projects.filter(p =>
      p.title?.toLowerCase().includes(trimmed) ||
      p.description?.toLowerCase().includes(trimmed)
    ).slice(0, 5)

    const tasks = cacheRef.current.tasks.filter(t =>
      t.title?.toLowerCase().includes(trimmed) ||
      t.description?.toLowerCase().includes(trimmed)
    ).slice(0, 5)

    setResults({ projects, tasks })
    setOpen(projects.length > 0 || tasks.length > 0)
    setLoading(false)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    if (!val.trim()) { setOpen(false); setResults({ projects: [], tasks: [] }); return }
    setLoading(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 280)
  }

  const clear = () => {
    setQuery('')
    setOpen(false)
    setResults({ projects: [], tasks: [] })
  }

  return { query, results, open, loading, handleChange, clear, setOpen }
}

// ── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar({ onMenuClick }) {
  const { currentUser, logout } = useAuth()
  const { isDark, toggleTheme }  = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen]       = useState(false)
  const [invitations, setInvitations]   = useState([])
  const dropdownRef  = useRef(null)
  const searchRef    = useRef(null)
  const navigate     = useNavigate()
  const { query, results, open, loading, handleChange, clear, setOpen } = useSearch()

  const fetchInvites = useCallback(async () => {
    try { const res = await invitationService.getMine(); setInvitations(res.data) }
    catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchInvites()
    const iv = setInterval(fetchInvites, 30000)
    return () => clearInterval(iv)
  }, [fetchInvites])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false); setNotifOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setOpen])

  // Escape key closes everything
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { clear(); setDropdownOpen(false); setNotifOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [clear])

  const handleLogout = () => { logout(); navigate('/login') }

  const handleRespond = async (inviteId, status) => {
    try {
      await invitationService.respond(inviteId, status)
      setInvitations(prev => prev.filter(i => i._id !== inviteId))
      toast.success(status === 'accepted' ? 'Joined the project' : 'Invitation declined')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to respond') }
  }

  const goToResult = (path) => { navigate(path); clear() }

  const initials   = currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'
  const avatarSrc  = currentUser?.avatar
    ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${BACKEND_URL}${currentUser.avatar}`)
    : null
  const displayName = currentUser?.username ? `@${currentUser.username}` : currentUser?.name
  const pendingCount = invitations.length
  const hasResults  = results.projects.length > 0 || results.tasks.length > 0

  const STATUS_COLORS = {
    'todo':        'bg-gray-200 dark:bg-gray-600',
    'in-progress': 'bg-amber-400',
    'done':        'bg-emerald-400',
    'overdue':     'bg-red-400',
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="h-16 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">

      {/* Left — hamburger + search */}
      <div className="flex items-center gap-3 flex-1">
        <button onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
          <Menu size={20} />
        </button>

        {/* Search box */}
        <div ref={searchRef} className="relative hidden sm:block w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => { if (hasResults) setOpen(true) }}
            placeholder="Search projects, tasks…"
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-dark-text placeholder-gray-400 transition-all"
          />
          {/* Clear button */}
          {query && (
            <button onClick={clear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-300 hover:text-gray-500 rounded transition-colors">
              <X size={13} />
            </button>
          )}

          {/* Results dropdown */}
          <AnimatePresence>
            {open && query && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl shadow-xl overflow-hidden z-50">

                {loading && (
                  <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    Searching…
                  </div>
                )}

                {!loading && !hasResults && (
                  <div className="px-4 py-6 text-center">
                    <Search size={20} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs text-gray-400">No results for "{query}"</p>
                  </div>
                )}

                {/* Projects */}
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-3 pt-3 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-muted">Projects</span>
                    </div>
                    {results.projects.map(p => (
                      <button key={p._id} onClick={() => goToResult(`/projects/${p._id}`)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: p.color || '#2563EB' }}>
                          {p.title?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-dark-text truncate">{p.title}</p>
                          {p.description && (
                            <p className="text-xs text-gray-400 dark:text-dark-muted truncate">{p.description}</p>
                          )}
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize shrink-0 ${
                          p.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                          p.status === 'on-hold' ? 'bg-amber-100 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>{p.status}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {results.tasks.length > 0 && (
                  <div className={results.projects.length > 0 ? 'border-t border-gray-50 dark:border-dark-border' : ''}>
                    <div className="px-3 pt-3 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-muted">Tasks</span>
                    </div>
                    {results.tasks.map(t => (
                      <button key={t._id}
                        onClick={() => goToResult(`/projects/${t.projectId?._id || t.projectId}`)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[t.status] || 'bg-gray-300'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-dark-text truncate">{t.title}</p>
                          <p className="text-xs text-gray-400 dark:text-dark-muted truncate">
                            {t.projectId?.title || 'Unknown project'} · <span className="capitalize">{t.status?.replace('-', ' ')}</span>
                          </p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize shrink-0 ${
                          t.priority === 'high' ? 'bg-red-100 text-red-600' :
                          t.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>{t.priority}</span>
                      </button>
                    ))}
                  </div>
                )}

                {hasResults && (
                  <div className="px-3 py-2 border-t border-gray-50 dark:border-dark-border">
                    <p className="text-[10px] text-gray-300 dark:text-dark-border">
                      {results.projects.length + results.tasks.length} result{results.projects.length + results.tasks.length !== 1 ? 's' : ''} · Press Esc to close
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right — theme + notifications + user */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
        className="flex items-center gap-2" ref={dropdownRef}>

        {/* Theme toggle */}
        <motion.button onClick={toggleTheme} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
          title={isDark ? 'Light mode' : 'Dark mode'}>
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false) }}
            className="relative p-2 rounded-lg text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
            <Bell size={18} />
            {pendingCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-96 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-dark-text">Project Invitations</h3>
                  {pendingCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{pendingCount} pending</span>
                  )}
                </div>
                {invitations.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={28} className="mx-auto mb-2 text-gray-300 dark:text-dark-border" />
                    <p className="text-sm text-gray-400 dark:text-dark-muted">No pending invitations</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-dark-border">
                    {invitations.map(invite => (
                      <div key={invite._id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {invite.from?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-dark-text">
                              <span className="font-medium">{invite.from?.name}</span>{' '}invited you to{' '}
                              <span className="font-medium" style={{ color: invite.projectId?.color }}>{invite.projectId?.title}</span>
                            </p>
                            {invite.message && (
                              <p className="text-xs text-gray-400 dark:text-dark-muted mt-0.5 italic">"{invite.message}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleRespond(invite._id, 'accepted')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors">
                            <Check size={12} /> Accept
                          </button>
                          <button onClick={() => handleRespond(invite._id, 'rejected')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-muted text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
                            <X size={12} /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User dropdown */}
        <div className="relative">
          <motion.button onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false) }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary-100 dark:ring-primary-900/40 shrink-0">
              {avatarSrc ? (
                <img src={avatarSrc} alt={currentUser?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </div>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-dark-text leading-none">{displayName}</p>
              <p className="text-xs text-gray-400 dark:text-dark-muted truncate max-w-[120px]">{currentUser?.email}</p>
            </div>
            <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl shadow-xl py-1 z-50">
                <Link to="/profile" onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
                  <User size={15} />Profile
                </Link>
                <Link to="/settings" onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
                  <Settings size={15} />Settings
                </Link>
                <hr className="my-1 border-gray-100 dark:border-dark-border" />
                <button onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors">
                  <LogOut size={15} />Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.header>
  )
}
