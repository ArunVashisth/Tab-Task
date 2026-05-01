import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, Users, Crown, Loader, X,
  CheckCircle2, Clock, AlertCircle, ListTodo,
  Calendar, LayoutGrid, List, Edit2, Trash2,
  ChevronRight, Tag, LogOut, UserMinus
} from 'lucide-react'
import { projectService, taskService } from '../services'
import { BACKEND_URL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format, isPast, isToday, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import TaskModal from '../components/TaskModal'

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       dot: 'bg-gray-400',   bg: 'bg-gray-50 dark:bg-dark-bg',            header: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in-progress', label: 'In Progress', dot: 'bg-amber-400',  bg: 'bg-amber-50/50 dark:bg-amber-900/10',   header: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'done',        label: 'Done',        dot: 'bg-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', header: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { id: 'overdue',     label: 'Overdue',     dot: 'bg-red-400',    bg: 'bg-red-50/50 dark:bg-red-900/10',       header: 'bg-red-50 dark:bg-red-900/20' },
]

const PRIORITY_STYLES = {
  high:   'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  low:    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

const STATUS_STYLES = {
  'todo':        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  'in-progress': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'done':        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  'overdue':     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
}

function ProgressRing({ pct, color, size = 64 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="6"
        className="stroke-gray-100 dark:stroke-dark-border" />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="6"
        stroke={color} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }} />
    </svg>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const [project, setProject]       = useState(null)
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState('kanban')   // 'kanban' | 'list'
  const [showModal, setShowModal]   = useState(false)
  const [editTask, setEditTask]     = useState(null)

  const load = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        projectService.getById(id),
        taskService.getAll({ projectId: id })
      ])
      setProject(pRes.data)
      setTasks(tRes.data)
    } catch { toast.error('Failed to load project') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const myRole       = project?.members?.find(m => m.user?._id === currentUser?._id)?.role
  const isAdmin      = myRole === 'admin'
  const isCreator    = project?.createdBy?._id === currentUser?._id || project?.createdBy === currentUser?._id
  const members      = project?.members?.map(m => m.user).filter(Boolean) || []
  const total        = tasks.length
  const done         = tasks.filter(t => t.status === 'done').length
  const inProgress   = tasks.filter(t => t.status === 'in-progress').length
  const overdue      = tasks.filter(t => t.status === 'overdue' || (t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done')).length
  const pct          = total ? Math.round((done / total) * 100) : 0

  const handleDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || source.droppableId === destination.droppableId) return
    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: destination.droppableId } : t))
    try { await taskService.update(draggableId, { status: destination.droppableId }) }
    catch { toast.error('Failed to move task'); load() }
  }

  const handleSave = async (data) => {
    try {
      if (editTask) {
        const res = await taskService.update(editTask._id, data)
        setTasks(prev => prev.map(t => t._id === res.data._id ? res.data : t))
        toast.success('Task updated')
      } else {
        const res = await taskService.create({ ...data, projectId: id })
        setTasks(prev => [res.data, ...prev])
        toast.success('Task created')
      }
      setShowModal(false); setEditTask(null)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save task') }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await taskService.remove(taskId)
      setTasks(prev => prev.filter(t => t._id !== taskId))
      toast.success('Task deleted')
    } catch { toast.error('Failed to delete task') }
  }

  const handleLeaveProject = async () => {
    if (!window.confirm('Leave this project? You will lose access to all its tasks.')) return
    try {
      await projectService.removeMember(id, currentUser._id)
      toast.success('You have left the project')
      window.location.href = '/projects'
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave project')
    }
  }

  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this project?`)) return
    try {
      await projectService.removeMember(id, userId)
      setProject(prev => ({
        ...prev,
        members: prev.members.filter(m => (m.user?._id || m.user) !== userId)
      }))
      toast.success(`${memberName} removed from project`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader size={28} className="animate-spin text-primary-600" />
    </div>
  )

  if (!project) return (
    <div className="text-center py-24">
      <p className="text-gray-400 mb-4">Project not found</p>
      <Link to="/projects" className="btn-primary text-sm inline-flex items-center gap-2">
        <ArrowLeft size={14} /> Back to Projects
      </Link>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link to="/projects" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors text-gray-400 self-start">
          <ArrowLeft size={18} />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <motion.div whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ backgroundColor: project.color || '#2563EB' }}>
              {project.title.charAt(0)}
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text truncate">{project.title}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
              project.status === 'active'    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
              project.status === 'on-hold'   ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
              'bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-dark-muted'
            }`}>{project.status}</span>
            {myRole && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isAdmin ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                        : 'bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-dark-muted'
              }`}>
                {isAdmin && <Crown size={10} />}{myRole}
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-gray-500 dark:text-dark-muted ml-14 line-clamp-2">{project.description}</p>
          )}
        </div>

        {isAdmin && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setEditTask(null); setShowModal(true) }}
            className="btn-primary text-sm flex items-center gap-1.5 shrink-0">
            <Plus size={15} /> Add Task
          </motion.button>
        )}
        {!isAdmin && !isCreator && myRole && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLeaveProject}
            className="text-sm flex items-center gap-1.5 px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors shrink-0">
            <LogOut size={15} /> Leave Project
          </motion.button>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks',  value: total,      icon: ListTodo,     color: '#2563EB', ring: '#2563EB' },
          { label: 'Completed',    value: done,        icon: CheckCircle2, color: '#059669', ring: '#059669' },
          { label: 'In Progress',  value: inProgress,  icon: Clock,        color: '#D97706', ring: '#D97706' },
          { label: 'Overdue',      value: overdue,     icon: AlertCircle,  color: '#DC2626', ring: '#DC2626' },
        ].map(({ label, value, icon: Icon, color, ring }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }} whileHover={{ y: -4 }}
            className="card p-4 flex items-center gap-4">
            <div className="relative shrink-0">
              <ProgressRing pct={total ? (value / total) * 100 : 0} color={ring} size={56} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">{value}</p>
              <p className="text-xs text-gray-500 dark:text-dark-muted">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Progress bar ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-800 dark:text-dark-text">Overall Progress</span>
          <span className="text-sm font-bold" style={{ color: project.color || '#2563EB' }}>{pct}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ backgroundColor: project.color || '#2563EB' }}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400 dark:text-dark-muted">
            Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
          </span>
          <span className="text-xs text-gray-400 dark:text-dark-muted">
            {done} of {total} tasks done
          </span>
        </div>
      </motion.div>

      {/* ── Members ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={15} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-text">
            Team Members ({project.members?.length || 0})
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {project.members?.map(m => {
            const memberId = m.user?._id
            const isProjectCreator = project.createdBy?._id === memberId || project.createdBy === memberId
            const isMe = memberId === currentUser?._id
            return (
              <div key={memberId} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-dark-border group">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: project.color || '#2563EB' }}>
                  {m.user?.avatar ? (
                    <img
                      src={m.user.avatar.startsWith('http') ? m.user.avatar : `${BACKEND_URL}${m.user.avatar}`}
                      alt={m.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    m.user?.name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-800 dark:text-dark-text">{m.user?.name}</span>
                    {m.role === 'admin' && <Crown size={11} className="text-violet-500" />}
                    {isMe && <span className="text-xs text-primary-500">(you)</span>}
                  </div>
                  {m.user?.username && (
                    <p className="text-xs text-primary-500">@{m.user.username}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded capitalize ${
                  m.role === 'admin'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                    : 'bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-dark-muted'
                }`}>{m.role}</span>
                {isAdmin && !isProjectCreator && !isMe && (
                  <button
                    onClick={() => handleRemoveMember(memberId, m.user?.name)}
                    className="ml-1 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title={`Remove ${m.user?.name}`}>
                    <UserMinus size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── View toggle + Tasks ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-text">
            Tasks <span className="ml-1.5 text-xs font-normal text-gray-400">({total})</span>
          </h3>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-border rounded-lg p-1">
            {[{ id: 'kanban', icon: LayoutGrid }, { id: 'list', icon: List }].map(({ id: vid, icon: Icon }) => (
              <button key={vid} onClick={() => setView(vid)}
                className={`p-1.5 rounded-md transition-all ${
                  view === vid
                    ? 'bg-white dark:bg-dark-card shadow text-primary-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* ── KANBAN ── */}
        {view === 'kanban' && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {COLUMNS.map(col => {
                const colTasks = tasks.filter(t => t.status === col.id)
                return (
                  <div key={col.id} className="flex flex-col min-h-[300px]">
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl ${col.header}`}>
                      <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-dark-text uppercase tracking-wide">
                        {col.label}
                      </span>
                      <span className="ml-auto text-xs text-gray-400 bg-white dark:bg-dark-card px-1.5 py-0.5 rounded-full font-medium">
                        {colTasks.length}
                      </span>
                    </div>
                    <Droppable droppableId={col.id}>
                      {(prov, snap) => (
                        <div ref={prov.innerRef} {...prov.droppableProps}
                          className={`flex-1 p-2 rounded-b-xl space-y-2 border border-t-0 dark:border-dark-border transition-colors ${
                            snap.isDraggingOver ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200' : col.bg + ' border-gray-100'
                          }`}>
                          {colTasks.map((task, idx) => (
                            <Draggable key={task._id} draggableId={task._id} index={idx}>
                              {(prov2, snap2) => (
                                <div ref={prov2.innerRef} {...prov2.draggableProps} {...prov2.dragHandleProps}
                                  className={`bg-white dark:bg-dark-card rounded-xl p-3 border border-gray-100 dark:border-dark-border transition-all ${
                                    snap2.isDragging ? 'shadow-xl rotate-1 scale-105 border-primary-200' : 'shadow-sm hover:shadow-md'
                                  }`}>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <p className="text-sm font-medium text-gray-800 dark:text-dark-text leading-snug">{task.title}</p>
                                    {isAdmin && (
                                      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => { setEditTask(task); setShowModal(true) }}
                                          className="p-1 text-gray-300 hover:text-primary-600 rounded transition-colors">
                                          <Edit2 size={11} />
                                        </button>
                                        <button onClick={() => handleDelete(task._id)}
                                          className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
                                          <X size={11} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-gray-400 dark:text-dark-muted mb-2 line-clamp-2">{task.description}</p>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full capitalize ${PRIORITY_STYLES[task.priority]}`}>
                                      {task.priority}
                                    </span>
                                    {task.assignedTo && (
                                      <div title={task.assignedTo.name}
                                        className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {task.assignedTo.avatar ? (
                                          <img
                                            src={task.assignedTo.avatar.startsWith('http') ? task.assignedTo.avatar : `${BACKEND_URL}${task.assignedTo.avatar}`}
                                            alt={task.assignedTo.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          task.assignedTo.name[0].toUpperCase()
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {task.dueDate && (
                                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                                      isPast(new Date(task.dueDate)) && task.status !== 'done'
                                        ? 'text-red-500' : 'text-gray-400 dark:text-dark-muted'
                                    }`}>
                                      <Calendar size={10} />
                                      {isToday(new Date(task.dueDate)) ? 'Due today' : format(new Date(task.dueDate), 'MMM d')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {prov.placeholder}
                          {colTasks.length === 0 && !snap.isDraggingOver && (
                            <div className="h-16 flex items-center justify-center text-xs text-gray-300 dark:text-dark-border border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl">
                              Drop here
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        )}

        {/* ── LIST ── */}
        {view === 'list' && (
          <div className="card overflow-hidden">
            {tasks.length === 0 ? (
              <div className="py-16 text-center">
                <ListTodo size={36} className="mx-auto mb-3 text-gray-300 dark:text-dark-border" />
                <p className="text-sm text-gray-400 dark:text-dark-muted">No tasks yet</p>
                {isAdmin && (
                  <button onClick={() => setShowModal(true)} className="mt-3 btn-primary text-sm">Add First Task</button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                    {['Task', 'Status', 'Priority', 'Assignee', 'Due Date', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => (
                    <motion.tr key={task._id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-gray-50 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/20 transition-colors group">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800 dark:text-dark-text">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-400 dark:text-dark-muted mt-0.5 truncate max-w-xs">{task.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[task.status]}`}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_STYLES[task.priority]}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {task.assignedTo.avatar ? (
                                <img
                                  src={task.assignedTo.avatar.startsWith('http') ? task.assignedTo.avatar : `${BACKEND_URL}${task.assignedTo.avatar}`}
                                  alt={task.assignedTo.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                task.assignedTo.name[0].toUpperCase()
                              )}
                            </div>
                            <span className="text-gray-600 dark:text-dark-text text-sm">{task.assignedTo.name}</span>
                          </div>
                        ) : <span className="text-gray-300 dark:text-dark-border">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {task.dueDate ? (
                          <span className={`text-xs ${
                            isPast(new Date(task.dueDate)) && task.status !== 'done'
                              ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-dark-muted'
                          }`}>
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : <span className="text-gray-300 dark:text-dark-border">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditTask(task); setShowModal(true) }}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDelete(task._id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <TaskModal
            onClose={() => { setShowModal(false); setEditTask(null) }}
            onSave={handleSave}
            editTask={editTask}
            users={members}
            defaultProjectId={id}
            projects={[project]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
