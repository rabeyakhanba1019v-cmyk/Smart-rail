import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="pt-16">
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
              <h1 className="text-4xl font-bold text-white mb-4">Get In Touch</h1>
              <p className="text-gray-400 text-lg">Have a question or need help? We're here for you.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact info */}
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
                  <p className="text-gray-400 leading-relaxed">
                    Our support team is available 7 days a week to help with ticket disputes, fraud reports, and technical issues.
                  </p>
                </div>
                {[
                  { icon: <Mail size={20} />, title: 'Email', value: 'support@bdrailwayexchange.com', color: 'text-cyan-400' },
                  { icon: <Phone size={20} />, title: 'Phone', value: '+880 1700-000000', color: 'text-emerald-400' },
                  { icon: <MapPin size={20} />, title: 'Address', value: 'Kamalapur, Dhaka 1000, Bangladesh', color: 'text-yellow-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">{item.title}</p>
                      <p className="text-white font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}

                <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-xl p-5 mt-6">
                  <p className="text-white font-semibold mb-1">Response Time</p>
                  <p className="text-gray-400 text-sm">We typically respond within 2-4 hours during business hours (9 AM - 8 PM BST).</p>
                </div>
              </motion.div>

              {/* Form */}
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                {submitted ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={28} className="text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                    <p className="text-gray-400">We'll get back to you as soon as possible.</p>
                    <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                      className="mt-4 text-cyan-400 text-sm hover:text-cyan-300 transition-colors">Send another message</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="bg-gray-900/60 border border-white/5 rounded-xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-xs mb-1.5">Your Name</label>
                        <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="John Doe" className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-xs mb-1.5">Email</label>
                        <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="you@example.com" className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1.5">Subject</label>
                      <input required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                        placeholder="How can we help?" className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1.5">Message</label>
                      <textarea required rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                        placeholder="Describe your issue or question in detail..." className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all resize-none" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-gray-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2">
                      <Send size={16} /> Send Message
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
