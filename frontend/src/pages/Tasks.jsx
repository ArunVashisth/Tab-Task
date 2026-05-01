import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, Trash2, Edit2 } from 'lucide-react'
import { taskService, projectService, userService } from '../services'
import { BACKEND_URL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import TaskModal from '../components/TaskModal'

const statusMap = {
  'todo': 'badge-todo',
  'in-progress': 'badge-progress',
  'done': 'badge-done',
  'overdue': 'badge-overdue'
}
const priorityMap = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }

export default function Tasks() {
  const { currentUser } = useAuth()
  const [taskList, setTaskList] = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filters, setFilters] = useState({ status: '', projectId: '', priority: '' })

  const fetchData = () => {
    Promise.all([
      taskService.getAll(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
      projectService.getAll(),
      userService.getAll()
    ])
      .then(([tRes, pRes, uRes]) => {
        setTaskList(tRes.data)
        setProjects(pRes.data)
        setUsers(uRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [filters])

  // Helper: is current user an admin in a specific project?
  const isAdminInProject = (projectId) => {
    const proj = projects.find(p => p._id === (projectId?._id || projectId))
    return proj?.members?.some(m => m.user?._id === currentUser?._id && m.role === 'admin') ?? false
  }

  // Is admin in ANY project (controls "New Task" button)
  const isAdminInAnyProject = projects.some(proj =>
    proj.members?.some(m => m.user?._id === currentUser?._id && m.role === 'admin')
  )

  // Can the current user change status of a task?
  const canChangeStatus = (task) => {
    const assignedId = task.assignedTo?._id || task.assignedTo
    const isAssignedToMe = assignedId && assignedId.toString() === currentUser?._id
    const isAdmin = isAdminInProject(task.projectId)
    return isAssignedToMe || isAdmin
  }

  const handleSave = async (formData) => {
    try {
      if (editingTask) {
        const res = await taskService.update(editingTask._id, formData)
        setTaskList(prev => prev.map(t => t._id === res.data._id ? res.data : t))
        toast.success('Task updated')
      } else {
        const res = await taskService.create(formData)
        setTaskList(prev => [res.data, ...prev])
        toast.success('Task created')
      }
      setShowModal(false)
      setEditingTask(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task')
    }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await taskService.remove(taskId)
      setTaskList(prev => prev.filter(t => t._id !== taskId))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleStatusChange = async (taskId, newStatus, task) => {
    if (!canChangeStatus(task)) {
      toast.error('You can only change the status of tasks assigned to you')
      return
    }
    setTaskList(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t))
    try {
      await taskService.update(taskId, { status: newStatus })
    } catch {
      toast.error('Failed to update status')
      fetchData()
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 shimmer rounded w-32" />
        <div className="h-14 shimmer rounded-xl" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-14 shimmer rounded-lg" />)}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
            {isAdminInAnyProject
              ? 'Manage and track tasks across your projects'
              : 'Tasks assigned to you'}
          </p>
        </div>
        {isAdminInAnyProject && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditingTask(null); setShowModal(true) }}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Plus size={15} /> New Task
          </motion.button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-muted">
            <Filter size={15} />
            <span className="font-medium">Filters:</span>
          </div>
          <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
            className="text-sm border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="overdue">Overdue</option>
          </select>
          <select value={filters.projectId} onChange={e => setFilters(p => ({ ...p, projectId: e.target.value }))}
            className="text-sm border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          <select value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}
            className="text-sm border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {(filters.status || filters.projectId || filters.priority) && (
            <button onClick={() => setFilters({ status: '', projectId: '', priority: '' })}
              className="text-xs text-red-500 hover:text-red-700 font-medium">
              Clear filters
            </button>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider">Task Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider hidden sm:table-cell">Assignee</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider hidden lg:table-cell">Priority</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider hidden sm:table-cell">Project</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody>
              {taskList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 dark:text-dark-muted">No tasks found</td>
                </tr>
              ) : taskList.map((task, index) => {
                const taskIsAdminProject = isAdminInProject(task.projectId)
                const statusChangeable = canChangeStatus(task)
                return (
                  <motion.tr
                    key={task._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="border-b border-gray-50 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800 dark:text-dark-text">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-400 dark:text-dark-muted mt-0.5 truncate max-w-[200px]">{task.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {task.assignedTo.avatar ? (
                              <img
                                src={task.assignedTo.avatar.startsWith('http') ? task.assignedTo.avatar : `${BACKEND_URL}${task.assignedTo.avatar}`}
                                alt={task.assignedTo.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              task.assignedTo.name.charAt(0)
                            )}
                          </div>
                          <span className="text-gray-600 dark:text-dark-text">{task.assignedTo.name}</span>
                        </div>
                      ) : <span className="text-gray-400 dark:text-dark-muted">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {statusChangeable ? (
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task._id, e.target.value, task)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${statusMap[task.status]}`}
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusMap[task.status]}`}>
                          {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {task.dueDate ? (
                        <span className={`text-xs ${isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-dark-muted'}`}>
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      ) : <span className="text-gray-300 dark:text-dark-border">—</span>}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityMap[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-gray-500 dark:text-dark-muted text-sm">{task.projectId?.title || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      {taskIsAdminProject && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingTask(task); setShowModal(true) }}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(task._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <TaskModal
            onClose={() => { setShowModal(false); setEditingTask(null) }}
            onSave={handleSave}
            editTask={editingTask}
            users={users}
            projects={projects.filter(p => p.members?.some(m => m.user?._id === currentUser?._id && m.role === 'admin'))}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
