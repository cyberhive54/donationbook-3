export default function FAQ() {
  return (
    <section id="faq" className="docs-section">
      <h2 className="docs-heading">Frequently Asked Questions</h2>
      <p className="docs-text mb-6">
        Find answers to common questions about using Donation Book.
      </p>

      <div id="general-faq" className="docs-subsection">
        <h3 className="docs-subheading">General Questions</h3>
        
        <div className="space-y-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Is Donation Book free to use?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes! Donation Book is completely free for communities, hostels, and organizations.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Do I need to install anything?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> No, it's a web application. Just open the URL in any browser on your phone, tablet, or computer.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I use it on my phone?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Absolutely! Donation Book is fully optimized for mobile devices. You can add it to your home screen for app-like experience.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: How many festivals can I create?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Unlimited! Each festival has a unique code for complete data isolation.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Is my data safe?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes, all data is stored securely in a professional database with password protection at multiple levels.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Does it work offline?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> No, you need an internet connection to access and sync data.
            </p>
          </div>
        </div>
      </div>

      <div id="festival-creation-faq" className="docs-subsection">
        <h3 className="docs-subheading">Festival Creation</h3>
        
        <div className="space-y-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I change the festival code after creation?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes, super admins can change it in "Edit Festival Settings". Everyone will need to use the new code to access the festival.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What if I forget my super admin password?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Currently, passwords cannot be recovered. Make sure to save your super admin password securely in a safe place.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I create a festival without visitor passwords?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes! You can disable "Requires Password" during creation to allow free visitor access. However, admin and super admin passwords are always mandatory for security.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What's the difference between event dates and CE dates?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> CE (Collection/Expense) dates define when transactions can be recorded (wider range for preparation). Event dates are the actual festival celebration dates (must be within CE dates).
            </p>
          </div>
        </div>
      </div>

      <div id="user-management-faq" className="docs-subsection">
        <h3 className="docs-subheading">User Management</h3>
        
        <div className="space-y-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: How many admins can I have?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Unlimited admins per festival! Each admin has their own code, name, and password.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can an admin create other admins?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> No, only super admins can create, edit, or delete admins.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What happens if I deactivate an admin?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> They are immediately logged out and cannot login until reactivated by the super admin.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: How many visitor passwords can each admin create?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Each admin can create 1-10 visitor passwords (configurable by super admin when creating the admin account).
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can two visitors use the same password?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes, multiple visitors can use the same password, but each must use a unique name. Names are case-insensitive (e.g., "John" and "john" are considered the same).
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I see who is currently logged in?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> You can see access logs showing who logged in when, password used, and session duration in the Activity page.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What is the force logout feature?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Admins can deactivate visitor passwords to force logout users. Affected users will see a warning banner with a 5-minute countdown before automatic logout.
            </p>
          </div>
        </div>
      </div>

      <div id="collections-expenses-faq" className="docs-subsection">
        <h3 className="docs-subheading">Collections & Expenses</h3>
        
        <div className="space-y-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I edit a collection after adding it?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes, admins and super admins can edit any collection or expense from the admin dashboard.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I add collections for past dates?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes, as long as the date falls within the CE (Collection/Expense) date range set for your festival.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What if I try to add a transaction outside CE dates?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> The system will prevent it and show an error message. You can view out-of-range transactions (if any exist) in the admin panel.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I delete transactions?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes, admins and super admins can delete collections and expenses. This action is logged in the activity logs.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Who can see who added a transaction?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> The system tracks which admin created/updated each transaction. Super admins can view this information in the activity logs.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I attach receipts to transactions?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes! You can upload images (photos of receipts) when adding or editing collections and expenses.
            </p>
          </div>
        </div>
      </div>

      <div id="media-showcase-faq" className="docs-subsection">
        <h3 className="docs-subheading">Media & Showcase</h3>
        
        <div className="space-y-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What's the maximum file size for uploads?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Configurable by super admin. Default limits are 100 MB for videos and 50 MB for other files.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I link Google Drive videos instead of uploading?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes! Use the "Add External Link" option when adding media to link Google Drive files, YouTube videos, or any URL.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Who can upload media?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> All admins and super admins can upload photos, videos, and other media to the showcase gallery.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I disable downloads for certain albums?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes, set "Allow Download" to false when creating or editing an album. Visitors will be able to view but not download media from that album.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What happens if I exceed storage limits?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> New uploads will be rejected with an error message. Contact your super admin to increase storage limits or delete old media to free up space.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I organize media by year or event?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes! Create multiple albums with descriptive titles, descriptions, and year fields. This helps organize media by time period or event type.
            </p>
          </div>
        </div>
      </div>

      <div id="technical-faq" className="docs-subsection">
        <h3 className="docs-subheading">Technical Questions</h3>
        
        <div className="space-y-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Which browsers are supported?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> All modern browsers including Chrome, Firefox, Safari, Edge, and Opera. Mobile browsers are fully supported.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I export my data?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes! Collections and expenses can be exported to CSV (for Excel) and JSON formats. Click the Export button in the respective sections.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I import data from Excel?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes, you can import from JSON format. Convert your Excel data to JSON first, then use the Import feature in the admin dashboard.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What timezone is used?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Indian Standard Time (IST, UTC+5:30) is used for session management and activity logs. Dates are stored as entered.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Can I add the app to my phone's home screen?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Yes! On Android Chrome: Menu → "Add to Home Screen". On iOS Safari: Share → "Add to Home Screen". This creates an app-like shortcut.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What should I do if I encounter an error?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Try refreshing the page first. If the issue persists, clear your browser cache and try again. Make sure you have a stable internet connection.
            </p>
          </div>
        </div>
      </div>

      <div id="session-security-faq" className="docs-subsection">
        <h3 className="docs-subheading">Session & Security</h3>
        
        <div className="space-y-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: How long does my session last?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Sessions expire daily at midnight (Indian Standard Time) for security. You'll need to login again the next day.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: What if I login from multiple devices?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> The system will detect concurrent sessions and warn you. Continuing will logout your previous session. Each device can have its own session.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Why is my name pre-filled when I login?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> Your device remembers the last name you used for that festival. This is for convenience. You can click the edit icon to change it.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Q: Is it safe to use on public WiFi?</h4>
            <p className="docs-text text-sm">
              <strong>A:</strong> All data is transmitted securely. However, avoid entering passwords on untrusted devices or networks. Always logout after use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
