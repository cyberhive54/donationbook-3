'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function SuperHome() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Donation Book</h1>
          <nav className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-4">
            <Link href="/docs" className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">Documentation</Link>
            <Link href="#features" className="hover:text-blue-600 dark:hover:text-blue-400">Features</Link>
            <Link href="#how" className="hover:text-blue-600 dark:hover:text-blue-400">How it works</Link>
            <Link href="#about" className="hover:text-blue-600 dark:hover:text-blue-400">About</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Track Collections & Expenses for Any Festival</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">Create a unique code for your festival and share it with your team. View real-time stats, charts, and full history. Password protection is optional and per-festival.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/view" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">View a Festival</Link>
            <Link href="/create" className="px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors">Create a Festival</Link>
          </div>
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">🎯 How to Access a Festival</h3>
              <div className="text-left space-y-3 text-gray-700 dark:text-gray-300">
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 min-w-[24px]">1.</span>
                  <span><strong>Get the Festival Code:</strong> Ask your organizer for the unique 8-letter code (e.g., RHSPVM25)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 min-w-[24px]">2.</span>
                  <span><strong>Click "View a Festival":</strong> Enter the code on the next page</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 min-w-[24px]">3.</span>
                  <span><strong>Login:</strong> Enter your name and password (if required)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 min-w-[24px]">4.</span>
                  <span><strong>Explore:</strong> View collections, expenses, analytics, and photo gallery!</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">Powerful Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-3xl mb-3">🎊</div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Multi-Festival Support</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Each festival has its own unique code, settings, and data. Manage unlimited festivals with complete data isolation.</p>
              </div>
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Three-Tier Access Control</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Visitor, Admin, and Super Admin roles with granular permissions. Multiple admins can manage together seamlessly.</p>
              </div>
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Beautiful Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Interactive charts, collection targets, donation trends, top donors, and comprehensive reports at your fingertips.</p>
              </div>
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-3xl mb-3">📸</div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Media Showcase</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Upload photos, videos, and organize in albums. Support for external links like Google Drive and YouTube.</p>
              </div>
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Mobile Optimized</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Works perfectly on phones, tablets, and computers. Add to home screen for app-like experience.</p>
              </div>
              <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Custom Themes</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Customize colors, dark mode, and background images. Make it match your festival's vibe!</p>
              </div>
            </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Donation Book</span>
          <span>Made with ❤️ for communities</span>
        </div>
      </footer>
    </div>
  );
}
