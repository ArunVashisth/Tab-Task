import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Shield, User, Mail, Search, Send, Loader, X, ChevronDown, Crown } from 'lucide-react'
import { userService, invitationService, projectService } from '../services'
import { BACKEND_URL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ onClose, projects }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedProject, setSelectedProject] = useState('')
  const [projectRole, setProjectRole] = useState('member')
  const [message, setMessage] = useState('')
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const searchTimeout = useRef(null)

  const handleSearch = (val) => {
    setQuery(val)
    setSelected(null)
    clearTimeout(searchTimeout.current)
    if (val.length < 2) { setResults([]); return }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await invitationService.search(val)
        setResults(res.data)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
  }

  const handleSend = async () => {
    if (!selected) return toast.error('Select a user first')
    if (!selectedProject) return toast.error('Select a project')
    setSending(true)
    try {
      await invitationService.send({
        query: selected.email,
        projectId: selectedProject,
        projectRole,
        message
      })
      const proj = projects.find(p => p._id === selectedProject)
      toast.success(`Invitation sent to ${selected.name} as ${projectRole} of "${proj?.title}"`)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  // Only show projects where current user is admin (can invite)
  const adminProjects = projects.filter(p => p.myRole === 'admin')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-text text-lg">Invite to Project</h2>
            <p className="text-xs text-gray-400 dark:text-dark-muted mt-0.5">Search by name, email, or @username</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* User Search */}
          <div>
            <label className="label">Find person</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {searching && <Loader size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
              <input
                value={selected ? `${selected.name}${selected.username ? ` (@${selected.username})` : ''}` : query}
                onChange={e => { if (!selected) handleSearch(e.target.value) }}
                onClick={() => { if (selected) { setSelected(null); setQuery(''); setResults([]) } }}
                className="input-field pl-9"
                placeholder="Type name, email, or @username..."
              />
            </div>
            <AnimatePresence>
              {results.length > 0 && !selected && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-1 border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden shadow-lg bg-white dark:bg-dark-card z-10">
                  {results.map(user => (
                    <button key={user._id} onClick={() => { setSelected(user); setResults([]) }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-border text-left transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-dark-text">{user.name}</p>
                        <p className="text-xs text-gray-400 dark:text-dark-muted">
                          {user.username ? `@${user.username} · ` : ''}{user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
              {query.length >= 2 && !searching && results.length === 0 && !selected && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-gray-400 dark:text-dark-muted px-1">
                  No users found for "{query}"
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Project */}
          <div>
            <label className="label">Project</label>
            {adminProjects.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                You need to be a project admin to send invitations. Create a project first.
              </p>
            ) : (
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="input-field">
                <option value="">Select a project</option>
                {adminProjects.map(p => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="label">Role in project</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'member', label: 'Member', desc: 'Can view tasks, update status', icon: User },
                { value: 'admin', label: 'Admin', desc: 'Can manage tasks and invite others', icon: Crown }
              ].map(({ value, label, desc, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setProjectRole(value)}
                  className={`flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all ${
                    projectRole === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-primary-300'
                  }`}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={projectRole === value ? 'text-primary-600' : 'text-gray-400'} />
                    <span className={`text-sm font-semibold ${projectRole === value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-dark-text'}`}>
                      {label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-dark-muted">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="label">Personal note <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              className="input-field resize-none" rows={2} placeholder="Add a message to your invitation..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <motion.button onClick={handleSend}
              disabled={sending || !selected || !selectedProject || adminProjects.length === 0}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {sending ? <><Loader size={14} className="animate-spin" />Sending...</> : <><Send size={14} />Send Invite</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Team Page ────────────────────────────────────────────────────────────────
export default function Team() {
  const { currentUser } = useAuth()
  const [collaborators, setCollaborators] = useState([])
  const [myProjects, setMyProjects] = useState([])   // [{_id, title, color, myRole}]
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, meRes] = await Promise.all([
          userService.getAll(),
          userService.getMeWithProjects()
        ])
        setCollaborators(usersRes.data)
        setMyProjects(meRes.data.projects || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const isProjectAdmin = myProjects.some(p => p.myRole === 'admin')
  const adminCount = collaborators.filter(u => {
    // count people who are admin in at least one shared project — approximate
    return u.role === 'admin'
  }).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 shimmer rounded w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-44 shimmer rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Team</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
            Your collaborators across all shared projects
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowInvite(true)}
          className="btn-primary text-sm flex items-center gap-1.5">
          <Send size={14} />Invite Member
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Collaborators', value: collaborators.length, icon: Users, bg: 'bg-blue-500' },
          { label: 'Your Projects', value: myProjects.length, icon: Shield, bg: 'bg-violet-500' },
          { label: 'Admin In', value: myProjects.filter(p => p.myRole === 'admin').length, icon: Crown, bg: 'bg-emerald-500' }
        ].map(({ label, value, icon: Icon, bg }, index) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }} whileHover={{ scale: 1.04, y: -3 }}
            className="card p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">{value}</p>
              <p className="text-xs text-gray-500 dark:text-dark-muted">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* My projects with roles */}
      {myProjects.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card p-5">
          <h2 className="font-semibold text-gray-800 dark:text-dark-text mb-3 text-sm">Your Projects</h2>
          <div className="flex flex-wrap gap-2">
            {myProjects.map(proj => (
              <div key={proj._id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color }} />
                <span className="text-sm text-gray-700 dark:text-dark-text">{proj.title}</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  proj.myRole === 'admin'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                    : 'bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-dark-muted'
                }`}>{proj.myRole}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Collaborators grid */}
      {collaborators.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="card p-16 text-center">
          <Users size={44} className="mx-auto mb-4 text-gray-300 dark:text-dark-border" />
          <h3 className="font-semibold text-gray-700 dark:text-dark-text mb-2">No collaborators yet</h3>
          <p className="text-sm text-gray-400 dark:text-dark-muted mb-4">
            {isProjectAdmin
              ? 'Invite someone to one of your projects to start collaborating.'
              : 'Create a project or wait for someone to invite you.'}
          </p>
          {isProjectAdmin && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowInvite(true)} className="btn-primary text-sm mx-auto">
              Send First Invite
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {collaborators.map((member, index) => {
              const avatarSrc = member.avatar
                ? (member.avatar.startsWith('http') ? member.avatar : `${BACKEND_URL}${member.avatar}`)
                : null
              return (
                <motion.div key={member._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.07 * index }} whileHover={{ y: -5, scale: 1.02 }}
                  className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xl font-bold shrink-0">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

              <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-0.5">
                {member.name}
              </h3>
              {member.username && (
                <p className="text-xs text-primary-500 dark:text-primary-400 mb-1">@{member.username}</p>
              )}
              <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-dark-muted mb-4">
                <Mail size={13} />
                <span className="truncate">{member.email}</span>
              </div>

              <div className="pt-4 border-t border-gray-50 dark:border-dark-border">
                <p className="text-xs text-gray-400 dark:text-dark-muted">
                  Member since {format(new Date(member.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </motion.div>
          )})}
        </div>
      )}

      <AnimatePresence>
        {showInvite && <InviteModal onClose={() => setShowInvite(false)} projects={myProjects} />}
      </AnimatePresence>
    </motion.div>
  )
}
