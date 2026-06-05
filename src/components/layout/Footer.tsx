import { Link } from 'react-router-dom';
import { Brain as Train, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-cyan-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center">
                <Train size={18} className="text-gray-950" />
              </div>
              <div>
                <span className="text-white font-bold text-sm">Bangladesh Railway Exchange</span>
                <p className="text-cyan-400 text-xs">AI-Powered Secure Ticket Marketplace</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              The most trusted platform for buying and selling Bangladesh Railway tickets securely with AI-powered fraud detection.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors"><Twitter size={18} /></a>
              <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors"><Github size={18} /></a>
              <a href="#" className="text-gray-500 hover:text-cyan-400 transition-colors"><Mail size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2">
              {[['Marketplace', '/marketplace'], ['Upload Ticket', '/upload'], ['Smart Meetup', '/meetup'], ['About', '/about']].map(([label, href]) => (
                <li key={href}><Link to={href} className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2">
              {[['Contact Us', '/contact'], ['Report Fraud', '/fraud-report'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']].map(([label, href]) => (
                <li key={href}><Link to={href} className="text-gray-500 hover:text-cyan-400 text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-cyan-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">© 2024 Bangladesh Railway Exchange. All rights reserved.</p>
          <p className="text-gray-600 text-sm">Secured by AI Fraud Detection System</p>
        </div>
      </div>
    </footer>
  );
}
