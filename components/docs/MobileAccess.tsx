export default function MobileAccess() {
  return (
    <section id="mobile-access" className="docs-section">
      <h2 className="docs-heading">Mobile Access</h2>
      <p className="docs-text">
        Donation Book works perfectly on mobile devices. Access your festival data anytime, anywhere!
      </p>

      <div id="mobile-web-app" className="docs-subsection">
        <h3 className="docs-subheading">📱 Mobile Web Application</h3>
        
        <div className="docs-card">
          <p className="docs-text mb-4">
            Donation Book is a <strong>Progressive Web Application (PWA)</strong> that works seamlessly in mobile browsers. No app store installation needed!
          </p>
          
          <h4 className="font-semibold text-docs-foreground mb-3">Benefits:</h4>
          <ul className="docs-list">
            <li><strong>No Installation:</strong> Just visit the URL in any browser</li>
            <li><strong>Instant Updates:</strong> Always get the latest features automatically</li>
            <li><strong>Cross-Platform:</strong> Works on iOS, Android, and any device with a browser</li>
            <li><strong>Same Experience:</strong> Identical features on mobile and desktop</li>
            <li><strong>Lightweight:</strong> No storage space required on your device</li>
          </ul>
        </div>
      </div>

      <div id="add-to-home-screen" className="docs-subsection">
        <h3 className="docs-subheading">🏠 Add to Home Screen</h3>
        <p className="docs-text mb-4">
          For app-like experience, add Donation Book to your home screen. It will open like a native app without browser UI.
        </p>

        <div className="docs-card">
          <h4 className="font-semibold text-docs-accent mb-3">📱 On Android (Chrome)</h4>
          <ol className="docs-list-ordered">
            <li>Open Donation Book in Chrome browser</li>
            <li>Tap the <strong>three-dot menu</strong> (⋮) in the top-right corner</li>
            <li>Select <strong>"Add to Home Screen"</strong></li>
            <li>Edit the name if desired (e.g., "DonationBook")</li>
            <li>Tap <strong>"Add"</strong></li>
            <li>An icon will appear on your home screen</li>
          </ol>
          <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-700 dark:text-green-400">
              ✓ The app will now open fullscreen without browser controls, just like a native app!
            </p>
          </div>
        </div>

        <div className="docs-card mt-4">
          <h4 className="font-semibold text-docs-accent mb-3">🍎 On iOS/iPhone (Safari)</h4>
          <ol className="docs-list-ordered">
            <li>Open Donation Book in Safari browser</li>
            <li>Tap the <strong>Share button</strong> (square with arrow pointing up) at the bottom</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Edit the name if desired</li>
            <li>Tap <strong>"Add"</strong> in the top-right corner</li>
            <li>An icon will appear on your home screen</li>
          </ol>
          <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              📱 Note: This feature works best in Safari. Other iOS browsers may have limited support.
            </p>
          </div>
        </div>
      </div>

      <div id="mobile-features" className="docs-subsection">
        <h3 className="docs-subheading">✨ Mobile-Optimized Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">📱 Bottom Navigation</h4>
            <p className="docs-text text-sm">
              Fixed navigation bar at the bottom for easy thumb access. Quickly switch between Home, Collections, Expenses, Analytics, and Showcase.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">👆 Touch-Friendly</h4>
            <p className="docs-text text-sm">
              Large buttons, touch-friendly forms, and swipe gestures make mobile interaction smooth and intuitive.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">📊 Responsive Charts</h4>
            <p className="docs-text text-sm">
              All charts and analytics adapt to mobile screens. Rotate your device to landscape for better viewing.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">📸 Camera Integration</h4>
            <p className="docs-text text-sm">
              Directly upload photos from your camera or gallery. Perfect for receipt scanning and event photography.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">⚡ Fast Loading</h4>
            <p className="docs-text text-sm">
              Optimized for mobile networks. Works smoothly even on 3G connections.
            </p>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-accent mb-2">🔄 Pull to Refresh</h4>
            <p className="docs-text text-sm">
              Standard mobile gesture support. Pull down to refresh data across all pages.
            </p>
          </div>
        </div>
      </div>

      <div id="mobile-tips" className="docs-subsection">
        <h3 className="docs-subheading">💡 Mobile Usage Tips</h3>
        
        <div className="docs-card">
          <ul className="docs-list">
            <li>
              <strong>Use Landscape Mode for Tables:</strong> Rotate your device to see more columns in collection and expense tables.
            </li>
            <li>
              <strong>Bookmark the Festival:</strong> Save your festival URL in browser bookmarks for quick access.
            </li>
            <li>
              <strong>Enable Notifications:</strong> Allow browser notifications to stay updated (if enabled by admin).
            </li>
            <li>
              <strong>Use WiFi for Uploads:</strong> Large media files upload faster on WiFi. Avoid mobile data for big uploads.
            </li>
            <li>
              <strong>Screenshot for Reference:</strong> Take screenshots of important stats or transactions for offline reference.
            </li>
            <li>
              <strong>Share Festival Code:</strong> Use the "Copy URL" button to quickly share festival link via WhatsApp or SMS.
            </li>
          </ul>
        </div>
      </div>

      <div id="mobile-troubleshooting" className="docs-subsection">
        <h3 className="docs-subheading">🔧 Mobile Troubleshooting</h3>
        
        <div className="space-y-4">
          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Issue: Page not loading on mobile</h4>
            <p className="docs-text text-sm mb-2"><strong>Solutions:</strong></p>
            <ul className="docs-list text-sm">
              <li>Check your internet connection (WiFi or mobile data)</li>
              <li>Refresh the page by pulling down</li>
              <li>Clear browser cache and reload</li>
              <li>Try opening in a different browser</li>
            </ul>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Issue: Charts not displaying properly</h4>
            <p className="docs-text text-sm mb-2"><strong>Solutions:</strong></p>
            <ul className="docs-list text-sm">
              <li>Rotate device to landscape mode</li>
              <li>Zoom out to see full chart</li>
              <li>Update your browser to the latest version</li>
              <li>Scroll horizontally on wide charts</li>
            </ul>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Issue: Cannot upload images from camera</h4>
            <p className="docs-text text-sm mb-2"><strong>Solutions:</strong></p>
            <ul className="docs-list text-sm">
              <li>Grant camera and storage permissions to browser</li>
              <li>Check device storage space</li>
              <li>Try uploading smaller image sizes</li>
              <li>Use "Choose from Gallery" instead of camera</li>
            </ul>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Issue: Keyboard covering input fields</h4>
            <p className="docs-text text-sm mb-2"><strong>Solutions:</strong></p>
            <ul className="docs-list text-sm">
              <li>Scroll down after keyboard appears</li>
              <li>Tap the input field again to bring it into view</li>
              <li>Use full-screen mode (from home screen icon)</li>
              <li>Rotate to landscape for more screen space</li>
            </ul>
          </div>

          <div className="docs-card">
            <h4 className="font-semibold text-docs-foreground mb-2">Issue: Session keeps logging out</h4>
            <p className="docs-text text-sm mb-2"><strong>Solutions:</strong></p>
            <ul className="docs-list text-sm">
              <li>Don't clear browser data/cookies</li>
              <li>Avoid "Incognito/Private" browsing mode</li>
              <li>Ensure date/time on device is correct</li>
              <li>Sessions expire at midnight IST - this is normal</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="future-native-apps" className="docs-subsection">
        <h3 className="docs-subheading">🚀 Future: Native Mobile Apps</h3>
        
        <div className="docs-card bg-docs-accent/10 border-docs-accent/20">
          <p className="docs-text mb-3">
            Native mobile applications for Android and iOS are under consideration for future development!
          </p>
          <h4 className="font-semibold text-docs-accent mb-2">Planned Features:</h4>
          <ul className="docs-list text-sm">
            <li>Offline data caching for no-internet access</li>
            <li>Push notifications for important updates</li>
            <li>Faster performance with native code</li>
            <li>Better camera and gallery integration</li>
            <li>Biometric authentication (fingerprint/face)</li>
            <li>Download from Play Store and App Store</li>
          </ul>
          <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              📱 For now, the web app provides excellent mobile experience with all core features!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
