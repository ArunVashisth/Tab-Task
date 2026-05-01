import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import { Zap, Users, BarChart2, Mail, Lock, User, ArrowRight, X, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const termsText = (
  <div className="space-y-4">
    <p><strong>Last Updated:</strong> 1-May-2026</p>
    <p>Welcome to Taskora, a product of Tab Task. By accessing or using this platform, you agree to comply with and be bound by the following Terms & Conditions.</p>
    
    <h3 className="font-bold text-gray-900 text-lg mt-6">1. Acceptance of Terms</h3>
    <p>By creating an account or using Taskora, you agree to these Terms & Conditions. If you do not agree, you must not use the platform.</p>

    <h3 className="font-bold text-gray-900 text-lg mt-6">2. User Accounts</h3>
    <ul className="list-disc pl-5 space-y-1">
      <li>You must provide accurate and complete information during registration</li>
      <li>You are responsible for maintaining the confidentiality of your account credentials</li>
      <li>You are responsible for all activities under your account</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">3. Use of the Platform</h3>
    <p>You agree to use Taskora only for lawful purposes. You must not:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Attempt unauthorized access to the system</li>
      <li>Upload harmful, illegal, or abusive content</li>
      <li>Interfere with platform functionality or security</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">4. Role-Based Access</h3>
    <ul className="list-disc pl-5 space-y-1">
      <li>Admin users have permission to manage projects, tasks, and users</li>
      <li>Member users have limited access based on assigned roles</li>
      <li>Unauthorized attempts to gain elevated access are prohibited</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">5. Project and Task Data</h3>
    <ul className="list-disc pl-5 space-y-1">
      <li>Users are responsible for the data they create and manage</li>
      <li>Tab Task is not liable for any data loss caused by user actions</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">6. Intellectual Property</h3>
    <p>All platform features, design, and system architecture (excluding user-generated content) are owned by Tab Task and protected by applicable laws.</p>

    <h3 className="font-bold text-gray-900 text-lg mt-6">7. Account Termination</h3>
    <p>Tab Task reserves the right to suspend or terminate accounts if:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Terms are violated</li>
      <li>Suspicious or harmful activity is detected</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">8. Limitation of Liability</h3>
    <p>Taskora is provided "as is" without warranties. Tab Task is not liable for:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Data loss</li>
      <li>Service interruptions</li>
      <li>Indirect or consequential damages</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">9. Modifications</h3>
    <p>We may update these Terms at any time. Continued use of the platform indicates acceptance of the updated terms.</p>

    <h3 className="font-bold text-gray-900 text-lg mt-6">10. Contact</h3>
    <p>For any questions regarding these Terms & Conditions:<br />📧 arunvashisth80@gmail.com</p>
  </div>
)

const privacyText = (
  <div className="space-y-4">
    <p><strong>Last Updated:</strong> 1-May-2026</p>
    <p>Taskora, operated by Tab Task, respects your privacy and is committed to protecting your personal data.</p>
    
    <h3 className="font-bold text-gray-900 text-lg mt-6">1. Information We Collect</h3>
    <p>We may collect:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Name and email address</li>
      <li>Account credentials (securely encrypted)</li>
      <li>Project and task-related data</li>
      <li>Basic usage data for improving services</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">2. How We Use Information</h3>
    <p>Your data is used to:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Provide and maintain the platform</li>
      <li>Authenticate users</li>
      <li>Enable project and task management features</li>
      <li>Improve overall user experience</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">3. Data Security</h3>
    <ul className="list-disc pl-5 space-y-1">
      <li>Passwords are encrypted using secure methods</li>
      <li>We follow industry-standard security practices</li>
      <li>Despite this, no system is completely immune to risks</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">4. Data Sharing</h3>
    <p>We do NOT sell or trade your personal data. Data may only be shared:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>When required by law</li>
      <li>To ensure platform security and integrity</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">5. User Rights</h3>
    <p>You have the right to:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Access your personal data</li>
      <li>Update or correct your information</li>
      <li>Request deletion of your account</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">6. Cookies and Authentication</h3>
    <p>We may use cookies or tokens for:</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Login sessions</li>
      <li>Authentication and security</li>
    </ul>

    <h3 className="font-bold text-gray-900 text-lg mt-6">7. Data Retention</h3>
    <p>Your data is retained as long as your account is active or necessary for service operation.</p>

    <h3 className="font-bold text-gray-900 text-lg mt-6">8. Third-Party Services</h3>
    <p>We may use trusted third-party services (hosting, database providers), which comply with their own privacy policies.</p>

    <h3 className="font-bold text-gray-900 text-lg mt-6">9. Updates to Policy</h3>
    <p>We may update this Privacy Policy from time to time. Continued use of the platform indicates acceptance of updates.</p>

    <h3 className="font-bold text-gray-900 text-lg mt-6">10. Contact</h3>
    <p>For any privacy-related concerns:<br />📧 arunvashisth80@gmail.com</p>
  </div>
)

export default function Signup() {
  const location = useLocation()
  const [formData, setFormData] = useState({ 
    name: '', 
    email: location.state?.email || '', 
    password: '', 
    terms: true 
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showOTP, setShowOTP] = useState(location.state?.showOTP || false)
  const [otp, setOtp] = useState('')
  const [modalContent, setModalContent] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userStr = params.get('user')
    const error = params.get('error')

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        login(token, user)
        toast.success(`Welcome, ${user.name}!`)
        navigate('/dashboard')
      } catch (err) {
        toast.error('Authentication failed')
      }
    } else if (error) {
      toast.error('Google signup failed')
    }
  }, [login, navigate])

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/google`;
  }

  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Full name is required'
    if (!formData.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (!formData.terms) errs.terms = 'You must agree to the terms'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const { terms, ...signupData } = formData
      await authService.signup(signupData)
      setShowOTP(true)
      toast.success('Verification code sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }
    setLoading(true)
    try {
      const res = await authService.verifyOTP({ email: formData.email, otp })
      login(res.data.token, res.data.user)
      toast.success(`Welcome to TAB TASK, ${res.data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    try {
      await authService.resendOTP({ email: formData.email })
      toast.success('New code sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData(prev => ({ ...prev, [e.target.name]: value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const features = [
    { icon: Zap, title: 'Instant Setup', desc: 'Get started in under 60 seconds' },
    { icon: Users, title: 'Team Collaboration', desc: 'Invite unlimited team members' },
    { icon: BarChart2, title: 'Advanced Analytics', desc: 'Real-time insights and reporting' }
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative overflow-hidden font-sans">
      {/* Subtle radial gradient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Left Column */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 lg:p-20 relative z-10 border-r border-gray-100/50">
        <div>
          <div className="flex items-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain object-left scale-125 origin-left" />
          </div>
        </div>

        <div className="max-w-xl py-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-5xl font-bold text-gray-900 leading-[1.15] mb-6 pr-4"
          >
            Join the future of project management
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 mb-10 leading-relaxed pr-8"
          >
            Experience seamless collaboration, intelligent automation, and powerful insights—all in one platform.
          </motion.p>

          <div className="space-y-4">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div 
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-gray-100 backdrop-blur-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{f.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain scale-125" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="w-full max-w-[440px] bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 sm:p-10 my-auto"
        >
          {!showOTP ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
                <p className="text-gray-500 text-sm">Start managing projects like a pro</p>
              </div>

              <div className="space-y-4 mb-8">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.09H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.91l3.66-2.8z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.09l3.66 2.84c.87-2.6 3.3-4.55 6.16-4.55z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-gray-400 font-medium tracking-wider">Or register with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="name" name="name" type="text"
                      value={formData.name} onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Work email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email" name="email" type="email"
                      value={formData.email} onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm`}
                      placeholder="name@company.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password" name="password" type="password"
                      value={formData.password} onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm`}
                      placeholder="Create a strong password"
                    />
                  </div>
                  {errors.password ? (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
                  ) : (
                    <p className="mt-1.5 text-[13px] text-gray-500">Must be at least 8 characters</p>
                  )}
                </div>

                <div className="flex items-start pt-2">
                  <input
                    id="terms" name="terms" type="checkbox"
                    checked={formData.terms} onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="terms" className="ml-2.5 text-sm text-gray-600">
                    I agree to the <button type="button" onClick={() => setModalContent('terms')} className="font-semibold text-blue-600 hover:underline">Terms of Service</button> and <button type="button" onClick={() => setModalContent('privacy')} className="font-semibold text-blue-600 hover:underline">Privacy Policy</button>
                  </label>
                </div>
                {errors.terms && <p className="mt-1 text-xs text-red-500 font-medium ml-6">{errors.terms}</p>}

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Get started free <ArrowRight size={16} /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                <p className="text-gray-500 text-sm">
                  We've sent a 6-digit verification code to <span className="font-semibold text-gray-900">{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 text-center mb-4">Verification Code</label>
                  <input
                    id="otp" type="text" maxLength={6}
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[1em] text-2xl font-bold py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                <button
                  type="submit" disabled={loading || otp.length !== 6}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Verify Account <ArrowRight size={18} /></>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
                  <button
                    type="button" onClick={handleResendOTP} disabled={loading}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                  >
                    Resend Verification Code
                  </button>
                </div>

                <button
                  type="button" onClick={() => setShowOTP(false)}
                  className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Back to signup
                </button>
              </form>
            </>
          )}

          <div className="mt-8 text-center border-t border-gray-50 pt-6">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>

        <p className="text-xs text-gray-500 font-medium mt-8 flex items-center justify-center gap-1.5">
          <Lock size={12} className="text-yellow-600" />
          Your data is encrypted and secure. No credit card required.
        </p>
      </div>

      <AnimatePresence>
        {modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setModalContent(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalContent === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                </h2>
                <button onClick={() => setModalContent(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto text-sm text-gray-600 custom-scrollbar">
                {modalContent === 'terms' ? termsText : privacyText}
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end">
                <button onClick={() => setModalContent(null)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm">
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
