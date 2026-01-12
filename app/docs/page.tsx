'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, Home, ArrowLeft, Book } from 'lucide-react';
import Link from 'next/link';
import DocsSearch from '@/components/docs/DocsSearch';
import DocsSidebar from '@/components/docs/DocsSidebar';
import DocsThemeToggle from '@/components/docs/DocsThemeToggle';
import GettingStarted from '@/components/docs/GettingStarted';
import UserRoles from '@/components/docs/UserRoles';
import HowToUse from '@/components/docs/HowToUse';
import FeaturesGuide from '@/components/docs/FeaturesGuide';
import FAQ from '@/components/docs/FAQ';
import MobileAccess from '@/components/docs/MobileAccess';

interface SearchResult {
  section: string;
  title: string;
  content: string;
  id: string;
}

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    subsections: [
      { id: 'what-is-donation-book', title: 'What is Donation Book?' },
      { id: 'get-festival-code', title: 'Get Your Festival Code' },
      { id: 'access-festival', title: 'Access Your Festival' },
      { id: 'key-concepts', title: 'Key Concepts' },
    ],
  },
  {
    id: 'user-roles',
    title: 'User Roles',
    subsections: [
      { id: 'visitor-role', title: 'Visitor Role' },
      { id: 'admin-role', title: 'Admin Role' },
      { id: 'super-admin-role', title: 'Super Admin Role' },
      { id: 'role-comparison', title: 'Role Comparison' },
    ],
  },
  {
    id: 'how-to-use',
    title: 'How to Use',
    subsections: [
      { id: 'create-festival', title: 'Creating a Festival' },
      { id: 'visitor-guide', title: 'For Visitors' },
      { id: 'admin-guide', title: 'For Admins' },
      { id: 'super-admin-guide', title: 'For Super Admins' },
    ],
  },
  {
    id: 'features-guide',
    title: 'Features Guide',
    subsections: [
      { id: 'statistics-cards', title: 'Statistics Cards' },
      { id: 'date-management', title: 'Date Management' },
      { id: 'password-management', title: 'Password Management' },
      { id: 'analytics-features', title: 'Analytics & Reports' },
      { id: 'media-showcase', title: 'Media Showcase' },
      { id: 'theme-customization', title: 'Theme Customization' },
      { id: 'mobile-navigation', title: 'Mobile Navigation' },
      { id: 'export-import', title: 'Export & Import' },
      { id: 'activity-logging', title: 'Activity Logging' },
    ],
  },
  {
    id: 'mobile-access',
    title: 'Mobile Access',
    subsections: [
      { id: 'mobile-web-app', title: 'Mobile Web App' },
      { id: 'add-to-home-screen', title: 'Add to Home Screen' },
      { id: 'mobile-features', title: 'Mobile Features' },
      { id: 'mobile-tips', title: 'Mobile Tips' },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    subsections: [
      { id: 'general-faq', title: 'General Questions' },
      { id: 'festival-creation-faq', title: 'Festival Creation' },
      { id: 'user-management-faq', title: 'User Management' },
      { id: 'collections-expenses-faq', title: 'Collections & Expenses' },
      { id: 'media-showcase-faq', title: 'Media & Showcase' },
      { id: 'technical-faq', title: 'Technical Questions' },
      { id: 'session-security-faq', title: 'Session & Security' },
    ],
  },
];

