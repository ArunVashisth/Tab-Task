import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import { CheckCircle2, Mail, Lock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')
    const error = searchParams.get('error')

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
      toast.error('Google login failed')
    }
  }, [searchParams, login, navigate])

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/google`;
  }

  const validate = () => {
    const errs = {}
    if (!formData.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await authService.login(formData)
      login(res.data.token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isUnverified) {
        toast.error('Please verify your account first')
        navigate('/signup', { state: { email: formData.email, showOTP: true } })
      } else {
        toast.error(err.response?.data?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative overflow-hidden font-sans">
      {/* Subtle radial gradient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Left Column */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-20 relative z-10">
        <div>
          <div className="flex items-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain object-left scale-125 origin-left" />
          </div>
        </div>

        <div className="max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-5xl lg:text-[56px] font-bold text-gray-900 leading-[1.1] mb-6"
          >
            Empower your team with seamless collaboration
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 mb-10 leading-relaxed"
          >
            Join thousands of organizations streamlining their workflows with TAB TASK's intelligent project management platform.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-y-4 gap-x-8 mb-12"
          >
            {[
              'Real-time collaboration', 'Advanced analytics',
              'Secure & compliant', '24/7 support'
            ].map(feature => (
              <div key={feature} className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                <span className="text-sm font-medium text-gray-700">{feature}</span>
              </div>
            ))}
          </motion.div>

          <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-10" />


        </div>

        <div className="mt-8">
          <p className="text-xs font-medium text-gray-400 mb-4">Trusted by leading organizations worldwide</p>
          <div className="flex items-center gap-8 opacity-40 grayscale">
            <span className="font-bold text-xl">SmartResQ</span>
            <span className="font-bold text-xl font-serif">TechGather</span>
            <span className="font-bold text-xl tracking-widest">ExpressKart</span>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain scale-125" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="w-full max-w-[440px] bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 sm:p-10"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          <div className="space-y-4">
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
              Sign in with Google
            </button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-medium tracking-wider">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  value={formData.email} onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm`}
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password" name="password" type="password" autoComplete="current-password"
                  value={formData.password} onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm`}
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>}
            </div>

            <div className="flex items-center pt-1 pb-2">
              <input
                id="remember" type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-70"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in to your account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Start free trial
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
