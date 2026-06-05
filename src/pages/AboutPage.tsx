import { motion } from 'framer-motion';
import { Brain as Train, Shield, Zap, Users, Star, CheckCircle, Brain, Lock } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <section className="py-20 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          </div>
          <div className="max-w-3xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-400/25">
                <Train size={32} className="text-gray-950" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Bangladesh Railway Exchange</h1>
              <p className="text-xl text-cyan-400 font-medium mb-6">AI-Powered Secure Ticket Marketplace</p>
              <p className="text-gray-400 leading-relaxed text-lg">
                We're building Bangladesh's most trusted platform for railway ticket trading — combining advanced AI technology with community-driven trust to make every transaction safe and seamless.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 px-4 bg-gray-900/30">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <span className="text-cyan-400 text-sm font-medium uppercase tracking-wider">Our Mission</span>
                <h2 className="text-3xl font-bold text-white mt-2 mb-4">Making Railway Travel More Accessible</h2>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Every day, thousands of Bangladeshis face the challenge of last-minute travel plans, cancelled trips, and sold-out trains. We believe there's a better way — a marketplace where tickets can be safely traded between travelers.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  By combining verified profiles, escrow payments, and smart meetup coordination, we've created a platform where trust is built in — not bolted on.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="space-y-4">
                {[
                  { icon: <Shield size={20} />, title: 'Verified Profiles', desc: 'Every seller is verified with trust scores and ratings', color: 'text-cyan-400' },
                  { icon: <Lock size={20} />, title: 'Escrow Protection', desc: 'Funds held securely until both parties confirm', color: 'text-emerald-400' },
                  { icon: <Users size={20} />, title: 'Community Trust', desc: 'Ratings and trust scores built on real transactions', color: 'text-yellow-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-gray-900/60 border border-white/5 rounded-xl">
                    <div className={`w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{item.title}</p>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '12,400+', label: 'Tickets Traded', icon: <Train size={20} /> },
                { value: '8,900+', label: 'Active Users', icon: <Users size={20} /> },
                { value: '99.2%', label: 'Safe Transaction Rate', icon: <Shield size={20} /> },
                { value: '4.9/5', label: 'User Satisfaction', icon: <Star size={20} /> },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-gray-900/60 border border-white/5 rounded-xl p-6">
                  <span className="text-cyan-400">{stat.icon}</span>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4 bg-gray-900/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white">Our Core Values</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <Shield size={24} />, title: 'Security First', desc: 'Every feature we build starts with security and user protection at its core.', color: 'cyan' },
                { icon: <Zap size={24} />, title: 'Fast & Simple', desc: 'We make ticket trading as simple and fast as possible for Bangladesh travelers.', color: 'emerald' },
                { icon: <Users size={24} />, title: 'Community', desc: 'Our platform grows stronger with every review and rating from our users.', color: 'yellow' },
                { icon: <CheckCircle size={24} />, title: 'Transparency', desc: 'We show verification badges and trust ratings openly to all users.', color: 'cyan' },
                { icon: <Lock size={24} />, title: 'Trust', desc: 'Escrow payments mean neither party has to trust blindly — the system protects both.', color: 'emerald' },
                { icon: <Train size={24} />, title: 'Accessibility', desc: 'Making railway travel more flexible and accessible for every Bangladeshi traveler.', color: 'yellow' },
              ].map((val, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className={`p-6 bg-gradient-to-br border rounded-xl ${
                    val.color === 'cyan' ? 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20' :
                    val.color === 'emerald' ? 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20' :
                    'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20'
                  }`}>
                  <span className={val.color === 'cyan' ? 'text-cyan-400' : val.color === 'emerald' ? 'text-emerald-400' : 'text-yellow-400'}>
                    {val.icon}
                  </span>
                  <h3 className="text-white font-bold mt-3 mb-2">{val.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{val.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