const searchableContent: SearchResult[] = [
  { section: 'Getting Started', title: 'What is Donation Book?', content: 'Donation Book is a free web-based application designed for communities, hostels, and organizations to manage their festival donations and expenses digitally. Think of it as your traditional khatabook ledger book but online, organized, and accessible from anywhere. Perfect for festival committees, hostel management, student organizations, religious institutions, and event organizers.', id: 'what-is-donation-book' },
  { section: 'Getting Started', title: 'Get Festival Code', content: 'To access a festival, you need an 8-letter unique festival code. Ask your organizer for the code if the festival exists, or create a new festival to get a code. Example: RHSPVM25', id: 'get-festival-code' },
  { section: 'Getting Started', title: 'Create New Festival', content: 'Click Create New Festival, fill in details like festival name, organizer, dates, location. Set super admin password, admin password, and optional visitor password. System generates unique festival code.', id: 'create-festival' },
  { section: 'User Roles', title: 'Visitor Role', content: 'Visitors can view festival information, see collections and expenses, browse charts and analytics, access photo gallery, and download media if allowed. Cannot add or edit data.', id: 'visitor-role' },
  { section: 'User Roles', title: 'Admin Role', content: 'Admins can do everything visitors can plus add edit delete collections and expenses, manage visitor passwords, upload media, create groups categories and payment modes. Up to 10 user passwords per admin.', id: 'admin-role' },
  { section: 'User Roles', title: 'Super Admin Role', content: 'Super admins have full control including creating managing admins, editing festival settings, customizing themes, configuring analytics, setting storage limits, viewing activity logs, and deleting festivals.', id: 'super-admin-role' },
  { section: 'How to Use', title: 'Add Collection', content: 'Login as admin, click Add Collection, fill donor name amount group payment mode date time and optional note, upload receipt image if needed, click Save. Collections are donations received.', id: 'admin-guide' },
  { section: 'How to Use', title: 'Add Expense', content: 'Login as admin, click Add Expense, fill item name pieces price per piece category payment mode date time and note, total is calculated automatically, upload receipt, click Save.', id: 'admin-guide' },
  { section: 'How to Use', title: 'Manage Passwords', content: 'Admins can create edit deactivate visitor passwords. Each password has a label and usage tracking. Deactivating password forces logout of users in 5 minutes. View who used which password.', id: 'admin-guide' },
  { section: 'Features', title: 'Statistics Cards', content: 'Four key metrics displayed everywhere: Total Collection sum of donations, Total Expense sum of expenses, Balance collection minus expense, Unique Donors number of different donors.', id: 'statistics-cards' },
  { section: 'Features', title: 'Date Management', content: 'CE Collection Expense dates are required range for recording transactions. Event dates are optional actual festival dates must be within CE dates. All transactions must fall within CE date range.', id: 'date-management' },
  { section: 'Features', title: 'Analytics Charts', content: 'Interactive charts including collection target progress, donation distribution by amount, time of day analysis, daily balance trends, top expenses, collections by group and mode, top donators, average per donor.', id: 'analytics-features' },
  { section: 'Features', title: 'Media Showcase', content: 'Upload images videos audio PDFs. Link Google Drive YouTube. Organize in albums by year. Set cover images and download permissions. Configurable storage limits.', id: 'media-showcase' },
  { section: 'Features', title: 'Theme Customization', content: 'Super admins can customize primary secondary background text and border colors, add background image, toggle dark mode. Changes apply immediately across entire festival.', id: 'theme-customization' },
  { section: 'Mobile', title: 'Mobile Access', content: 'Add to home screen on Android and iOS. Works like native app. Touch friendly bottom navigation. Camera integration for photos. Responsive charts. Fast loading on mobile networks.', id: 'mobile-access' },
  { section: 'Mobile', title: 'Add to Home Screen Android', content: 'Open in Chrome, tap three dot menu, select Add to Home Screen, edit name, tap Add. Icon appears on home screen opens fullscreen without browser.', id: 'add-to-home-screen' },
  { section: 'Mobile', title: 'Add to Home Screen iOS', content: 'Open in Safari, tap Share button at bottom, scroll and tap Add to Home Screen, edit name, tap Add. Icon appears on home screen. Works best in Safari.', id: 'add-to-home-screen' },
  { section: 'FAQ', title: 'Is it free?', content: 'Yes, Donation Book is completely free for communities, hostels, and organizations. No charges or subscriptions.', id: 'general-faq' },
  { section: 'FAQ', title: 'Need installation?', content: 'No installation needed. It is a web application. Just open URL in any browser on phone tablet or computer.', id: 'general-faq' },
  { section: 'FAQ', title: 'Change festival code?', content: 'Yes, super admins can change festival code in Edit Festival Settings. Everyone will need new code to access. Requires re-login.', id: 'festival-creation-faq' },
  { section: 'FAQ', title: 'Forgot password?', content: 'Passwords cannot be recovered currently. Save super admin password securely. Contact your admin if you forgot visitor password.', id: 'festival-creation-faq' },
  { section: 'FAQ', title: 'How many admins?', content: 'Unlimited admins per festival. Each admin has unique code name and password. Only super admins can create admins.', id: 'user-management-faq' },
  { section: 'FAQ', title: 'Edit collections?', content: 'Yes, admins and super admins can edit any collection or expense. All edits are logged with timestamp and admin name.', id: 'collections-expenses-faq' },
  { section: 'FAQ', title: 'Maximum file size?', content: 'Configurable by super admin. Default is 100 MB for videos, 50 MB for other files. Total storage limit also configurable.', id: 'media-showcase-faq' },
  { section: 'FAQ', title: 'Export data?', content: 'Yes, export collections and expenses to CSV for Excel or JSON format. Click Export button in respective sections.', id: 'technical-faq' },
  { section: 'FAQ', title: 'Session duration?', content: 'Sessions expire daily at midnight Indian Standard Time for security. Need to login again next day.', id: 'session-security-faq' },
];

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    if (contentRef.current) {
      const headings = contentRef.current.querySelectorAll('section[id]');
      headings.forEach((heading) => observer.observe(heading));
    }

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-docs-bg">
      <header className="sticky top-0 z-40 w-full border-b border-docs-border bg-docs-bg/95 backdrop-blur supports-[backdrop-filter]:bg-docs-bg/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-docs-hover rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6 text-docs-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-docs-foreground" />
              )}
            </button>
            
            <Link href="/" className="flex items-center gap-2">
              <Book className="h-6 w-6 text-docs-accent" />
              <span className="font-bold text-xl text-docs-foreground">Donation Book</span>
            </Link>
            <span className="hidden sm:inline-block px-2 py-1 text-xs font-medium bg-docs-accent/10 text-docs-accent rounded">
              Documentation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-docs-foreground hover:text-docs-accent transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <DocsThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside
            className={`
              fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 
              border-r border-docs-border bg-docs-bg p-6 overflow-y-auto
              transition-transform duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-docs-muted uppercase tracking-wider mb-3">
                Navigation
              </h2>
              <DocsSidebar
                sections={sections}
                activeSection={activeSection}
                onSectionClick={scrollToSection}
              />
            </div>

            <div className="mt-8 pt-8 border-t border-docs-border">
              <h3 className="text-sm font-semibold text-docs-muted uppercase tracking-wider mb-3">
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link
                  href="/create"
                  className="block px-3 py-2 text-sm text-docs-foreground hover:text-docs-accent hover:bg-docs-hover rounded-lg transition-colors"
                >
                  Create Festival
                </Link>
                <Link
                  href="/view"
                  className="block px-3 py-2 text-sm text-docs-foreground hover:text-docs-accent hover:bg-docs-hover rounded-lg transition-colors"
                >
                  Access Festival
                </Link>
              </div>
            </div>
          </aside>

          {sidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="flex-1 min-w-0 max-w-4xl">
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-docs-muted hover:text-docs-accent transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              
              <h1 className="text-4xl font-bold text-docs-foreground mb-4">
                Donation Book Documentation
              </h1>
              <p className="text-lg text-docs-muted">
                Complete guide to managing festival donations and expenses with Donation Book.
              </p>
            </div>

            <div className="mb-8">
              <DocsSearch
                searchableContent={searchableContent}
                onResultClick={scrollToSection}
              />
            </div>

            <div ref={contentRef} className="space-y-12">
              <GettingStarted />
              <UserRoles />
              <HowToUse />
              <FeaturesGuide />
              <MobileAccess />
              <FAQ />
            </div>

            <div className="mt-16 pt-8 border-t border-docs-border">
              <div className="docs-card bg-docs-accent/5 border-docs-accent/20">
                <h3 className="text-lg font-semibold text-docs-foreground mb-2">
                  Need More Help?
                </h3>
                <p className="docs-text mb-4">
                  If you have questions not covered in this documentation, feel free to reach out!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="https://github.com/cyberhive54/donationbook-3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-docs-accent text-white rounded-lg hover:bg-docs-accent/90 transition-colors text-center font-medium"
                  >
                    View on GitHub
                  </Link>
                  <Link
                    href="https://github.com/cyberhive54/donationbook-3/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-docs-border text-docs-foreground rounded-lg hover:bg-docs-hover transition-colors text-center font-medium"
                  >
                    Report an Issue
                  </Link>
                </div>
              </div>
            </div>

            <footer className="mt-12 pt-8 border-t border-docs-border text-center text-sm text-docs-muted">
              <p>© 2026 Donation Book. Made with ❤️ for communities and hostels.</p>
              <p className="mt-2">Version 0.1.0 • Last updated: January 12, 2026</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
