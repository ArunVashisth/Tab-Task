import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader } from 'lucide-react'

export default function TaskModal({ onClose, onSave, editTask, users, defaultProjectId, projects }) {
  const [form, setForm] = useState({
    title: editTask?.title || '',
    description: editTask?.description || '',
    projectId: editTask?.projectId?._id || editTask?.projectId || defaultProjectId || '',
    assignedTo: editTask?.assignedTo?._id || editTask?.assignedTo || '',
    status: editTask?.status || 'todo',
    priority: editTask?.priority || 'medium',
    dueDate: editTask?.dueDate ? editTask.dueDate.split('T')[0] : ''
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.projectId) errs.projectId = 'Project is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = { ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null }
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-card">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text text-lg">
            {editTask ? 'Edit Task' : 'Create Task'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Task Title *</label>
            <input name="title" value={form.title} onChange={handleChange}
              className={`input-field ${errors.title ? 'border-red-400' : ''}`}
              placeholder="What needs to be done?" />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              className="input-field resize-none" rows={3} placeholder="Add more details..." />
          </div>

          {projects && projects.length > 0 && (
            <div>
              <label className="label">Project *</label>
              <select name="projectId" value={form.projectId} onChange={handleChange}
                className={`input-field ${errors.projectId ? 'border-red-400' : ''}`}>
                <option value="">Select project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
              {errors.projectId && <p className="mt-1 text-xs text-red-500">{errors.projectId}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Assignee</label>
              <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="input-field">
                <option value="">Unassigned</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="input-field" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <motion.button
              type="submit" disabled={saving}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader size={14} className="animate-spin" />Saving...</> : (editTask ? 'Save Changes' : 'Create Task')}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
