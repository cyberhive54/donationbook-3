# Quick Setup Guide

Follow these steps to get your Donation Book application running in minutes.

## Step 1: Supabase Setup (5 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/login
   - Click "New Project"
   - Enter project name, database password, and region
   - Wait for project to be created (~2 minutes)

2. **Run Database Schema**
   - In your Supabase dashboard, go to **SQL Editor**
   - Click "New Query"
   - Open `supabase-schema.sql` from this project
   - Copy and paste the entire content
   - Click "Run" or press `Ctrl/Cmd + Enter`
   - You should see "Success" message

3. **Get API Credentials**
   - Go to **Settings** > **API** in Supabase dashboard
   - Copy the following:
     - `Project URL`
     - `anon public` key

## Step 2: Configure Environment Variables (1 minute)

1. Open `.env.local` in the project root
2. Replace the placeholder values:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

## Step 3: Install Dependencies (2 minutes)

\`\`\`bash
npm install
\`\`\`

## Step 4: Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Step 5: First Login

1. You'll see a password prompt
2. Enter default password: `Festive@123`
3. You should now see the dashboard

## Step 6: Access Admin Panel

1. Go to [http://localhost:3000/admin?p=admin](http://localhost:3000/admin?p=admin)
2. You'll be automatically logged in as admin
3. Change passwords if needed in the Admin panel

## Verification Checklist

✅ Supabase project created  
✅ Database schema executed successfully  
✅ Environment variables configured  
✅ Dependencies installed  
✅ Development server running  
✅ Can access home page with user password  
✅ Can access admin page with admin password  

## Common Issues

### "Failed to fetch data"
- Check your `.env.local` file has correct credentials
- Verify Supabase project is active
- Ensure SQL schema was run successfully

### "Wrong password"
- Default user password: `Festive@123`
- Default admin password: `admin`
- Check passwords table in Supabase SQL Editor:
  \`\`\`sql
  SELECT * FROM passwords;
  \`\`\`

### Blank page or errors
- Check browser console for errors
- Verify all dependencies installed: `npm install`
- Clear browser cache and localStorage
- Restart dev server: `npm run dev`

## Next Steps

1. **Add Sample Data**: Go to Admin panel and add some collections and expenses
2. **Customize Settings**: Add groups, categories, and payment modes
3. **Update Event Info**: Edit basic information from Admin panel
4. **Change Passwords**: Update user and admin passwords for security
5. **Test Features**: Try filtering, sorting, and viewing charts

## Production Deployment

### Quick Deploy to Vercel

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Go to Settings > Environment Variables
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
\`\`\`

### Other Platforms

For Netlify, Railway, or other platforms:
1. Connect your Git repository
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add environment variables
5. Deploy

## Support

If you encounter issues:
1. Check this guide again
2. Review `README.md` for detailed documentation
3. Check Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
4. Check Next.js documentation at [nextjs.org/docs](https://nextjs.org/docs)

---

**Estimated Total Setup Time**: 10-15 minutes

Enjoy your Donation Book app! 🎉
