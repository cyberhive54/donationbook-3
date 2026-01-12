export default function FeaturesGuide() {
  return (
    <section id="features-guide" className="docs-section">
      <h2 className="docs-heading">Features Guide</h2>
      <p className="docs-text">
        Explore all the powerful features of Donation Book that make managing festival finances easier.
      </p>

      <div id="statistics-cards" className="docs-subsection">
        <h3 className="docs-subheading">📊 Statistics Cards</h3>
        <p className="docs-text mb-4">
          Quick overview cards displayed on every page for instant insights:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">💰 Total Collection</h4>
            <p className="docs-text text-sm">Sum of all donations received from all donors</p>
          </div>
          
          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">💸 Total Expense</h4>
            <p className="docs-text text-sm">Sum of all expenses incurred for the festival</p>
          </div>
          
          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">💵 Balance</h4>
            <p className="docs-text text-sm">Remaining amount (Collection minus Expense)</p>
          </div>
          
          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">👥 Unique Donors</h4>
            <p className="docs-text text-sm">Number of different people who donated</p>
          </div>
        </div>
      </div>

      <div id="date-management" className="docs-subsection">
        <h3 className="docs-subheading">📅 Date Management</h3>
        
        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Two Types of Date Ranges:</h4>
          
          <div className="space-y-4">
            <div className="p-4 bg-docs-accent/5 rounded-lg border border-docs-accent/20">
              <h5 className="font-semibold text-docs-accent mb-2">1. Collection/Expense (CE) Dates - Required</h5>
              <p className="docs-text text-sm mb-2">
                The period when donations and expenses can be recorded. This is the working period for financial transactions.
              </p>
              <p className="docs-text text-sm">
                <strong>Example:</strong> CE Start: Jan 1, 2026 | CE End: Jan 31, 2026
              </p>
            </div>
            
            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <h5 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">2. Event Dates - Optional</h5>
              <p className="docs-text text-sm mb-2">
                The actual festival celebration dates. Must be within CE dates. Displayed on festival banner.
              </p>
              <p className="docs-text text-sm">
                <strong>Example:</strong> Event Start: Jan 10, 2026 | Event End: Jan 15, 2026
              </p>
            </div>
          </div>
        </div>

        <div className="docs-card mt-4 bg-yellow-500/10 border-yellow-500/20">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <strong>⚠️ Important:</strong> You cannot add transactions outside the CE date range! The system will prevent it and show an error.
          </p>
        </div>
      </div>

      <div id="password-management" className="docs-subsection">
        <h3 className="docs-subheading">🔐 Password Management</h3>
        
        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Visitor Password Features:</h4>
          <ul className="docs-list">
            <li><strong>Multiple Passwords:</strong> Each admin can create up to 10 visitor passwords</li>
            <li><strong>Labels:</strong> Give each password a descriptive name (e.g., "Building A Residents")</li>
            <li><strong>Usage Tracking:</strong> See how many times each password was used</li>
            <li><strong>Last Used:</strong> Track when each password was last used</li>
            <li><strong>Visitor Details:</strong> See which visitors used which password</li>
            <li><strong>Activate/Deactivate:</strong> Turn passwords on or off without deleting</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Smart Session Features:</h4>
          <ul className="docs-list">
            <li><strong>Name Pre-fill:</strong> Your name is remembered on your device for easy access</li>
            <li><strong>Unique Names:</strong> Each visitor must use a unique name (case-insensitive)</li>
            <li><strong>Concurrent Session Detection:</strong> Warns if you're already logged in elsewhere</li>
            <li><strong>Auto-logout:</strong> Sessions expire daily at midnight (Indian Standard Time)</li>
            <li><strong>Force Logout:</strong> Admin can deactivate password to logout users in 5 minutes</li>
            <li><strong>Device Tracking:</strong> Each device gets a unique ID for identification</li>
          </ul>
        </div>
      </div>

      <div id="analytics-features" className="docs-subsection">
        <h3 className="docs-subheading">📈 Analytics & Reports</h3>
        
        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Available Charts:</h4>
          <ul className="docs-list">
            <li><strong>Festival Snapshot:</strong> Overview cards with key metrics</li>
            <li><strong>Collection Target Progress:</strong> Track progress towards donation goal</li>
            <li><strong>Donation Distribution:</strong> Breakdown by custom amount ranges</li>
            <li><strong>Time-of-Day Analysis:</strong> See when donations come in most</li>
            <li><strong>Daily Net Balance:</strong> Line chart showing daily balance trends</li>
            <li><strong>Transaction Count:</strong> Number of transactions per day</li>
            <li><strong>Top Expenses:</strong> Highest expense items</li>
            <li><strong>Collections by Group:</strong> Pie chart of donations by group</li>
            <li><strong>Collections by Mode:</strong> Pie chart of payment modes</li>
            <li><strong>Expenses by Category:</strong> Pie chart of expense categories</li>
            <li><strong>Expenses by Mode:</strong> Payment mode breakdown for expenses</li>
            <li><strong>Top Donators:</strong> Bar chart of highest donors</li>
            <li><strong>Average per Donor:</strong> Average donation amount</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Super Admin Customization:</h4>
          <ul className="docs-list">
            <li>Toggle which charts to show/hide</li>
            <li>Set custom donation amount buckets (e.g., ₹0-100, ₹101-500)</li>
            <li>Set custom time buckets (e.g., Morning 6-12, Afternoon 12-18)</li>
            <li>Configure collection targets with visibility controls</li>
            <li>Add previous year data for comparison</li>
          </ul>
        </div>
      </div>

      <div id="media-showcase" className="docs-subsection">
        <h3 className="docs-subheading">📸 Media Showcase</h3>
        
        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Supported Media Types:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <h5 className="font-semibold text-sm text-docs-accent mb-1">📷 Images</h5>
              <p className="text-xs text-docs-muted">JPG, PNG, GIF, WebP</p>
            </div>
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <h5 className="font-semibold text-sm text-docs-accent mb-1">🎥 Videos</h5>
              <p className="text-xs text-docs-muted">MP4, WebM, MOV</p>
            </div>
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <h5 className="font-semibold text-sm text-docs-accent mb-1">🎵 Audio</h5>
              <p className="text-xs text-docs-muted">MP3, WAV, OGG</p>
            </div>
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <h5 className="font-semibold text-sm text-docs-accent mb-1">📄 Documents</h5>
              <p className="text-xs text-docs-muted">PDF files</p>
            </div>
            <div className="p-3 bg-docs-accent/5 rounded-lg md:col-span-2">
              <h5 className="font-semibold text-sm text-docs-accent mb-1">🔗 External Links</h5>
              <p className="text-xs text-docs-muted">Google Drive, YouTube, any URL</p>
            </div>
          </div>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Album Organization:</h4>
          <ul className="docs-list">
            <li>Create unlimited albums to organize your media</li>
            <li>Each album has a title, description, and year</li>
            <li>Set a cover image for each album</li>
            <li>Control download permissions per album</li>
            <li>Add titles and descriptions to each media item</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Storage Limits:</h4>
          <p className="docs-text mb-2">Super admins can configure storage limits per festival:</p>
          <ul className="docs-list">
            <li><strong>Total Storage:</strong> 100 MB to 10,000 MB (default: 1000 MB)</li>
            <li><strong>Max Video Size:</strong> 10 MB to 500 MB per file (default: 100 MB)</li>
            <li><strong>Max File Size:</strong> 1 MB to 100 MB per file (default: 50 MB)</li>
          </ul>
        </div>
      </div>

      <div id="theme-customization" className="docs-subsection">
        <h3 className="docs-subheading">🎨 Theme Customization</h3>
        
        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Customizable Elements:</h4>
          <ul className="docs-list">
            <li><strong>Primary Color:</strong> Main accent color for buttons and links</li>
            <li><strong>Secondary Color:</strong> Secondary accent color</li>
            <li><strong>Background Color:</strong> Page background color</li>
            <li><strong>Text Color:</strong> Main text color</li>
            <li><strong>Border Color:</strong> Border color for cards and inputs</li>
            <li><strong>Background Image:</strong> Full-page background image (provide URL)</li>
            <li><strong>Dark Mode:</strong> Toggle between light and dark themes</li>
            <li><strong>Table Background:</strong> Custom table styling</li>
            <li><strong>Card Background:</strong> Custom card styling</li>
          </ul>
        </div>

        <div className="docs-card mt-4 bg-docs-accent/10 border-docs-accent/20">
          <h4 className="font-semibold text-docs-accent mb-3">💡 Theme Tips:</h4>
          <ul className="docs-list text-sm">
            <li>Use high contrast colors for better readability</li>
            <li>Test both light and dark modes after customization</li>
            <li>Choose festival-themed colors to match your event</li>
            <li>Background images should be subtle and not distract from content</li>
            <li>Preview changes before saving</li>
          </ul>
        </div>
      </div>

      <div id="mobile-navigation" className="docs-subsection">
        <h3 className="docs-subheading">📱 Mobile Navigation</h3>
        
        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Bottom Navigation Bar:</h4>
          <p className="docs-text mb-3">Fixed at the bottom of mobile screens for easy access:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <div className="text-xl mb-1">🏠</div>
              <h5 className="font-semibold text-sm text-docs-foreground">Home</h5>
              <p className="text-xs text-docs-muted">Festival dashboard</p>
            </div>
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <div className="text-xl mb-1">💰</div>
              <h5 className="font-semibold text-sm text-docs-foreground">Collections</h5>
              <p className="text-xs text-docs-muted">View donations</p>
            </div>
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <div className="text-xl mb-1">💸</div>
              <h5 className="font-semibold text-sm text-docs-foreground">Expenses</h5>
              <p className="text-xs text-docs-muted">View expenses</p>
            </div>
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <div className="text-xl mb-1">📊</div>
              <h5 className="font-semibold text-sm text-docs-foreground">Transactions</h5>
              <p className="text-xs text-docs-muted">Combined history</p>
            </div>
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <div className="text-xl mb-1">📈</div>
              <h5 className="font-semibold text-sm text-docs-foreground">Analytics</h5>
              <p className="text-xs text-docs-muted">Charts & reports</p>
            </div>
            <div className="p-3 bg-docs-accent/5 rounded-lg">
              <div className="text-xl mb-1">📸</div>
              <h5 className="font-semibold text-sm text-docs-foreground">Showcase</h5>
              <p className="text-xs text-docs-muted">Photo gallery</p>
            </div>
          </div>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Top Session Bar (Admin/Visitor):</h4>
          <p className="docs-text mb-2">Displayed at top when logged in:</p>
          <ul className="docs-list">
            <li>Your name (visitor or admin)</li>
            <li>Admin information (if using admin password)</li>
            <li>Session toggle button (switch between Admin and Super Admin)</li>
            <li>Logout button</li>
          </ul>
        </div>
      </div>

      <div id="export-import" className="docs-subsection">
        <h3 className="docs-subheading">📤 Export & Import</h3>
        
        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Export Options:</h4>
          <ul className="docs-list">
            <li><strong>CSV Export:</strong> Export collections or expenses to CSV for Excel</li>
            <li><strong>JSON Export:</strong> Export with full details for backup</li>
            <li><strong>Print View:</strong> Print-friendly table layouts</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Import Options:</h4>
          <ul className="docs-list">
            <li><strong>JSON Import:</strong> Bulk import collections or expenses</li>
            <li><strong>Validation:</strong> Automatic validation during import</li>
            <li><strong>Error Reporting:</strong> Clear error messages if import fails</li>
          </ul>
        </div>
      </div>

      <div id="activity-logging" className="docs-subsection">
        <h3 className="docs-subheading">📝 Activity Logging</h3>
        
        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">What Gets Logged:</h4>
          <ul className="docs-list">
            <li>All admin actions (create, edit, delete)</li>
            <li>Admin login/logout events</li>
            <li>Visitor login/logout events</li>
            <li>Password management actions</li>
            <li>Festival settings changes</li>
            <li>Theme customizations</li>
            <li>Admin creation/modification</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Log Information Includes:</h4>
          <ul className="docs-list">
            <li><strong>Timestamp:</strong> Exact date and time (Indian Standard Time)</li>
            <li><strong>Admin Name:</strong> Who performed the action</li>
            <li><strong>Action Type:</strong> What was done (create, update, delete, login, etc.)</li>
            <li><strong>Action Details:</strong> Specific details about the action</li>
            <li><strong>Target:</strong> What was affected (collection, expense, admin, etc.)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
