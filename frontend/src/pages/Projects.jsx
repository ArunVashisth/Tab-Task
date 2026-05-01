import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FolderKanban, Users, Trash2, Edit2, X, Loader, Crown, Shield } from 'lucide-react'
import { projectService } from '../services'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const projectColors = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#059669', '#DC2626', '#0891B2', '#7C2D12']

// ─── Project Create/Edit Modal ────────────────────────────────────────────────
function ProjectModal({ onClose, onSave, editProject }) {
  const [form, setForm] = useState({
    title: editProject?.title || '',
    description: editProject?.description || '',
    color: editProject?.color || '#2563EB',
    status: editProject?.status || 'active'
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-text text-lg">
              {editProject ? 'Edit Project' : 'Create Project'}
            </h2>
            {!editProject && (
              <p className="text-xs text-gray-400 dark:text-dark-muted mt-0.5">
                You will be the project admin. Invite others from the Team page.
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Project Title *</label>
            <input value={form.title}
              onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: '' })) }}
              className={`input-field ${errors.title ? 'border-red-400' : ''}`}
              placeholder="e.g. Website Redesign" />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input-field resize-none" rows={3} placeholder="What is this project about?" />
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {projectColors.map(color => (
                <button key={color} type="button" onClick={() => setForm(p => ({ ...p, color }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          {editProject && (
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <><Loader size={14} className="animate-spin" />Saving...</> : (editProject ? 'Save Changes' : 'Create Project')}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Projects Page ────────────────────────────────────────────────────────────
export default function Projects() {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  const fetchProjects = () => {
    projectService.getAll()
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleSave = async (formData) => {
    try {
      if (editingProject) {
        const res = await projectService.update(editingProject._id, formData)
        setProjects(prev => prev.map(p => p._id === res.data._id ? res.data : p))
        toast.success('Project updated')
      } else {
        const res = await projectService.create(formData)
        setProjects(prev => [res.data, ...prev])
        toast.success('Project created. Go to Team to invite members.')
      }
      setShowModal(false)
      setEditingProject(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project')
    }
  }

  const handleDelete = async (projectId) => {
    if (!window.confirm('Delete this project and all its tasks?')) return
    try {
      await projectService.remove(projectId)
      setProjects(prev => prev.filter(p => p._id !== projectId))
      toast.success('Project deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project')
    }
  }

  // Get current user's role in a specific project
  const getMyProjectRole = (project) => {
    const me = project.members?.find(m => m.user?._id === currentUser?._id)
    return me?.role || null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 shimmer rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-52 shimmer rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">Your projects and projects you've been invited to</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditingProject(null); setShowModal(true) }}
          className="btn-primary text-sm flex items-center gap-1.5">
          <Plus size={15} /> New Project
        </motion.button>
      </motion.div>

      {projects.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-16 text-center">
          <FolderKanban size={48} className="mx-auto mb-4 text-gray-300 dark:text-dark-border" />
          <h3 className="font-medium text-gray-700 dark:text-dark-text mb-2">No projects yet</h3>
          <p className="text-sm text-gray-400 dark:text-dark-muted mb-4">
            Create your first project — you'll be the admin and can invite others.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)} className="btn-primary text-sm mx-auto">
            Create Project
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj, index) => {
            const myRole = getMyProjectRole(proj)
            const isAdmin = myRole === 'admin'
            const isCreator = proj.createdBy?._id === currentUser?._id || proj.createdBy === currentUser?._id

            return (
              <motion.div key={proj._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }} whileHover={{ y: -8, scale: 1.02 }}
                className="card p-5 hover:shadow-xl transition-shadow duration-200 group">

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: proj.color }}>
                      {proj.title.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <Link to={`/projects/${proj._id}`}
                        className="font-semibold text-gray-900 dark:text-dark-text hover:text-primary-600 transition-colors block truncate">
                        {proj.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {myRole === 'admin' ? (
                          <span className="text-xs font-medium text-violet-600 dark:text-violet-400 flex items-center gap-1">
                            <Crown size={10} /> Admin
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Member</span>
                        )}
                        {isCreator && <span className="text-xs text-gray-300 dark:text-dark-border">· Owner</span>}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingProject(proj); setShowModal(true) }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(proj._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {proj.description && (
                  <p className="text-sm text-gray-500 dark:text-dark-muted mb-4 line-clamp-2">{proj.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-dark-border">
                  <div className="flex -space-x-2">
                    {proj.members?.slice(0, 4).map((m, idx) => (
                      <div key={m.user?._id || idx} title={`${m.user?.name} (${m.role})`}
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: proj.color, zIndex: 4 - idx }}>
                        {m.user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                    ))}
                    {proj.members?.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-dark-border border-2 border-white dark:border-dark-card flex items-center justify-center text-xs text-gray-500">
                        +{proj.members.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-dark-muted">
                    <Users size={11} />
                    {proj.members?.length || 0} {proj.members?.length === 1 ? 'member' : 'members'}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ProjectModal
            onClose={() => { setShowModal(false); setEditingProject(null) }}
            onSave={handleSave}
            editProject={editingProject}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
