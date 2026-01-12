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
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Track Collections & Expenses for Any Festival</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">Create a unique code for your festival and share it with your team. View real-time stats, charts, and full history. Password protection is optional and per-festival.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/view" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">View a Festival</Link>
            <Link href="/create" className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800">Create a Festival</Link>
            <Link href="/docs" className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600">Read Documentation</Link>
          </div>
        </section>

        <section id="features" className="bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border">
              <h3 className="font-bold mb-2">Multi-Festival Support</h3>
              <p className="text-gray-600 text-sm">Each festival has its own code, settings, and data. Switch by entering the code.</p>
            </div>
            <div className="p-6 rounded-lg border">
              <h3 className="font-bold mb-2">Per-Festival Passwords</h3>
              <p className="text-gray-600 text-sm">Admins can require user passwords and change them anytime. Sessions last for the day.</p>
            </div>
            <div className="p-6 rounded-lg border">
              <h3 className="font-bold mb-2">Beautiful Charts</h3>
              <p className="text-gray-600 text-sm">Line, pie, and bar charts show trends and top contributors clearly.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Donation Book</span>
          <span>Built with Next.js & Supabase</span>
        </div>
      </footer>
    </div>
  );
}
