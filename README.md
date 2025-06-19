# Nutrition Tracker

A modern web application for tracking daily nutrition and meal logging with a beautiful, responsive UI.

## Features

- **Meal Logging**: Quick and easy meal logging with natural language input
- **Nutrition Analysis**: Automatic nutrition calculation using Edamam API
- **Daily Dashboard**: Visual progress tracking for daily nutrition goals
- **User Authentication**: Secure Firebase authentication
- **Responsive Design**: Modern UI that works on desktop and mobile

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- Firebase for authentication

### Backend
- Python Flask
- Firebase Admin SDK
- Edamam Nutrition API

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Firebase project
- Edamam API key

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase configuration in `src/firebase.ts`

4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables (copy from `env.example`):
   ```bash
   cp env.example .env
   ```

5. Start the Flask server:
   ```bash
   python app.py
   ```

## Environment Variables

### Backend (.env)
```
EDAMAM_APP_ID=your_edamam_app_id
EDAMAM_APP_KEY=your_edamam_app_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

### Frontend
Configure Firebase in `src/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
};
```

## API Endpoints

- `POST /api/meals` - Log a new meal
- `GET /api/meals` - Get user's meals for today
- `GET /api/summary` - Get daily nutrition summary

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License 