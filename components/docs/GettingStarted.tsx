export default function GettingStarted() {
  return (
    <section id="getting-started" className="docs-section">
      <h2 className="docs-heading">Getting Started</h2>

      <div id="what-is-donation-book" className="docs-subsection">
        <h3 className="docs-subheading">What is Donation Book?</h3>
        <p className="docs-text">
          <strong>Donation Book</strong> is a free web-based application designed for communities, hostels, and organizations to manage their festival donations and expenses digitally. Think of it as your traditional "khatabook" (ledger book) but online, organized, and accessible from anywhere!
        </p>
        
        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Perfect For:</h4>
          <ul className="docs-list">
            <li>🎊 Festival committees in communities</li>
            <li>🏢 Hostel management teams</li>
            <li>🎓 Student organizations</li>
            <li>🙏 Religious institutions</li>
            <li>🎉 Event organizers</li>
            <li>👥 Community groups</li>
          </ul>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">Why Use Donation Book?</h4>
          <ul className="docs-list">
            <li><strong>No Paper, No Hassle:</strong> Everything is stored securely online</li>
            <li><strong>Multiple Festivals:</strong> Manage unlimited festivals with unique codes</li>
            <li><strong>Real-Time Updates:</strong> See collection and expense data instantly</li>
            <li><strong>Beautiful Reports:</strong> Get insights with charts and analytics</li>
            <li><strong>Team Management:</strong> Multiple admins can work together</li>
            <li><strong>Secure Access:</strong> Password-protected with different permission levels</li>
            <li><strong>Mobile Friendly:</strong> Works perfectly on phones, tablets, and computers</li>
          </ul>
        </div>
      </div>

      <div id="get-festival-code" className="docs-subsection">
        <h3 className="docs-subheading">Step 1: Get Your Festival Code</h3>
        
        <div className="docs-card bg-docs-accent/5 border-docs-accent/20">
          <h4 className="font-semibold text-docs-accent mb-3">If your festival already exists:</h4>
          <ol className="docs-list-ordered">
            <li>Ask your festival organizer for the 8-letter festival code</li>
            <li>Example: <code className="docs-code">RHSPVM25</code></li>
          </ol>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-foreground mb-3">To create a new festival:</h4>
          <ol className="docs-list-ordered">
            <li>Visit the Donation Book website</li>
            <li>Click <strong>"Create New Festival"</strong></li>
            <li>Fill in festival details:
              <ul className="docs-list ml-6 mt-2">
                <li>Festival name (e.g., "Diwali 2026")</li>
                <li>Organizer name</li>
                <li>Start and end dates</li>
                <li>Location</li>
                <li>Default admin name</li>
              </ul>
            </li>
            <li>Set passwords:
              <ul className="docs-list ml-6 mt-2">
                <li><strong>Super Admin Password</strong> (for you, the creator) - Required</li>
                <li><strong>Admin Password</strong> (for the default admin) - Required</li>
                <li><strong>Visitor Password</strong> (for general viewers) - Optional</li>
              </ul>
            </li>
            <li>Click <strong>"Create Festival"</strong></li>
            <li>Save your unique festival code!</li>
          </ol>
        </div>
      </div>

      <div id="access-festival" className="docs-subsection">
        <h3 className="docs-subheading">Step 2: Access Your Festival</h3>
        <ol className="docs-list-ordered">
          <li>Go to the Donation Book website</li>
          <li>Enter your festival code</li>
          <li>Enter your name and password (if required)</li>
          <li>Click <strong>"Continue"</strong></li>
        </ol>
        <div className="docs-card bg-green-500/10 border-green-500/20 mt-4">
          <p className="text-green-700 dark:text-green-400 font-medium">
            🎉 That's it! You're in!
          </p>
        </div>
      </div>

      <div id="key-concepts" className="docs-subsection">
        <h3 className="docs-subheading">Key Concepts</h3>
        
        <div className="space-y-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Festival Code</h4>
            <p className="docs-text">
              A unique 6-12 character identifier for your festival (e.g., RHSPVM25). This code is used to access all festival data and must be shared with all users.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Collections (Donations)</h4>
            <p className="docs-text">
              Money received from donors. Each collection records the donor name, amount, group, payment mode, date, and optional notes.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Expenses</h4>
            <p className="docs-text">
              Money spent on festival items. Each expense records the item name, quantity, price, category, payment mode, date, and optional notes.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">CE Dates (Collection/Expense Dates)</h4>
            <p className="docs-text">
              The date range during which collections and expenses can be recorded. All transactions must fall within this period.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Session</h4>
            <p className="docs-text">
              Your logged-in period. Sessions expire daily at midnight (Indian Standard Time) for security.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
