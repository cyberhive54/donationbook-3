export default function HowToUse() {
  return (
    <section id="how-to-use" className="docs-section">
      <h2 className="docs-heading">How to Use</h2>
      <p className="docs-text">
        Step-by-step guides for each user role to help you get the most out of Donation Book.
      </p>

      <div id="create-festival" className="docs-subsection">
        <h3 className="docs-subheading">Creating a New Festival</h3>
        
        <div className="docs-card">
          <ol className="docs-list-ordered">
            <li>
              <strong>Navigate to Homepage</strong>
              <p className="docs-text ml-6 mt-2">Visit the Donation Book website and click <strong>"Create New Festival"</strong></p>
            </li>
            
            <li className="mt-4">
              <strong>Fill Festival Details</strong>
              <ul className="docs-list ml-6 mt-2">
                <li><strong>Event Name:</strong> Give your festival a name (e.g., "Diwali 2026")</li>
                <li><strong>Organizer:</strong> Name of the organizing person/committee</li>
                <li><strong>Guide:</strong> (Optional) Name of the guide</li>
                <li><strong>Mentor:</strong> (Optional) Name of the mentor</li>
                <li><strong>Location:</strong> Where the festival is happening</li>
              </ul>
            </li>
            
            <li className="mt-4">
              <strong>Set Date Ranges</strong>
              <ul className="docs-list ml-6 mt-2">
                <li><strong>Collection/Expense Start Date:</strong> When you'll start recording transactions</li>
                <li><strong>Collection/Expense End Date:</strong> When you'll stop recording transactions</li>
                <li><strong>Event Start Date:</strong> (Optional) Actual festival start date</li>
                <li><strong>Event End Date:</strong> (Optional) Actual festival end date</li>
              </ul>
              <div className="mt-3 p-3 bg-docs-accent/10 rounded-lg">
                <p className="text-sm text-docs-muted">
                  <strong>Note:</strong> Event dates must be within CE dates. All collections and expenses must fall within CE date range.
                </p>
              </div>
            </li>
            
            <li className="mt-4">
              <strong>Set Passwords</strong>
              <ul className="docs-list ml-6 mt-2">
                <li><strong>Super Admin Password:</strong> Your master password (Required)</li>
                <li><strong>Default Admin Name:</strong> Name for the first admin</li>
                <li><strong>Admin Password:</strong> Password for the default admin (Required)</li>
                <li><strong>Visitor Password:</strong> Password for visitors (Optional)</li>
                <li><strong>Require Password:</strong> Toggle to make visitor password optional</li>
              </ul>
            </li>
            
            <li className="mt-4">
              <strong>Create Festival</strong>
              <p className="docs-text ml-6 mt-2">Click <strong>"Create Festival"</strong> and save your unique festival code!</p>
            </li>
          </ol>
        </div>

        <div className="docs-card bg-green-500/10 border-green-500/20 mt-4">
          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">🎉 Success!</h4>
          <p className="text-sm text-green-700 dark:text-green-400">
            You'll be automatically redirected to the Super Admin dashboard where you can start managing your festival.
          </p>
        </div>
      </div>

      <div id="visitor-guide" className="docs-subsection">
        <h3 className="docs-subheading">For Visitors</h3>

        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Viewing Festival Dashboard</h4>
          <p className="docs-text mb-3">After logging in, you'll see:</p>
          <ul className="docs-list">
            <li><strong>Festival Banner:</strong> Festival name, dates, organizer, and other details</li>
            <li><strong>Statistics Cards:</strong> Total Collection, Total Expense, Balance, Unique Donors</li>
            <li><strong>Recent Transactions:</strong> Latest 10 collections and expenses</li>
            <li><strong>Bottom Navigation:</strong> Quick access to all sections</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Browsing Collections</h4>
          <ol className="docs-list-ordered">
            <li>Click <strong>"Collections"</strong> in bottom navigation</li>
            <li>View all donations in a table format</li>
            <li>Sort by clicking column headers (Name, Amount, Date, etc.)</li>
            <li>Use search box to find specific donors</li>
            <li>Export to CSV if needed (click Export button)</li>
          </ol>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Browsing Expenses</h4>
          <ol className="docs-list-ordered">
            <li>Click <strong>"Expenses"</strong> in bottom navigation</li>
            <li>View all expenses in a table format</li>
            <li>Sort and filter by category, mode, or date</li>
            <li>See item details, quantities, and prices</li>
            <li>Export to CSV if needed</li>
          </ol>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Viewing Analytics</h4>
          <ol className="docs-list-ordered">
            <li>Click <strong>"Analytics"</strong> in bottom navigation</li>
            <li>Explore interactive charts:
              <ul className="docs-list ml-6 mt-2">
                <li>Collection vs Expense trends over time</li>
                <li>Top donors (bar chart)</li>
                <li>Donations by groups (pie chart)</li>
                <li>Expenses by categories (pie chart)</li>
                <li>Time-based analysis (when donations come in)</li>
                <li>Daily balance chart</li>
              </ul>
            </li>
            <li>Hover over charts for detailed information</li>
          </ol>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Browsing Gallery (Showcase)</h4>
          <ol className="docs-list-ordered">
            <li>Click <strong>"Showcase"</strong> in bottom navigation</li>
            <li>Select an album from the list</li>
            <li>View photos, videos, and media files</li>
            <li>Click on any item to view full size</li>
            <li>Download media if allowed by admin</li>
          </ol>
        </div>
      </div>

      <div id="admin-guide" className="docs-subsection">
        <h3 className="docs-subheading">For Admins</h3>

        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Adding a Collection (Donation)</h4>
          <ol className="docs-list-ordered">
            <li>Login as Admin</li>
            <li>Scroll to <strong>"Collections"</strong> section</li>
            <li>Click <strong>"Add Collection"</strong> button</li>
            <li>Fill in details:
              <ul className="docs-list ml-6 mt-2">
                <li><strong>Donor Name:</strong> Name of the person donating</li>
                <li><strong>Amount:</strong> Donation amount (numbers only)</li>
                <li><strong>Group:</strong> Select existing or create new (e.g., "Building A")</li>
                <li><strong>Payment Mode:</strong> Cash, UPI, Card, etc.</li>
                <li><strong>Date:</strong> Date of donation (must be within CE dates)</li>
                <li><strong>Time:</strong> (Optional) Hour and minute</li>
                <li><strong>Note:</strong> (Optional) Additional details</li>
                <li><strong>Receipt Image:</strong> (Optional) Upload receipt photo</li>
              </ul>
            </li>
            <li>Click <strong>"Save"</strong></li>
          </ol>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Adding an Expense</h4>
          <ol className="docs-list-ordered">
            <li>Scroll to <strong>"Expenses"</strong> section</li>
            <li>Click <strong>"Add Expense"</strong> button</li>
            <li>Fill in details:
              <ul className="docs-list ml-6 mt-2">
                <li><strong>Item Name:</strong> What was purchased (e.g., "Flowers")</li>
                <li><strong>Pieces:</strong> Quantity purchased</li>
                <li><strong>Price per Piece:</strong> Unit price</li>
                <li><strong>Total:</strong> Automatically calculated (pieces × price)</li>
                <li><strong>Category:</strong> Select or create (e.g., "Decoration")</li>
                <li><strong>Payment Mode:</strong> How it was paid</li>
                <li><strong>Date & Time:</strong> When the expense occurred</li>
                <li><strong>Note:</strong> (Optional) Additional details</li>
                <li><strong>Receipt Image:</strong> (Optional) Upload receipt</li>
              </ul>
            </li>
            <li>Click <strong>"Save"</strong></li>
          </ol>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Managing Visitor Passwords</h4>
          <ol className="docs-list-ordered">
            <li>In Admin Dashboard, find <strong>"User Password Management"</strong></li>
            <li>Click <strong>"Manage Passwords"</strong> button</li>
            <li>
              <strong>To Add Password:</strong>
              <ul className="docs-list ml-6 mt-2">
                <li>Click <strong>"Add New Password"</strong></li>
                <li>Enter password or use auto-generated one</li>
                <li>Add label (e.g., "Committee Members", "Building A")</li>
                <li>Click <strong>"Save"</strong></li>
              </ul>
            </li>
            <li>
              <strong>To Edit Password:</strong>
              <ul className="docs-list ml-6 mt-2">
                <li>Click edit icon next to password</li>
                <li>Modify password or label</li>
                <li>Click <strong>"Save"</strong></li>
              </ul>
            </li>
            <li>
              <strong>To Deactivate Password:</strong>
              <ul className="docs-list ml-6 mt-2">
                <li>Toggle the <strong>"Active"</strong> switch</li>
                <li>Users with this password will be logged out in 5 minutes</li>
              </ul>
            </li>
            <li>
              <strong>To View Usage:</strong>
              <ul className="docs-list ml-6 mt-2">
                <li>Click <strong>"View Usage"</strong> to see who used the password</li>
                <li>See login times and visitor names</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Uploading Media to Gallery</h4>
          <ol className="docs-list-ordered">
            <li>Navigate to <strong>"Showcase"</strong> section</li>
            <li>Click <strong>"Manage Albums"</strong></li>
            <li>
              <strong>To Create Album:</strong>
              <ul className="docs-list ml-6 mt-2">
                <li>Click <strong>"Add Album"</strong></li>
                <li>Enter title (e.g., "Diwali 2026 Photos")</li>
                <li>Enter description</li>
                <li>Enter year</li>
                <li>Upload cover image</li>
                <li>Set download permissions (allow/disallow)</li>
                <li>Click <strong>"Save"</strong></li>
              </ul>
            </li>
            <li>
              <strong>To Add Media:</strong>
              <ul className="docs-list ml-6 mt-2">
                <li>Open an album</li>
                <li>Click <strong>"Upload Media"</strong></li>
                <li>Choose files from your device OR add external links (Google Drive, YouTube)</li>
                <li>Add titles and descriptions for each item</li>
                <li>Click <strong>"Upload"</strong></li>
              </ul>
            </li>
          </ol>
          <div className="mt-3 p-3 bg-docs-accent/10 rounded-lg">
            <p className="text-sm text-docs-muted">
              <strong>Supported Formats:</strong> Images (JPG, PNG), Videos (MP4, WebM), Audio (MP3), PDFs, and external links
            </p>
          </div>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Creating Groups, Categories, and Modes</h4>
          <p className="docs-text mb-3">Groups, categories, and modes help organize your collections and expenses.</p>
          <ol className="docs-list-ordered">
            <li>Scroll to <strong>"Settings"</strong> section in Admin Dashboard</li>
            <li>Find <strong>"Groups"</strong>, <strong>"Categories"</strong>, or <strong>"Modes"</strong> subsection</li>
            <li>Click <strong>"Add"</strong> button</li>
            <li>Enter name (e.g., "Building A", "Food", "UPI")</li>
            <li>Click <strong>"Save"</strong></li>
          </ol>
          <div className="mt-3 p-3 bg-docs-accent/10 rounded-lg">
            <p className="text-sm text-docs-muted">
              <strong>Examples:</strong><br/>
              <strong>Groups:</strong> Building A, Building B, Committee, External Donors<br/>
              <strong>Categories:</strong> Food, Decoration, Venue, Entertainment, Miscellaneous<br/>
              <strong>Modes:</strong> Cash, UPI, Card, Bank Transfer, Cheque
            </p>
          </div>
        </div>
      </div>

      <div id="super-admin-guide" className="docs-subsection">
        <h3 className="docs-subheading">For Super Admins</h3>

        <div className="docs-card">
          <h4 className="font-semibold text-docs-foreground mb-3">Creating a New Admin</h4>
          <ol className="docs-list-ordered">
            <li>Login as Super Admin</li>
            <li>Scroll to <strong>"Admin Management"</strong> section</li>
            <li>Click <strong>"Create Admin"</strong> button</li>
            <li>Fill in details:
              <ul className="docs-list ml-6 mt-2">
                <li><strong>Admin Code:</strong> Unique code (e.g., "ADMIN02", "JOHN01") or auto-generate</li>
                <li><strong>Admin Name:</strong> Full name (e.g., "Rahul Kumar")</li>
                <li><strong>Password:</strong> Login password for this admin</li>
                <li><strong>Max User Passwords:</strong> How many visitor passwords this admin can create (1-10)</li>
                <li><strong>Active:</strong> Check to activate immediately</li>
              </ul>
            </li>
            <li>Click <strong>"Create Admin"</strong></li>
          </ol>
          <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-700 dark:text-green-400">
              ✓ Share the admin code/name and password with the new admin securely
            </p>
          </div>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Editing Festival Settings</h4>
          <ol className="docs-list-ordered">
            <li>Click <strong>"Edit Festival Settings"</strong> button</li>
            <li>Modify any of these:
              <ul className="docs-list ml-6 mt-2">
                <li><strong>Festival Code:</strong> Change the unique code</li>
                <li><strong>Event Name:</strong> Change festival name</li>
                <li><strong>Dates:</strong> Update event dates or CE dates</li>
                <li><strong>Location:</strong> Change venue</li>
                <li><strong>Organizer, Guide, Mentor:</strong> Update names</li>
              </ul>
            </li>
            <li>Click <strong>"Save Changes"</strong></li>
          </ol>
          <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>⚠️ Warning:</strong> Changing the festival code will require everyone to use the new code. You'll be logged out and need to re-login.
            </p>
          </div>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Customizing Theme</h4>
          <ol className="docs-list-ordered">
            <li>Scroll to <strong>"Theme Settings"</strong></li>
            <li>Click <strong>"Edit Theme"</strong></li>
            <li>Customize:
              <ul className="docs-list ml-6 mt-2">
                <li><strong>Primary Color:</strong> Main accent color (buttons, links)</li>
                <li><strong>Secondary Color:</strong> Secondary accent color</li>
                <li><strong>Background Color:</strong> Page background</li>
                <li><strong>Text Color:</strong> Main text color</li>
                <li><strong>Border Color:</strong> Border color for cards and inputs</li>
                <li><strong>Background Image URL:</strong> Full-page background image</li>
                <li><strong>Dark Mode:</strong> Toggle dark mode on/off</li>
              </ul>
            </li>
            <li>Click <strong>"Save Theme"</strong></li>
            <li>See changes immediately!</li>
          </ol>
          <div className="mt-3 p-3 bg-docs-accent/10 rounded-lg">
            <p className="text-sm text-docs-muted">
              <strong>Tip:</strong> Use high contrast colors for better readability. Test both light and dark modes.
            </p>
          </div>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Configuring Analytics</h4>
          <ol className="docs-list-ordered">
            <li>Click <strong>"Configure Analytics"</strong> button</li>
            <li>Set collection target:
              <ul className="docs-list ml-6 mt-2">
                <li>Enter target amount (e.g., 50000)</li>
                <li>Choose visibility (Public or Admin Only)</li>
              </ul>
            </li>
            <li>Add previous year data:
              <ul className="docs-list ml-6 mt-2">
                <li>Total Collection from last year</li>
                <li>Total Expense from last year</li>
                <li>Balance from last year</li>
              </ul>
            </li>
            <li>Configure donation buckets:
              <ul className="docs-list ml-6 mt-2">
                <li>Create amount ranges (e.g., "₹0-100", "₹101-500")</li>
                <li>Add labels for each range</li>
              </ul>
            </li>
            <li>Configure time buckets:
              <ul className="docs-list ml-6 mt-2">
                <li>Create time ranges (e.g., "Morning 6-12", "Evening 12-18")</li>
                <li>See when donations come in most</li>
              </ul>
            </li>
            <li>Select which analytics cards to display</li>
            <li>Click <strong>"Save Configuration"</strong></li>
          </ol>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Viewing Activity Logs</h4>
          <ol className="docs-list-ordered">
            <li>Navigate to <strong>"Activity"</strong> page (link in session bar or dashboard)</li>
            <li>See complete history of:
              <ul className="docs-list ml-6 mt-2">
                <li>Who added/edited/deleted collections or expenses</li>
                <li>When admin logins occurred</li>
                <li>Admin creation/modification/deletion</li>
                <li>Festival settings changes</li>
                <li>Password management actions</li>
              </ul>
            </li>
            <li>Filter by admin or date range</li>
            <li>Export logs for record-keeping</li>
          </ol>
        </div>

        <div className="docs-card mt-4 bg-red-500/10 border-red-500/20">
          <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3">⚠️ Deleting Festival</h4>
          <ol className="docs-list-ordered text-red-700 dark:text-red-400">
            <li>Scroll to bottom of Super Admin Dashboard</li>
            <li>Find <strong>"Danger Zone"</strong></li>
            <li>Click <strong>"Delete Festival"</strong></li>
            <li>Confirm by entering festival code</li>
            <li>Click <strong>"Permanently Delete"</strong></li>
          </ol>
          <div className="mt-3 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              ⚠️ This action is PERMANENT and cannot be undone! All data including collections, expenses, media, and admin accounts will be deleted forever.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
