export default function UserRoles() {
  return (
    <section id="user-roles" className="docs-section">
      <h2 className="docs-heading">User Roles Explained</h2>
      <p className="docs-text">
        Donation Book has three types of users, each with different access levels and capabilities.
      </p>

      <div id="visitor-role" className="docs-subsection">
        <h3 className="docs-subheading">👤 Visitor (Regular User)</h3>
        
        <div className="docs-card bg-blue-500/10 border-blue-500/20">
          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">What You Can Do:</h4>
          <ul className="docs-list">
            <li>View festival information (name, dates, organizer)</li>
            <li>See total collections and expenses</li>
            <li>Browse all donation and expense records</li>
            <li>View charts and analytics</li>
            <li>Access photo/video gallery</li>
            <li>Download media (if allowed by admin)</li>
          </ul>
        </div>

        <div className="docs-card mt-4 bg-red-500/10 border-red-500/20">
          <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3">What You Cannot Do:</h4>
          <ul className="docs-list">
            <li>Add or edit any records</li>
            <li>Change festival settings</li>
            <li>Upload media</li>
            <li>See admin features</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">How to Login as Visitor:</h4>
          <ol className="docs-list-ordered">
            <li>Enter festival code at the homepage</li>
            <li>Enter your name</li>
            <li>Enter visitor password (provided by admin)</li>
            <li>Click <strong>"Continue"</strong></li>
          </ol>
          <div className="mt-3 p-3 bg-docs-accent/10 rounded-lg">
            <p className="text-sm text-docs-muted">
              <strong>Note:</strong> Your name is remembered on your device for easy access next time. Each visitor must use a unique name.
            </p>
          </div>
        </div>
      </div>

      <div id="admin-role" className="docs-subsection">
        <h3 className="docs-subheading">🔧 Admin</h3>
        
        <div className="docs-card bg-purple-500/10 border-purple-500/20">
          <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-3">What You Can Do:</h4>
          <p className="text-sm text-docs-muted mb-3">Everything visitors can do, PLUS:</p>
          <ul className="docs-list">
            <li>Add new collections (donations)</li>
            <li>Edit or delete existing collections</li>
            <li>Add new expenses</li>
            <li>Edit or delete existing expenses</li>
            <li>Create groups (e.g., "Building A", "Committee")</li>
            <li>Create categories (e.g., "Food", "Decoration")</li>
            <li>Create payment modes (e.g., "Cash", "UPI")</li>
            <li>Create visitor passwords for your users (up to 10)</li>
            <li>Manage your user passwords</li>
            <li>View who is using which password</li>
            <li>Upload photos/videos to gallery</li>
            <li>Create and manage albums</li>
          </ul>
        </div>

        <div className="docs-card mt-4 bg-red-500/10 border-red-500/20">
          <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3">What You Cannot Do:</h4>
          <ul className="docs-list">
            <li>Create or delete other admins</li>
            <li>Change festival settings (dates, theme)</li>
            <li>Delete the festival</li>
            <li>Change super admin password</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">How to Login as Admin:</h4>
          <ol className="docs-list-ordered">
            <li>Visit your festival URL</li>
            <li>Navigate to <strong>"Admin Login"</strong> (link at bottom or top)</li>
            <li>Enter your admin code OR admin name</li>
            <li>Enter your admin password</li>
            <li>Click <strong>"Login as Admin"</strong></li>
          </ol>
          <div className="mt-3 p-3 bg-docs-accent/10 rounded-lg">
            <p className="text-sm text-docs-muted">
              <strong>Example Admin Code:</strong> ADMIN01, JOHN01<br/>
              <strong>Example Admin Name:</strong> John Admin, Rahul Kumar
            </p>
          </div>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Admin Dashboard Overview:</h4>
          <p className="docs-text mb-3">When you login as admin, you'll see:</p>
          <ul className="docs-list">
            <li><strong>Festival Code & Copy URL:</strong> Quick access to share</li>
            <li><strong>Basic Info:</strong> Festival details</li>
            <li><strong>Stats Cards:</strong> Collection, Expense, Balance, Donors</li>
            <li><strong>Collections Table:</strong> Add, edit, delete donations</li>
            <li><strong>Expenses Table:</strong> Add, edit, delete expenses</li>
            <li><strong>Settings:</strong> Manage groups, categories, modes</li>
            <li><strong>User Password Management:</strong> Create and manage visitor passwords</li>
            <li><strong>Showcase:</strong> Upload and manage media</li>
          </ul>
        </div>
      </div>

      <div id="super-admin-role" className="docs-subsection">
        <h3 className="docs-subheading">👑 Super Admin (Festival Creator)</h3>
        
        <div className="docs-card bg-yellow-500/10 border-yellow-500/20">
          <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-3">What You Can Do:</h4>
          <p className="text-sm text-docs-muted mb-3">EVERYTHING admins can do, PLUS:</p>
          <ul className="docs-list">
            <li>Create new admins</li>
            <li>Edit admin details (name, password, limits)</li>
            <li>Deactivate or delete admins</li>
            <li>Change festival code and name</li>
            <li>Edit festival dates (event dates, CE dates)</li>
            <li>Edit organizer, mentor, guide, location</li>
            <li>Customize theme colors</li>
            <li>Toggle dark mode</li>
            <li>Upload background image</li>
            <li>Change banner visibility settings</li>
            <li>Configure analytics settings</li>
            <li>Set collection targets</li>
            <li>Set storage limits for media</li>
            <li>Change super admin password</li>
            <li>View complete activity logs</li>
            <li>Delete entire festival (with all data)</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">How to Login as Super Admin:</h4>
          <ol className="docs-list-ordered">
            <li>Visit your festival URL</li>
            <li>Navigate to <strong>"Super Admin Login"</strong></li>
            <li>Enter super admin password (the one you set during festival creation)</li>
            <li>Click <strong>"Login as Super Admin"</strong></li>
          </ol>
          <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>⚠️ Important:</strong> Keep your super admin password safe! It cannot be recovered if lost.
            </p>
          </div>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Super Admin Dashboard Overview:</h4>
          <p className="docs-text mb-3">When you login as super admin, you'll see all admin features PLUS:</p>
          <ul className="docs-list">
            <li><strong>Admin Management Section:</strong> Create, edit, delete admins</li>
            <li><strong>Festival Settings:</strong> Edit all festival details</li>
            <li><strong>Theme Customization:</strong> Colors, dark mode, background</li>
            <li><strong>Banner Controls:</strong> Show/hide organizer, guide, mentor, etc.</li>
            <li><strong>Analytics Configuration:</strong> Targets, buckets, previous year data</li>
            <li><strong>Storage Limits:</strong> Set max storage and file sizes</li>
            <li><strong>Super Admin Password:</strong> Change your password</li>
            <li><strong>Activity Logs:</strong> View all admin actions</li>
            <li><strong>Delete Festival:</strong> Permanently delete festival and all data</li>
          </ul>
        </div>
      </div>

      <div id="role-comparison" className="docs-subsection">
        <h3 className="docs-subheading">Quick Role Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-docs-card border-b border-docs-border">
                <th className="px-4 py-3 text-left text-sm font-semibold text-docs-foreground">Feature</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-docs-foreground">Visitor</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-docs-foreground">Admin</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-docs-foreground">Super Admin</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-docs-border">
                <td className="px-4 py-3 text-docs-foreground">View festival data</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
              <tr className="border-b border-docs-border">
                <td className="px-4 py-3 text-docs-foreground">View analytics</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
              <tr className="border-b border-docs-border">
                <td className="px-4 py-3 text-docs-foreground">View gallery</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
              <tr className="border-b border-docs-border">
                <td className="px-4 py-3 text-docs-foreground">Add/Edit collections & expenses</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
              <tr className="border-b border-docs-border">
                <td className="px-4 py-3 text-docs-foreground">Manage visitor passwords</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
              <tr className="border-b border-docs-border">
                <td className="px-4 py-3 text-docs-foreground">Upload media</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
              <tr className="border-b border-docs-border">
                <td className="px-4 py-3 text-docs-foreground">Create/manage admins</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
              <tr className="border-b border-docs-border">
                <td className="px-4 py-3 text-docs-foreground">Edit festival settings</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
              <tr className="border-b border-docs-border">
                <td className="px-4 py-3 text-docs-foreground">Customize theme</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-docs-foreground">Delete festival</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-red-600">✗</td>
                <td className="px-4 py-3 text-center text-green-600">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
