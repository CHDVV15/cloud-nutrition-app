# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for your Nutrition Assistant application.

## 🚀 Quick Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "nutrition-assistant")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the authentication providers you want to use:
   - **Email/Password** (recommended for testing)
   - **Google** (for Google sign-in)
   - **Anonymous** (for guest users)

### 3. Set up Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

### 4. Generate Service Account Key (Backend)

1. In your Firebase project, go to "Project settings" (gear icon)
2. Go to the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely (this contains sensitive credentials)
5. Place the file in your backend directory (e.g., `backend/firebase-service-account.json`)

### 5. Configure Backend Environment Variables

1. Copy the service account file path to your `.env` file:
   ```env
   FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
   FIREBASE_PROJECT_ID=your-project-id
   ```

2. Replace `your-project-id` with your actual Firebase project ID

### 6. Configure Frontend Firebase

1. In your Firebase project, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click on the web app or create a new one by clicking the web icon
4. Copy the Firebase config object

5. Create a new file `frontend/src/firebase.config.ts`:
   ```typescript
   export const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

6. Update `frontend/src/firebase.ts` to import from the config:
   ```typescript
   import { firebaseConfig } from './firebase.config';
   ```

### 7. Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 8. Test the Setup

1. Start your backend server:
   ```bash
   cd backend
   python app.py
   ```

2. Start your frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Check the health endpoint: `GET http://localhost:5000/health`
4. You should see `"firebase_enabled": true` and `"firestore_enabled": true` in the response

## 🔧 Features Implemented

### Authentication Features
- ✅ Email/Password authentication
- ✅ Google Sign-in
- ✅ User registration and login
- ✅ Automatic token management
- ✅ Protected routes
- ✅ User profile management

### API Integration
- ✅ Automatic token inclusion in API requests
- ✅ Backend token verification
- ✅ User-specific data access
- ✅ Secure meal logging

### UI Components
- ✅ Modern login/signup form
- ✅ Google sign-in button
- ✅ User profile display
- ✅ Logout functionality
- ✅ Loading states and error handling

## 🔐 Security Rules

For production, set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own meals
    match /meals/{mealId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.user_id;
    }
    
    // Users can only access their own daily summaries
    match /daily_summaries/{summaryId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.user_id;
    }
  }
}
```

## 📁 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Login.tsx              # Login/signup component
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication context
│   ├── services/
│   │   └── api.ts                 # API service with auth
│   ├── firebase.ts                # Firebase initialization
│   ├── firebase.config.ts         # Your Firebase config
│   ├── firebase.config.example.ts # Example config
│   ├── App.tsx                    # Main app with auth
│   └── main.tsx                   # App entry with AuthProvider
```

## 🧪 Testing Authentication

### Test User Registration
1. Open the app in your browser
2. Click "Sign up" on the login form
3. Enter an email and password
4. Click "Create Account"
5. You should be redirected to the main app

### Test User Login
1. Log out if you're logged in
2. Enter your email and password
3. Click "Sign In"
4. You should be redirected to the main app

### Test Google Sign-in
1. Click "Continue with Google"
2. Complete the Google authentication flow
3. You should be redirected to the main app

### Test API Integration
1. Log in to the app
2. Try logging a meal
3. Check that the meal is associated with your user account
4. Verify that only your meals are displayed

## 🚨 Important Notes

1. **Never commit** your `firebase-service-account.json` file to version control
2. **Never commit** your `firebase.config.ts` file with real credentials
3. Add both files to your `.gitignore`:
   ```
   # Firebase
   backend/firebase-service-account.json
   frontend/src/firebase.config.ts
   ```
4. For production deployment, use environment variables
5. Set up proper Firestore security rules before going to production
6. Monitor your Firebase usage to stay within free tier limits

## 🆘 Troubleshooting

### Common Issues

1. **"Firebase not available" error**
   - Check if `FIREBASE_CREDENTIALS_PATH` points to the correct file
   - Verify the service account JSON file exists and is valid

2. **"Permission denied" error**
   - Check Firestore security rules
   - Ensure the service account has proper permissions

3. **"Project not found" error**
   - Verify `FIREBASE_PROJECT_ID` is correct
   - Check if the project exists in Firebase Console

4. **Authentication errors**
   - Verify Firebase Authentication is enabled
   - Check if the sign-in method is properly configured
   - Ensure your Firebase config is correct

5. **"Invalid API key" error**
   - Verify your Firebase config in `firebase.config.ts`
   - Check that the API key matches your Firebase project

6. **CORS errors**
   - Ensure your backend is running on the correct port
   - Check that the frontend is making requests to the correct backend URL

## 📞 Support

If you encounter any issues:
1. Check the Firebase Console for error messages
2. Verify all configuration steps were completed
3. Check the browser console for frontend errors
4. Check the backend logs for server errors
5. Ensure all dependencies are installed correctly 