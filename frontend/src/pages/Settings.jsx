import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { userService } from '../services'
import { Moon, Sun, Lock, Eye, EyeOff, Shield, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { isDark, toggleTheme } = useTheme()
  const { currentUser } = useAuth()
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [savingPassword, setSavingPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const validatePassword = () => {
    const errs = {}
    if (!passwordForm.currentPassword) errs.currentPassword = 'Current password required'
    if (!passwordForm.newPassword) errs.newPassword = 'New password required'
    else if (passwordForm.newPassword.length < 6) errs.newPassword = 'Min 6 characters'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const errs = validatePassword()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSavingPassword(true)
    try {
      await userService.updatePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      toast.success('Password updated successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const toggleField = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const sections = [
    { icon: Sun, title: 'Appearance', delay: 0.1 },
    { icon: Lock, title: 'Security', delay: 0.2 },
    { icon: Info, title: 'Account Info', delay: 0.3 }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl space-y-6"
    >
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Settings</h1>
        <p className="text-gray-500 dark:text-dark-muted text-sm mt-1">Manage your preferences and account security</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6 space-y-4"
      >
        <h2 className="font-semibold text-gray-800 dark:text-dark-text flex items-center gap-2">
          <Sun size={16} className="text-amber-500" />
          Appearance
        </h2>
        <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-dark-border">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-dark-text">Dark Mode</p>
            <p className="text-xs text-gray-400 dark:text-dark-muted mt-0.5">Switch between light and dark theme</p>
          </div>
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.95 }}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isDark ? 'bg-primary-600' : 'bg-gray-200'}`}
          >
            <motion.div
              animate={{ x: isDark ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center"
            >
              {isDark ? <Moon size={10} className="text-primary-600" /> : <Sun size={10} className="text-amber-500" />}
            </motion.div>
          </motion.button>
        </div>
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-gray-500 dark:text-dark-muted">Current Theme</p>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${isDark ? 'bg-dark-border text-dark-text' : 'bg-gray-100 text-gray-600'}`}>
            {isDark ? 'Dark mode' : 'Light mode'}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6 space-y-4"
      >
        <h2 className="font-semibold text-gray-800 dark:text-dark-text flex items-center gap-2">
          <Lock size={16} className="text-primary-500" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {[
            { name: 'currentPassword', label: 'Current Password', field: 'current' },
            { name: 'newPassword', label: 'New Password', field: 'new' },
            { name: 'confirmPassword', label: 'Confirm New Password', field: 'confirm' }
          ].map(({ name, label, field }, index) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.08 }}
            >
              <label className="label">{label}</label>
              <div className="relative">
                <input
                  name={name} type={showPasswords[field] ? 'text' : 'password'}
                  value={passwordForm[name]} onChange={handlePasswordChange}
                  className={`input-field pr-10 ${errors[name] ? 'border-red-400' : ''}`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => toggleField(field)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPasswords[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
            </motion.div>
          ))}
          <motion.button
            type="submit" disabled={savingPassword}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {savingPassword ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</> : 'Update Password'}
          </motion.button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h2 className="font-semibold text-gray-800 dark:text-dark-text flex items-center gap-2 mb-4">
          <Shield size={16} className="text-violet-500" />
          Account Info
        </h2>
        <div className="space-y-0">
          {[
            { label: 'Account Type', value: currentUser?.role === 'admin' ? 'Admin' : 'Member' },
            { label: 'Email', value: currentUser?.email },
            { label: 'User ID', value: currentUser?._id }
          ].map(({ label, value }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + index * 0.07 }}
              className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-dark-border last:border-0"
            >
              <p className="text-sm text-gray-500 dark:text-dark-muted">{label}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-dark-text font-mono text-right truncate max-w-[200px]">{value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
