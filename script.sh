#!/bin/bash

# PT Permata Energi Borneo - Financial System Setup Script
# This script sets up the complete React application structure

echo "🚀 Setting up PT Permata Energi Borneo Financial System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Create React app
echo "📦 Creating React application..."
npx create-react-app pt-peb-financial-system
cd pt-peb-financial-system

# Install dependencies
echo "📦 Installing dependencies..."
npm install firebase@10.7.1 react-router-dom@6.20.1 chart.js@4.4.1 react-chartjs-2@5.2.0 jspdf@2.5.1 html2canvas@1.4.1

# Install dev dependencies
echo "📦 Installing dev dependencies..."
npm install -D tailwindcss@3.3.6 postcss@8.4.32 autoprefixer@10.4.16

# Initialize Tailwind CSS
echo "🎨 Initializing Tailwind CSS..."
npx tailwindcss init -p

# Update Tailwind config
cat > tailwind.config.js << 'EOF'
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/components/auth
mkdir -p src/components/dashboard
mkdir -p src/components/projects
mkdir -p src/components/transactions
mkdir -p src/components/reports
mkdir -p src/components/layout
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/styles

# Create .env.example
echo "🔐 Creating environment configuration..."
cat > .env.example << 'EOF'
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id_here
REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here

# Gemini AI Configuration
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Environment
REACT_APP_ENV=development
EOF

# Copy .env.example to .env
cp .env.example .env

# Update .gitignore
echo "📝 Updating .gitignore..."
cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# editor
.vscode/
.idea/
*.swp
*.swo
*~

# firebase
.firebase/
.firebaserc
firebase-debug.log
firestore-debug.log
firestore.rules
firestore.indexes.json

# temporary files
*.tmp
*.temp
.cache/

# OS files
Thumbs.db
EOF

# Create a placeholder README
echo "📚 Creating README..."
cat > README.md << 'EOF'
# PT Permata Energi Borneo - Financial System

## 🚀 Quick Start

1. **Configure Firebase**
   - Update `.env` with your Firebase credentials
   - Enable Email/Password authentication in Firebase Console
   - Create Firestore database
   - Enable Storage

2. **Configure Gemini AI**
   - Add your Gemini API key to `.env`

3. **Create Admin User**
   - In Firebase Authentication, create a user
   - In Firestore, create `users` collection with document:
   ```json
   {
     "email": "admin@example.com",
     "role": "admin",
     "name": "Admin Name"
   }
   ```

4. **Run the Application**
   ```bash
   npm start
   ```

## 📋 Features

- 🔐 Email/Password Authentication
- 👤 Role-based Access Control
- 📊 Project Management
- 💰 Transaction Tracking
- 🤖 AI-powered Transaction Input
- 📈 Financial Reports with Charts
- 📱 Mobile Responsive
- 📄 PDF Generation
- 💬 WhatsApp Sharing

## 🛠️ Technologies

- React 18
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS
- Chart.js
- jsPDF
- Gemini AI

## 📝 License

Private - PT Permata Energi Borneo
EOF

echo "✅ Project structure created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy all component files from the artifacts to their respective directories"
echo "2. Update .env with your Firebase and Gemini credentials"
echo "3. Set up Firebase (Authentication, Firestore, Storage)"
echo "4. Create admin user in Firebase"
echo "5. Run 'npm start' to start the development server"
echo ""
echo "🎉 Setup complete! Happy coding!"