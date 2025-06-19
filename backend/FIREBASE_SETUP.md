# Firebase Setup Guide

This guide will help you set up Firebase Authentication and Firestore for the Nutrition Assistant application.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "nutrition-assistant")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the authentication providers you want to use:
   - **Email/Password** (recommended for testing)
   - **Google** (for Google sign-in)
   - **Anonymous** (for guest users)

## 3. Set up Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## 4. Generate Service Account Key

1. In your Firebase project, go to "Project settings" (gear icon)
2. Go to the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely (this contains sensitive credentials)
5. Place the file in your backend directory (e.g., `backend/firebase-service-account.json`)

## 5. Configure Environment Variables

1. Copy the service account file path to your `.env` file:
   ```
   FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
   FIREBASE_PROJECT_ID=your-actual-project-id
   
   # Edamam API Configuration (optional)
   EDAMAM_APP_ID=your_edamam_app_id
   EDAMAM_APP_KEY=your_edamam_app_key
   ```

2. Replace `your-actual-project-id` with your actual Firebase project ID

## 6. Install Dependencies

```bash
pip install firebase-admin==6.2.0
```

## 7. Test the Setup

1. Start your Flask application
2. Check the health endpoint: `GET /health`
3. You should see `"firebase_enabled": true` in the response

## 8. Frontend Integration

To use Firebase Authentication in your frontend:

1. Install Firebase SDK:
   ```bash
   npm install firebase
   ```

2. Initialize Firebase in your frontend:
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';

   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };

   const app = initializeApp(firebaseConfig);
   const auth = getAuth(app);
   ```

3. Get the Firebase config from your project settings in the Firebase Console.

## Security Notes

- Never commit your service account JSON file to version control
- Add `firebase-service-account.json` to your `.gitignore` file
- For production, use environment variables or Google Cloud's default credentials
- Set up proper Firestore security rules before going to production

## API Endpoints

With Firebase enabled, you can use these new endpoints:

- `POST /api/auth/verify` - Verify Firebase token and get user profile
- `GET /api/auth/user/<uid>` - Get user profile by UID
- `PUT /api/auth/user/<uid>/goals` - Update user nutrition goals

The existing endpoints now support Firebase authentication via the `Authorization: Bearer <token>` header. 

## 🔥 Complete Firebase Setup Guide

### **Step 5: Configure Environment Variables**

1. **Create Environment File**
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Edit the .env File**
   Open `backend/.env` and update it with your Firebase details:
   ```env
   # Firebase Configuration
   FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
   FIREBASE_PROJECT_ID=your-actual-project-id
   
   # Edamam API Configuration (optional)
   EDAMAM_APP_ID=your_edamam_app_id
   EDAMAM_APP_KEY=your_edamam_app_key
   ```

3. **Find Your Project ID**
   - In Firebase Console, go to Project Settings
   - Your Project ID is displayed at the top (e.g., `nutrition-assistant-12345`)
   - Copy this ID and replace `your-actual-project-id` in your `.env` file

### **Step 6: Install Dependencies**

1. **Navigate to Backend Directory**
   ```bash
   cd backend
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify Installation**
   ```bash
   python -c "import firebase_admin; print('Firebase Admin SDK installed successfully')"
   ```

### **Step 7: Test Firebase Connection**

1. **Start the Flask Application**
   ```bash
   python app.py
   ```

2. **Test Health Endpoint**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Expected Response**
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-01T12:00:00.000000",
     "version": "1.0.0",
     "firebase_enabled": true,
     "firestore_enabled": true
   }
   ```

### **Step 8: Set Up Security Rules (Production)**

1. **Navigate to Firestore Rules**
   - In Firebase Console, go to Firestore Database
   - Click the "Rules" tab

2. **Update Security Rules**
   Replace the default rules with:
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

3. **Publish Rules**
   - Click "Publish" to save the rules

### **Step 9: Test API Endpoints**

1. **Test Authentication Endpoint**
   ```bash
   # This will fail without a valid token, but should return a proper error
   curl -X POST http://localhost:5000/api/auth/verify \
     -H "Content-Type: application/json" \
     -d '{"token": "invalid-token"}'
   ```

2. **Expected Response**
   ```json
   {
     "error": "Invalid token"
   }
   ```

### **Step 10: Frontend Integration (Optional)**

1. **Install Firebase SDK in Frontend**
   ```bash
   cd frontend
   npm install firebase
   ```

2. **Get Firebase Config**
   - In Firebase Console, go to Project Settings
   - Scroll down to "Your apps" section
   - Click the web icon (</>)
   - Register your app with a nickname
   - Copy the Firebase config object

3. **Create Firebase Config File**
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

## 🔍 Verification Checklist

After completing all steps, verify:

- ✅ Firebase project created
- ✅ Authentication enabled
- ✅ Firestore database created
- ✅ Service account key downloaded
- ✅ Environment variables configured
- ✅ Dependencies installed
- ✅ Health endpoint returns `firebase_enabled: true`
- ✅ Security rules configured (for production)

## 🆘 Troubleshooting

### Common Issues:

1. **"Firebase not available" error**
   - Check if `FIREBASE_CREDENTIALS_PATH` points to the correct file
   - Verify the JSON file exists and is valid

2. **"Permission denied" error**
   - Check Firestore security rules
   - Ensure service account has proper permissions

3. **"Project not found" error**
   - Verify `FIREBASE_PROJECT_ID` is correct
   - Check if project exists in Firebase Console

4. **Import errors**
   - Run `pip install firebase-admin==6.2.0`
   - Check Python version compatibility

Your Firebase setup is now complete! The application will use Firebase for authentication and Firestore for data storage instead of MongoDB. 