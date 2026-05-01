import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services'
import { BACKEND_URL } from '../services/api'
import { User, Mail, Calendar, AtSign, Camera, Trash2, Loader, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import CropModal from '../components/CropModal'

// ── Avatar Section ──────────────────────────────────────────────────────────
function AvatarSection({ currentUser, onUpdate }) {
  const fileRef = useRef(null)

  // rawSrc = object URL of the originally picked file (fed into CropModal)
  const [rawSrc, setRawSrc]           = useState(null)
  // croppedBlob = blob returned by CropModal after Apply
  const [croppedBlob, setCroppedBlob] = useState(null)
  // previewUrl = local URL shown before saving
  const [previewUrl, setPreviewUrl]   = useState(null)

  const [showCrop, setShowCrop]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving]   = useState(false)

  const savedAvatarSrc = currentUser?.avatar
    ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${BACKEND_URL}${currentUser.avatar}`)
    : null
  const displaySrc     = previewUrl || savedAvatarSrc   // show preview while pending, else saved

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  // Step 1: user picks a file → open CropModal
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return }
    const url = URL.createObjectURL(file)
    setRawSrc(url)
    setShowCrop(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Step 2: CropModal returns blob → store + show preview
  const handleCropDone = (blob) => {
    setCroppedBlob(blob)
    const prev = URL.createObjectURL(blob)
    setPreviewUrl(prev)
    setShowCrop(false)
    if (rawSrc) URL.revokeObjectURL(rawSrc)
    setRawSrc(null)
  }

  const handleCropCancel = () => {
    setShowCrop(false)
    if (rawSrc) URL.revokeObjectURL(rawSrc)
    setRawSrc(null)
  }

  // Step 3: upload the cropped blob
  const handleUpload = async () => {
    if (!croppedBlob) return
    setUploading(true)
    try {
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })
      const res  = await userService.uploadAvatar(file)
      onUpdate(res.data)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setCroppedBlob(null)
      setPreviewUrl(null)
      toast.success('Profile picture updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setUploading(false) }
  }

  const handleCancel = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setCroppedBlob(null)
    setPreviewUrl(null)
  }

  const handleRemove = async () => {
    if (!currentUser?.avatar) return
    setRemoving(true)
    try {
      const res = await userService.deleteAvatar()
      onUpdate(res.data)
      toast.success('Profile picture removed')
    } catch { toast.error('Failed to remove') }
    finally { setRemoving(false) }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {/* Avatar circle */}
        <div className="relative group">
          <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white dark:ring-dark-border shadow-lg">
            {displaySrc ? (
              <img src={displaySrc} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </div>
            )}
          </div>

          {/* Camera overlay */}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera size={22} className="text-white" />
          </motion.button>

          {/* Camera badge */}
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center shadow-md transition-colors">
            <Camera size={13} className="text-white" />
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* Pending actions */}
        <AnimatePresence>
          {croppedBlob && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={handleUpload} disabled={uploading}
                  className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5">
                  {uploading ? <Loader size={12} className="animate-spin" /> : <Camera size={12} />}
                  {uploading ? 'Uploading…' : 'Save photo'}
                </motion.button>
                <button onClick={() => { setShowCrop(true); setRawSrc(URL.createObjectURL(croppedBlob)) }}
                  className="btn-secondary text-xs px-3 py-1.5">
                  Re-crop
                </button>
                <button onClick={handleCancel} className="btn-secondary text-xs px-3 py-1.5">Discard</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remove */}
        {currentUser?.avatar && !croppedBlob && (
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={handleRemove} disabled={removing}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors">
            {removing ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {removing ? 'Removing…' : 'Remove photo'}
          </motion.button>
        )}

        <p className="text-xs text-gray-400 dark:text-dark-muted text-center">
          JPG, PNG, WEBP or GIF · Max 10 MB
        </p>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {showCrop && rawSrc && (
          <CropModal
            imageSrc={rawSrc}
            onDone={handleCropDone}
            onCancel={handleCropCancel}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Profile Page ─────────────────────────────────────────────────────────────
export default function Profile() {
  const { currentUser, updateCurrentUser } = useAuth()
  const [form, setForm] = useState({
    name:     currentUser?.name     || '',
    username: currentUser?.username || '',
    email:    currentUser?.email    || ''
  })
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPw, setShowPw]   = useState(false)
  const [saving, setSaving]   = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [errors, setErrors]   = useState({})
  const [pwErrors, setPwErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    if (form.username && !/^[a-z0-9_]+$/i.test(form.username)) errs.username = 'Letters, numbers, underscores only'
    if (form.username && form.username.length < 3) errs.username = 'At least 3 characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const res = await userService.updateProfile({ name: form.name, email: form.email, username: form.username || '' })
      updateCurrentUser(res.data)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally { setSaving(false) }
  }

  const handlePwSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.currentPassword) errs.currentPassword = 'Required'
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) errs.newPassword = 'At least 6 characters'
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setSavingPw(true)
    try {
      await userService.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally { setSavingPw(false) }
  }

  const handleChange = (e) => {
    const value = e.target.name === 'username'
      ? e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
      : e.target.value
    setForm(p => ({ ...p, [e.target.name]: value }))
    if (errors[e.target.name]) setErrors(p => ({ ...p, [e.target.name]: '' }))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Profile</h1>
        <p className="text-gray-500 dark:text-dark-muted text-sm mt-1">Manage your identity and account settings</p>
      </div>

      {/* ── Avatar + Info ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <AvatarSection currentUser={currentUser} onUpdate={updateCurrentUser} />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text">{currentUser?.name}</h2>
            {currentUser?.username && (
              <p className="text-primary-500 dark:text-primary-400 text-sm">@{currentUser.username}</p>
            )}
            <p className="text-gray-500 dark:text-dark-muted text-sm mt-0.5">{currentUser?.email}</p>
            <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${
              currentUser?.role === 'admin'
                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                : 'bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-dark-muted'
            }`}>{currentUser?.role === 'admin' ? 'Admin' : 'Member'}</span>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
              {[
                { icon: Mail, label: 'Email', value: currentUser?.email },
                { icon: Calendar, label: 'Joined', value: currentUser?.createdAt ? format(new Date(currentUser.createdAt), 'MMM d, yyyy') : '' }
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon size={13} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 dark:text-dark-muted">{label}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Edit Profile ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="card p-6">
        <h3 className="font-semibold text-gray-800 dark:text-dark-text mb-4">Edit Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="name" value={form.name} onChange={handleChange}
                className={`input-field pl-9 ${errors.name ? 'border-red-400' : ''}`} placeholder="Your full name" />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="label">
              Username <span className="text-gray-400 font-normal text-xs">(unique · used to receive invites)</span>
            </label>
            <div className="relative">
              <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="username" value={form.username} onChange={handleChange} maxLength={30}
                className={`input-field pl-9 ${errors.username ? 'border-red-400' : ''}`}
                placeholder="e.g. john_doe" />
            </div>
            {errors.username
              ? <p className="mt-1 text-xs text-red-500">{errors.username}</p>
              : <p className="mt-1 text-xs text-gray-400">Letters, numbers, underscores. Leave blank to remove.</p>}
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className={`input-field pl-9 ${errors.email ? 'border-red-400' : ''}`} placeholder="your@email.com" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn-primary text-sm flex items-center gap-2">
            {saving ? <><Loader size={13} className="animate-spin" />Saving…</> : 'Save Changes'}
          </motion.button>
        </form>
      </motion.div>

      {/* ── Change Password ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="card p-6">
        <h3 className="font-semibold text-gray-800 dark:text-dark-text mb-4">Change Password</h3>
        <form onSubmit={handlePwSubmit} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
            { key: 'newPassword',     label: 'New Password',     placeholder: 'At least 6 characters' },
            { key: 'confirmPassword', label: 'Confirm Password', placeholder: 'Repeat new password' }
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={e => { setPwForm(p => ({ ...p, [key]: e.target.value })); if (pwErrors[key]) setPwErrors(p => ({ ...p, [key]: '' })) }}
                  className={`input-field pr-10 ${pwErrors[key] ? 'border-red-400' : ''}`}
                  placeholder={placeholder}
                />
                {key === 'confirmPassword' && (
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
              {pwErrors[key] && <p className="mt-1 text-xs text-red-500">{pwErrors[key]}</p>}
            </div>
          ))}
          <motion.button type="submit" disabled={savingPw} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn-primary text-sm flex items-center gap-2">
            {savingPw ? <><Loader size={13} className="animate-spin" />Updating…</> : 'Update Password'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}
