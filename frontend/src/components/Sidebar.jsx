import { NavLink, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Settings, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { BACKEND_URL } from '../services/api'



const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/settings', icon: Settings, label: 'Settings' }
]

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'
  const avatarSrc = currentUser?.avatar
    ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${BACKEND_URL}${currentUser.avatar}`)
    : null

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-64 bg-white dark:bg-dark-card border-r border-gray-100 dark:border-dark-border
        flex flex-col h-full transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="h-20 flex items-center justify-between px-6 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center h-full w-full py-2">
            <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain object-left scale-125 origin-left" />
          </div>
          <button onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
            <X size={18} />
          </button>
        </motion.div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <div className="space-y-0.5">
            {navItems.map(({ to, icon: Icon, label }, index) => (
              <motion.div key={to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}>
                <NavLink to={to} onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                      : 'text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border hover:text-gray-900 dark:hover:text-dark-text hover:translate-x-1'
                    }
                  `}>
                  {({ isActive }) => (
                    <>
                      <motion.div animate={isActive ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.5 }}>
                        <Icon size={18} />
                      </motion.div>
                      {label}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </div>
        </nav>

        {/* User card — click to go to Profile */}
        <div className="p-4 border-t border-gray-100 dark:border-dark-border">
          <Link to="/profile" onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border transition-colors group">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-primary-100 dark:ring-primary-900/40">
              {avatarSrc ? (
                <img src={avatarSrc} alt={currentUser?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-dark-text truncate group-hover:text-primary-600 transition-colors">
                {currentUser?.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-dark-muted truncate">
                {currentUser?.username ? `@${currentUser.username}` : currentUser?.email}
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  )
}
