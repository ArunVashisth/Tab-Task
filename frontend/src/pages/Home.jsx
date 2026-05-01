import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, CheckCircle2, Layout, Users, Zap, 
  BarChart3, Shield, Globe, Star, Menu, X 
} from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="font-bold text-xl tracking-tight text-gray-900">TAB TASK</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Features</a>
            <a href="#solutions" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="px-5 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              Get Started free
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 p-6 flex flex-col gap-6 shadow-xl"
            >
              <a href="#features" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#solutions" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Solutions</a>
              <a href="#pricing" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</a>
              <div className="h-px bg-gray-100" />
              <Link to="/login" className="text-lg font-medium">Log in</Link>
              <Link to="/signup" className="py-4 bg-blue-600 text-white text-center font-bold rounded-xl">Get Started free</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            Empowering 10,000+ teams worldwide
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl lg:text-[84px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-8"
          >
            Master your projects,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">empower your team.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl leading-relaxed mb-10"
          >
            The all-in-one platform for high-performing teams to organize work, track progress, and ship products faster.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/signup" className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-2 transition-all active:scale-95 text-lg">
              Get Started for Free <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-white border border-gray-200 hover:border-blue-600 text-gray-700 font-bold rounded-2xl transition-all active:scale-95 text-lg">
              Sign in
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="mt-20 flex flex-col items-center"
          >
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Trusted by industry leaders</p>
            <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              <span className="text-2xl font-black italic">SmartResQ</span>
              <span className="text-2xl font-bold font-serif">TechGather</span>
              <span className="text-2xl font-black tracking-tighter">EXPRESS KART</span>
              <span className="text-2xl font-bold font-mono">GLOBAL TECH</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 bg-gray-50/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to ship faster</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Focus on what matters. We'll handle the rest with intelligent automation and real-time insights.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Layout, 
                title: 'Visual Workflow', 
                desc: 'Manage tasks with flexible Kanban boards and list views tailored to your team style.',
                color: 'bg-blue-500'
              },
              { 
                icon: Users, 
                title: 'Team Collaboration', 
                desc: 'Invite unlimited members, assign roles, and communicate seamlessly in one place.',
                color: 'bg-indigo-500'
              },
              { 
                icon: BarChart3, 
                title: 'Insightful Analytics', 
                desc: 'Track productivity and deadlines with real-time charts and deficiency reports.',
                color: 'bg-emerald-500'
              }
            ].map((feature, i) => (
              <motion.div 
                key={feature.title}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center text-white mb-8 shadow-lg`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Split - High Fidelity Text */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}>
              <div className="w-12 h-1 bg-blue-600 mb-8 rounded-full" />
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-8">
                Designed for teams that <br />
                <span className="text-blue-600">move with velocity.</span>
              </h2>
              <div className="space-y-6">
                {[
                  'Stay on top of deadlines with automated reminders.',
                  'Organize projects into customizable folders.',
                  'Secure data storage with enterprise-grade protection.',
                  'Access your work anywhere with cloud syncing.'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="text-blue-600 shrink-0" size={20} />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/signup" className="mt-12 inline-flex items-center gap-2 font-bold text-blue-600 hover:gap-4 transition-all">
                Learn more about our platform <ArrowRight size={20} />
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              className="relative p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] shadow-2xl"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400 rounded-full blur-[80px] opacity-40 pointer-events-none" />
              <div className="bg-white/10 backdrop-blur-xl rounded-[30px] p-6 text-white">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                    <div className="w-3 h-3 rounded-full bg-green-400/50" />
                  </div>
                  <span className="text-xs font-bold opacity-60 tracking-widest uppercase">Project Overview</span>
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-white/10 rounded-lg w-3/4" />
                  <div className="h-8 bg-white/10 rounded-lg w-full" />
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="h-24 bg-white/10 rounded-2xl" />
                    <div className="h-24 bg-white/10 rounded-2xl" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 mb-6 grayscale invert">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
                <span className="font-bold text-xl tracking-tight text-white">TAB TASK</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                The world's most intuitive task management platform for teams who want to build amazing things together.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 lg:gap-24">
              <div>
                <h4 className="text-white font-bold mb-6">Product</h4>
                <ul className="space-y-4 text-gray-400 text-sm font-medium">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Mobile</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-6">Company</h4>
                <ul className="space-y-4 text-gray-400 text-sm font-medium">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <h4 className="text-white font-bold mb-6">Connect</h4>
                <ul className="space-y-4 text-gray-400 text-sm font-medium">
                  <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Github</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-sm">© 2026 Tab Task Inc. All rights reserved.</p>
            <div className="flex gap-8 text-gray-500 text-sm font-medium">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


