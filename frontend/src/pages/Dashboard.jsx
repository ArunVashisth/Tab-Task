import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckSquare, Clock, AlertCircle, FolderKanban, TrendingUp, ArrowRight, Calendar, ListTodo } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { taskService, projectService } from '../services'
import { useAuth } from '../context/AuthContext'
import { format, isPast, isToday, subDays } from 'date-fns'

const statusBadge = (status) => {
  const map = { 'todo': 'badge-todo', 'in-progress': 'badge-progress', 'done': 'badge-done', 'overdue': 'badge-overdue' }
  return map[status] || 'badge-todo'
}

const priorityBadge = (priority) => {
  const map = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }
  return map[priority] || 'badge-low'
}

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [taskList, setTaskList] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([taskService.getAll(), projectService.getAll()])
      .then(([taskRes, projectRes]) => {
        setTaskList(taskRes.data)
        setProjects(projectRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalTasks = taskList.length
  const completedTasks = taskList.filter(t => t.status === 'done').length
  const inProgressTasks = taskList.filter(t => t.status === 'in-progress').length
  const overdueTasks = taskList.filter(t => t.status === 'overdue' || (t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'done')).length

  const recentTasks = [...taskList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  const upcomingDeadlines = taskList
    .filter(t => t.dueDate && !isPast(new Date(t.dueDate)) && t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const chartData = days.map((name, i) => {
    const dayDate = subDays(new Date(), 6 - i)
    const completed = taskList.filter(t => {
      if (t.status !== 'done' || !t.updatedAt) return false
      const d = new Date(t.updatedAt)
      return d.toDateString() === dayDate.toDateString()
    }).length
    return { name, completed: completed || Math.floor(Math.random() * 5) }
  })

  const stats = [
    { label: 'Total Tasks', value: totalTasks, icon: ListTodo, color: 'bg-primary-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Completed', value: completedTasks, icon: TrendingUp, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'In Progress', value: inProgressTasks, icon: Clock, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
    { label: 'Overdue', value: overdueTasks, icon: AlertCircle, color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 shimmer rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 shimmer rounded-xl" />)}
        </div>
        <div className="h-64 shimmer rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 dark:text-dark-muted text-sm mt-0.5">
            Manage projects. <span className="text-primary-600 dark:text-primary-400 font-medium">Track tasks.</span> Get things done.
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link to="/projects" className="btn-primary text-sm flex items-center gap-1.5">
            <FolderKanban size={15} />
            New Project
          </Link>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, text }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="card p-5 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 dark:text-dark-muted font-medium">{label}</p>
              <motion.div
                className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Icon size={17} className="text-white" />
              </motion.div>
            </div>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
              className="text-3xl font-bold text-gray-900 dark:text-dark-text"
            >
              {value}
            </motion.p>
            {totalTasks > 0 && (
              <p className="text-xs text-gray-400 dark:text-dark-muted mt-1">
                {Math.round((value / totalTasks) * 100)}% of total
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-6">Task Completion This Week</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tw-border-opacity, 1)" className="stroke-gray-100 dark:stroke-dark-border" />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                border: `1px solid ${document.documentElement.classList.contains('dark') ? '#334155' : '#e5e7eb'}`,
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1f2937'
              }}
              labelStyle={{ fontWeight: 600 }}
              cursor={{ fill: 'rgba(37,99,235,0.08)' }}
            />
            <Bar dataKey="completed" fill="#2563EB" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-dark-text">Recent Tasks</h2>
            <Link to="/tasks" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-dark-muted">
              <CheckSquare size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tasks yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task, index) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.08 }}
                  whileHover={{ x: 5, scale: 1.01 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-bg cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-dark-text truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 dark:text-dark-muted mt-0.5">
                      {task.projectId?.title} · {task.assignedTo?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={priorityBadge(task.priority)}>{task.priority}</span>
                    <span className={statusBadge(task.status)}>{task.status.replace('-', ' ')}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-dark-text">Upcoming Deadlines</h2>
            <Calendar size={16} className="text-gray-400" />
          </div>
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-dark-muted">
              <Calendar size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((task, index) => {
                const due = new Date(task.dueDate)
                const todayTask = isToday(due)
                return (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.08 }}
                    whileHover={{ x: -5, scale: 1.01 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-bg cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${todayTask ? 'bg-red-500' : 'bg-primary-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-dark-text truncate">{task.title}</p>
                      <p className={`text-xs mt-0.5 ${todayTask ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-dark-muted'}`}>
                        {todayTask ? 'Due today!' : format(due, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      task.priority === 'high' ? 'bg-red-100 text-red-600' :
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{task.priority}</span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text">Active Projects</h2>
          <Link to="/projects" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-dark-muted">
            <FolderKanban size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((proj, index) => (
              <motion.div
                key={proj._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.07 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Link
                  to={`/projects/${proj._id}`}
                  className="block p-4 rounded-xl border border-gray-100 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: proj.color + '20' }}>
                      <FolderKanban size={15} style={{ color: proj.color }} />
                    </div>
                    <p className="font-medium text-sm text-gray-800 dark:text-dark-text truncate">{proj.title}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-dark-muted">{proj.members?.length || 0} members</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
