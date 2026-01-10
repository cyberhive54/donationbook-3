# Quick Reference Card

## 🚀 Quick Start (5 minutes)

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Configure Supabase (in .env.local)
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here

# 3. Run Supabase schema (in Supabase SQL Editor)
# Copy contents of supabase-schema.sql

# 4. Start dev server
npm run dev
\`\`\`

## 🔑 Default Credentials

- **User Password**: `Festive@123`
- **Admin Password**: `admin`
- **Admin URL**: `http://localhost:3000/admin?p=admin`

## 📁 Project Structure

\`\`\`
donation-book/
├── app/                    # Pages (Next.js App Router)
├── components/             # React components
│   ├── charts/            # Chart components
│   ├── tables/            # Table components
│   └── modals/            # Modal dialogs
├── lib/                   # Utilities & hooks
├── types/                 # TypeScript interfaces
└── public/                # Static assets
\`\`\`

## 🛠️ Common Commands

\`\`\`bash
npm run dev          # Start development (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check
\`\`\`

## 📊 Database Tables

1. **basic_info** - Event information
2. **collections** - Donation records
3. **expenses** - Expense records
4. **groups** - Collection groups
5. **categories** - Expense categories
6. **collection_modes** - Payment modes for collections
7. **expense_modes** - Payment modes for expenses
8. **passwords** - Authentication credentials

## 🎯 Pages Overview

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Dashboard with recent activity |
| Collection | `/collection` | Manage donations & view analytics |
| Expense | `/expense` | Track expenses & view analytics |
| Transaction | `/transaction` | Combined view of all activities |
| Admin | `/admin?p=admin` | Full CRUD & settings management |

## 🔐 Authentication Flow

### User Access
1. Visit any page
2. Enter password: `Festive@123`
3. Access granted (stored in localStorage)

### Admin Access
1. Visit `/admin?p=admin`
2. Access granted for current day
3. Returns next day, need to visit URL again

## 💾 Data Operations

### Add Collection (Admin)
1. Go to Admin page
2. Click "Add Collection"
3. Fill form (can add up to 5 at once)
4. Click "Save"

### Add Expense (Admin)
1. Go to Admin page
2. Click "Add Expense"
3. Fill form (can add up to 10 at once)
4. Total amount auto-calculates
5. Click "Save"

### Edit/Delete
1. Go to Admin page
2. Find record in table
3. Click edit (pencil icon) or delete (trash icon)
4. Confirm action

## 📈 Available Charts

### Collection Page
- Collection vs Expense Timeline
- Collections by Group (Pie)
- Collections by Mode (Pie)
- Daily Collection Trends (Bar)
- Top 5 Donators (Bar + List)

### Expense Page
- Collection vs Expense Timeline
- Expenses by Category (Pie)
- Expenses by Mode (Pie)
- Daily Expense Trends (Bar)
- Top 8 Expensive Items (Bar)

### Transaction Page
- All above charts
- Daily Collection & Expense Comparison

## 🎨 UI Components

### Tables
- **Search**: Top-right text input
- **Filters**: Dropdowns (group/category, mode)
- **Sort**: Dropdown (latest, oldest, highest, lowest, name)
- **Pagination**: Bottom controls (records per page, prev/next)

### Forms
- **Required fields**: Marked with red asterisk (*)
- **Validation**: On submit
- **Auto-calculate**: Expense total = pieces × price per piece
- **Bulk entry**: "Add More" button (collections: 5, expenses: 10)

### Notifications
- **Success**: Green toast (3 seconds)
- **Error**: Red toast (3 seconds)
- **Position**: Top-center

## 🔧 Configuration

### Change Passwords
1. Admin page → Scroll to "User Password"
2. Click Edit
3. Enter new password
4. Click Save

### Add Groups/Categories
1. Admin page → Scroll to settings
2. Enter name in input field
3. Click "+" button
4. Item added to list

### Delete Groups/Categories
1. Admin page → Find item in list
2. Click trash icon
3. Item deleted (if not in use)

## 📱 Mobile Features

- **Bottom Navigation**: Fixed bar with 4 tabs
- **Responsive Tables**: Horizontal scroll on small screens
- **Touch-Friendly**: Minimum 44px touch targets
- **Optimized Charts**: Stack vertically on mobile

## 🚢 Deployment Quick Guide

### Vercel (Recommended)
\`\`\`bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Add environment variables in Vercel dashboard
# Settings > Environment Variables
\`\`\`

### Other Platforms
1. Connect Git repository
2. Build command: `npm run build`
3. Output directory: `.next`
4. Add environment variables
5. Deploy

## 🐛 Troubleshooting

### "Failed to fetch data"
- Check `.env.local` has correct Supabase URL and key
- Verify Supabase project is active
- Ensure SQL schema was executed

### "Wrong password"
- Default: user=`Festive@123`, admin=`admin`
- Check `passwords` table in Supabase
- Try clearing localStorage: `localStorage.clear()`

### Build errors
- Run `npm install` to ensure all dependencies
- Check TypeScript errors: `npx tsc --noEmit`
- Verify Node.js version: 18+

### Charts not showing
- Ensure collections/expenses exist in database
- Check browser console for errors
- Verify date format is correct (YYYY-MM-DD)

## 📞 Getting Help

1. **Documentation**: Check README.md, SETUP.md, PROJECT_OVERVIEW.md
2. **Supabase**: https://supabase.com/docs
3. **Next.js**: https://nextjs.org/docs
4. **TypeScript**: https://www.typescriptlang.org/docs

## 🎯 Key Features Summary

✅ Dashboard with real-time stats  
✅ Collection management with analytics  
✅ Expense tracking with auto-calculation  
✅ Transaction history (combined view)  
✅ Admin panel with full CRUD  
✅ Password-protected pages  
✅ Mobile-first responsive design  
✅ Interactive charts and graphs  
✅ Filtering, sorting, pagination  
✅ Bulk entry (collections & expenses)  
✅ Settings management  

## 💡 Pro Tips

1. **Use bulk entry** for adding multiple records at once
2. **Filter before sorting** for better performance
3. **Change records per page** to see more data
4. **Use search** to quickly find specific records
5. **Check charts** for insights and trends
6. **Update passwords** after first login
7. **Add groups/categories** before adding records
8. **Use admin panel** for all data management
9. **Export data** by copying from tables (future: CSV export)
10. **Mobile access** works perfectly for viewing data on-the-go

---

**Need more details?** Check the full documentation:
- `README.md` - Complete guide
- `SETUP.md` - Step-by-step setup
- `PROJECT_OVERVIEW.md` - Architecture details
- `CHECKLIST.md` - Feature completion status
