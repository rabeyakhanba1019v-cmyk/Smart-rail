import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Brain as Train, Shield, Zap, Users, Star, ChevronDown, ArrowRight, CheckCircle, MessageSquare, MapPin, CreditCard, Eye, TrendingUp } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const features = [
  {
    icon: <Shield size={24} />,
    title: 'Secure Trading',
    desc: 'Every transaction is protected with verified seller profiles and community trust scores.',
    color: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
  {
    icon: <MapPin size={24} />,
    title: 'Smart Meetup Engine',
    desc: 'AI recommends the optimal meeting station and time between buyer and seller based on routes.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: <CreditCard size={24} />,
    title: 'Escrow Payments',
    desc: 'Funds are held securely in escrow until ticket delivery is confirmed, protecting both parties.',
    color: 'from-yellow-500/20 to-yellow-500/5',
    border: 'border-yellow-500/20',
    iconColor: 'text-yellow-400',
  },
  {
    icon: <MessageSquare size={24} />,
    title: 'Realtime Chat',
    desc: 'Negotiate prices and coordinate handoffs with our instant messaging system with seen receipts.',
    color: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
  {
    icon: <TrendingUp size={24} />,
    title: 'Community Trust Score',
    desc: 'Every seller and buyer has a trust score built from reviews and verified transactions.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: <Eye size={24} />,
    title: 'Ticket Verification',
    desc: 'Upload ticket images for verification. Admins review and verify listings to ensure authenticity.',
    color: 'from-yellow-500/20 to-yellow-500/5',
    border: 'border-yellow-500/20',
    iconColor: 'text-yellow-400',
  },
];

const testimonials = [
  { name: 'Rafiqul Islam', role: 'Frequent Traveler', rating: 5, text: 'Sold my Chittagong ticket in 20 minutes. The escrow system gave my buyer confidence immediately.' },
  { name: 'Nasreen Akter', role: 'Student', rating: 5, text: 'The smart meetup feature suggested Tejgaon station which was perfect for both of us. Amazing!' },
  { name: 'Mohammad Hasan', role: 'Business Traveler', rating: 5, text: 'Escrow payment made me feel 100% safe. Funds released only after I confirmed ticket receipt.' },
];

const faqs = [
  { q: 'How does ticket verification work?', a: 'Sellers upload ticket images and details. Our admin team reviews and verifies each listing to ensure authenticity before it appears in the marketplace.' },
  { q: 'What is the escrow payment system?', a: 'Buyer pays, funds are held securely on our platform, ticket is verified and exchanged, then seller receives payment. Both parties are protected.' },
  { q: 'How does smart meetup work?', a: 'Enter your location and available time. The AI analyzes both parties\' stations and schedules to suggest an optimal meeting point on the route.' },
  { q: 'What happens if a ticket is reported?', a: 'Reported tickets are reviewed by our admin team. If found to be fraudulent, the listing is removed and the buyer receives a full refund.' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950 to-gray-950" />
          {/* Route lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1440 800">
            {[...Array(8)].map((_, i) => (
              <motion.line
                key={i}
                x1={-100 + i * 200}
                y1={0}
                x2={1540 - i * 200}
                y2={800}
                stroke="url(#lineGrad)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, delay: i * 0.3, ease: 'easeInOut' }}
              />
            ))}
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-6">
              <Zap size={14} /> Secure Ticket Exchange Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">AI-Powered Secure</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                Bangladesh Railway
              </span>
              <br />
              <span className="text-white">Ticket Marketplace</span>
            </h1>

            <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              Buy and sell railway tickets safely with smart meetup coordination, escrow-protected payments, and verified seller profiles.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/marketplace"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-gray-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50"
              >
                <Train size={20} />
                Buy Ticket
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/upload"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 font-bold rounded-xl transition-all"
              >
                <Zap size={20} />
                Sell Ticket
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { val: 12400, suffix: '+', label: 'Tickets Sold' },
                { val: 8900, suffix: '+', label: 'Verified Users' },
                { val: 99, suffix: '%', label: 'Safe Transactions' },
                { val: 4.9, suffix: '', label: 'Trust Rating' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-gray-900/50 border border-white/5 rounded-xl p-4 text-center"
                >
                  <p className="text-2xl font-bold text-cyan-400">
                    <Counter target={s.val} suffix={s.suffix} />
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-600">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">Trade Tickets in 3 Simple Steps</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Upload & List', desc: 'Seller uploads ticket image and enters journey details. The listing is reviewed and verified by our team.', icon: <Eye size={32} />, color: 'cyan' },
            { step: '02', title: 'Chat & Meetup', desc: 'Buyer and seller negotiate via realtime chat. Smart AI engine suggests the optimal meetup station and time.', icon: <MessageSquare size={32} />, color: 'emerald' },
            { step: '03', title: 'Pay & Exchange', desc: 'Buyer pays into escrow. After successful ticket handoff, funds are released to seller automatically.', icon: <CreditCard size={32} />, color: 'yellow' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              {i < 2 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-cyan-500/30 to-transparent -translate-y-1/2 z-0" />
              )}
              <div className={`relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${
                step.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                step.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>
                {step.icon}
                <span className="absolute -top-2 -right-2 text-xs font-bold text-gray-950 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full w-6 h-6 flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-emerald-400 text-sm font-medium tracking-wider uppercase">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">Built for Trust and Security</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className={`bg-gradient-to-br ${f.color} border ${f.border} rounded-xl p-6`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gray-900/50 flex items-center justify-center mb-4 ${f.iconColor}`}>
                  {f.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">Trusted by Travelers Across Bangladesh</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-900/60 border border-white/5 rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-sm font-bold text-gray-950">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-emerald-400 text-sm font-medium tracking-wider uppercase">FAQ</span>
            <h2 className="text-3xl font-bold text-white mt-2">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-gray-900/60 border border-white/5 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-white font-medium text-sm">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform flex-shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-2xl p-12"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Train size={32} className="text-gray-950" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Trade Tickets Safely?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of travelers on Bangladesh's most trusted AI-powered railway ticket exchange platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-gray-950 font-bold rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all shadow-lg shadow-cyan-500/25"
              >
                <Users size={20} />
                Create Free Account
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/50 rounded-xl transition-all"
              >
                Browse Marketplace
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-500">
              {['No hidden fees', 'Escrow-protected transactions', 'Verified seller profiles'].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-emerald-400" /> {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
