# Firebase Setup Guide

This guide will help you set up Firebase Authentication and Firestore to replace MongoDB in your Nutrition Assistant application.

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

### 4. Generate Service Account Key

1. In your Firebase project, go to "Project settings" (gear icon)
2. Go to the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely (this contains sensitive credentials)
5. Place the file in your backend directory (e.g., `backend/firebase-service-account.json`)

### 5. Configure Environment Variables

1. Copy the service account file path to your `.env` file:
   ```env
   FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
   FIREBASE_PROJECT_ID=your-project-id
   ```

2. Replace `your-project-id` with your actual Firebase project ID

### 6. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 7. Test the Setup

1. Start your Flask application
2. Check the health endpoint: `GET /health`
3. You should see `"firebase_enabled": true` and `"firestore_enabled": true` in the response

## 🔧 Database Structure

Firestore will automatically create these collections:

### Users Collection
```
users/{user_id}
├── uid: string
├── email: string
├── name: string
├── picture: string (URL)
├── created_at: timestamp
├── last_login: timestamp
├── nutrition_goals: {
│   ├── calories: number
│   ├── protein: number
│   ├── carbs: number
│   ├── fat: number
│   ├── fiber: number
│   └── sugar: number
│ }
└── updated_at: timestamp
```

### Meals Collection
```
meals/{meal_id}
├── user_id: string
├── date: string (YYYY-MM-DD)
├── food_items: string
├── total_nutrients: {
│   ├── calories: number
│   ├── protein: number
│   ├── carbs: number
│   ├── fat: number
│   ├── fiber: number
│   └── sugar: number
│ }
├── foods: array
├── created_at: timestamp
└── updated_at: timestamp
```

### Daily Summaries Collection
```
daily_summaries/{summary_id}
├── user_id: string
├── date: string (YYYY-MM-DD)
├── total_nutrients: {
│   ├── calories: number
│   ├── protein: number
│   ├── carbs: number
│   ├── fat: number
│   ├── fiber: number
│   └── sugar: number
│ }
├── created_at: timestamp
└── updated_at: timestamp
```

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

## 🌐 Frontend Integration

### 1. Install Firebase SDK

```bash
cd frontend
npm install firebase
```

### 2. Initialize Firebase

Create `frontend/src/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 3. Authentication Example

```javascript
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';

// Sign in
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const token = await user.getIdToken();
    
    // Send token to backend
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });
    
    return response.json();
  } catch (error) {
    console.error('Sign in error:', error);
  }
};

// Sign out
const signOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
```

## 📊 API Endpoints

### Authentication Endpoints
- `POST /api/auth/verify` - Verify Firebase token and get user profile
- `GET /api/auth/user/<uid>` - Get user profile by UID
- `PUT /api/auth/user/<uid>/goals` - Update user nutrition goals

### Meal Management Endpoints
- `POST /api/log_meal` - Log a meal (supports Firebase auth)
- `GET /api/meals/<user_id>` - Get user meals
- `GET /api/summary/<user_id>` - Get daily nutrition summary
- `GET /api/nutrition_summary` - Get total nutrients for a date
- `GET /api/recommend_next_meal` - Get meal recommendations

## 🔍 Testing

### Test Firebase Connection
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000000",
  "version": "1.0.0",
  "firebase_enabled": true,
  "firestore_enabled": true
}
```

### Test Authentication
```bash
# First, get a Firebase token from your frontend
# Then test the verify endpoint
curl -X POST http://localhost:5000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "your-firebase-token"}'
```

## 🚨 Important Notes

1. **Never commit** your `firebase-service-account.json` file to version control
2. Add `firebase-service-account.json` to your `.gitignore` file
3. For production deployment, use environment variables or Google Cloud's default credentials
4. Set up proper Firestore security rules before going to production
5. Monitor your Firebase usage to stay within free tier limits

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