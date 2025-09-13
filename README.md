# NFC Link Manager 🔗

Modern and user-friendly NFC card management application. Assign links to your NFC cards, manage and personalize them.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)

## 📱 Features

### � Access Control
- **Guest Mode**: Browse the app without logging in
- **Public Main Screen**: Access the main interface without authentication
- **Protected Features**: Secure operations requiring login
- **Smooth Login Flow**: Easy transition from guest to authenticated user

### �🔐 User System
- Secure login with email and password
- Password hashing with Bcrypt
- Personal card management
- Secure session management

### 💳 NFC Card Operations
- **Read**: Read NFC cards and view their content
- **Write**: Assign custom links to cards
- **Reset**: Clear card content
- **Lock**: Permanently lock cards

### 🌐 Multi-language Support
- Turkish (TR) - Default language
- English (EN)
- Automatic language detection
- Language preference saved in LocalStorage

### 🎨 Modern Interface
- Dark theme design
- Mobile-responsive interface
- Material UI icons
- Smooth animations (Framer Motion)
- Toast notifications

### 📊 Card Management
- Card list display
- Search and filter functionality
- Copy and delete operations
- User-based card organization

## 🚀 Installation

### Requirements
- Node.js 18+
- npm or yarn
- Supabase account

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/ayberkkk/nfc-link-manager.git
cd nfc-link-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the development server:
```bash
npm run dev
```

## 🚀 Vercel Deployment

### Environment Variables Setup

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ayberkkk/nfc-link-manager)

Or deploy manually:

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

## � Latest Updates

### Added Guest Mode & Improved Accessibility (13 September 2025)
- **Guest Access**: Users can now browse the main screen without logging in
- **Improved UX**: Clear guidance for features requiring authentication
- **Multilingual Support**: Added new translations for guest mode features
- **Enhanced Stability**: Fixed null reference issues for non-authenticated users
- **Improved Error Handling**: Better error messages for restricted operations
- **Code Quality**: Optimized React hooks and component lifecycles

## �🗄️ Database Setup
