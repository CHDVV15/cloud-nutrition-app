from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, date
import os
from dotenv import load_dotenv
import requests
import re
import firebase_admin
from firebase_admin import credentials, auth, firestore
import json
from google.cloud import bigquery

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH')
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')

# Initialize Firebase Admin SDK
try:
    if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully")
    elif FIREBASE_PROJECT_ID:
        # For Google Cloud Run deployment, use default credentials
        firebase_admin.initialize_app()
        print("Firebase Admin SDK initialized with default credentials")
    else:
        print("Firebase credentials not found, running without Firebase")
        firebase_admin = None
except Exception as e:
    print(f"Firebase initialization failed: {e}")
    firebase_admin = None

# Initialize Firestore
try:
    if firebase_admin:
        db = firestore.client()
        print("Firestore client initialized")
    else:
        db = None
        print("Firestore not available")
except Exception as e:
    print(f"Firestore initialization failed: {e}")
    db = None

# Edamam API Configuration
EDAMAM_APP_ID = os.getenv('EDAMAM_APP_ID')
EDAMAM_APP_KEY = os.getenv('EDAMAM_APP_KEY')

class BigQueryNutritionClient:
    def __init__(self):
        self.client = bigquery.Client()
        self.project_id = "nutrition-463318"  # TODO: Replace with your GCP project ID
        self.dataset_id = "nutrition_data"   # TODO: Replace with your dataset name
        self.table_id = "nutrient_table"              # TODO: Replace with your table name

    def get_nutrition_info(self, food_query):
        cleaned_query = re.sub(r'\\d+', '', food_query).strip().lower()
        print(f"Querying BigQuery for: '%{cleaned_query}%'")  # Debug print

        query = f"""
        SELECT *
        FROM `{self.project_id}.{self.dataset_id}.{self.table_id}`
        WHERE LOWER(food) LIKE @food_name
        LIMIT 1
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("food_name", "STRING", f"%{cleaned_query}%")
            ]
        )
        query_job = self.client.query(query, job_config=job_config)
        results = list(query_job.result())
        if results:
            row = dict(results[0])
            nutrients = {
                'calories': row.get('Caloric Value', 0),
                'protein': row.get('Protein', 0),
                'carbs': row.get('Carbohydrates', 0),
                'fat': row.get('Fat', 0),
                'fiber': row.get('Dietary Fiber', 0),
                'sugar': row.get('Sugars', 0)
            }
            return {'totalNutrients': nutrients, 'totalWeight': 100}
        else:
            print(f"Food '{food_query}' (cleaned: '{cleaned_query}') not found in BigQuery table.")
            return None

class FoodParser:
    def __init__(self):
        self.nutrition_client = BigQueryNutritionClient()
    
    def parse_food_items(self, food_text):
        items = []
        food_parts = re.split(r'\s+and\s+|\s*,\s*|\s*\+\s*', food_text)
        for part in food_parts:
            part = part.strip()
            if part:
                quantity_match = re.match(r'(\d+)\s+(.+)', part)
                if quantity_match:
                    quantity = int(quantity_match.group(1))
                    food_name = quantity_match.group(2).strip()
                else:
                    quantity = 1
                    food_name = part
                items.append({
                    'quantity': quantity,
                    'food_name': food_name,
                    'query': part
                })
        return items

    def get_nutrition_for_items(self, food_items):
        foods_with_nutrition = []
        total_nutrients = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0
        }
        for item in food_items:
            nutrition_data = self.nutrition_client.get_nutrition_info(item['query'])
            if nutrition_data and 'totalNutrients' in nutrition_data:
                nutrients = nutrition_data['totalNutrients']
                item_nutrients = {
                    'calories': nutrients.get('calories', 0) * item['quantity'],
                    'protein': nutrients.get('protein', 0) * item['quantity'],
                    'carbs': nutrients.get('carbs', 0) * item['quantity'],
                    'fat': nutrients.get('fat', 0) * item['quantity'],
                    'fiber': nutrients.get('fiber', 0) * item['quantity'],
                    'sugar': nutrients.get('sugar', 0) * item['quantity']
                }
                for nutrient, value in item_nutrients.items():
                    total_nutrients[nutrient] += value
                foods_with_nutrition.append({
                    'item': f"{item['quantity']} {item['food_name']}",
                    'nutrients': item_nutrients
                })
            else:
                print(f"Skipping '{item['query']}' as it was not found in BigQuery.")
        return foods_with_nutrition, total_nutrients

def verify_firebase_token(token):
    """Verify Firebase ID token and return user info"""
    if not firebase_admin:
        return None
    
    try:
        decoded_token = auth.verify_id_token(token)
        return {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'name': decoded_token.get('name', ''),
            'picture': decoded_token.get('picture', '')
        }
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

def get_or_create_user_profile(user_info):
    """Get or create user profile in Firestore"""
    if not db:
        return user_info
    
    try:
        user_ref = db.collection('users').document(user_info['uid'])
        user_doc = user_ref.get()
        
        if user_doc.exists:
            # Update existing user profile
            user_ref.update({
                'last_login': datetime.utcnow(),
                'email': user_info.get('email'),
                'name': user_info.get('name'),
                'picture': user_info.get('picture')
            })
            return user_doc.to_dict()
        else:
            # Create new user profile
            user_data = {
                'uid': user_info['uid'],
                'email': user_info.get('email'),
                'name': user_info.get('name', ''),
                'picture': user_info.get('picture', ''),
                'created_at': datetime.utcnow(),
                'last_login': datetime.utcnow(),
                'nutrition_goals': {
                    'calories': 2000,
                    'protein': 100,
                    'carbs': 250,
                    'fat': 70,
                    'fiber': 30,
                    'sugar': 50
                }
            }
            user_ref.set(user_data)
            return user_data
    except Exception as e:
        print(f"Error managing user profile: {e}")
        return user_info

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'firebase_enabled': firebase_admin is not None,
        'firestore_enabled': db is not None
    })

@app.route('/api/auth/verify', methods=['POST'])
def verify_token():
    """Verify Firebase ID token and return user profile"""
    try:
        data = request.get_json()
        if not data or 'token' not in data:
            return jsonify({'error': 'Token is required'}), 400
        
        token = data['token']
        user_info = verify_firebase_token(token)
        
        if not user_info:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Get or create user profile
        user_profile = get_or_create_user_profile(user_info)
        
        return jsonify({
            'message': 'Token verified successfully',
            'user': user_profile
        })
        
    except Exception as e:
        print(f"Error verifying token: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/auth/user/<uid>', methods=['GET'])
def get_user_profile(uid):
    """Get user profile by UID"""
    try:
        if not db:
            return jsonify({'error': 'Firestore not available'}), 503
        
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user_doc.to_dict()
        # Convert datetime objects to ISO format
        if 'created_at' in user_data:
            user_data['created_at'] = user_data['created_at'].isoformat()
        if 'last_login' in user_data:
            user_data['last_login'] = user_data['last_login'].isoformat()
        
        return jsonify({
            'user': user_data
        })
        
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/auth/user/<uid>/goals', methods=['PUT'])
def update_user_goals(uid):
    """Update user nutrition goals"""
    try:
        if not db:
            return jsonify({'error': 'Firestore not available'}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate nutrition goals
        required_fields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({'error': 'User not found'}), 404
        
        # Update nutrition goals
        user_ref.update({
            'nutrition_goals': data,
            'updated_at': datetime.utcnow()
        })
        
        return jsonify({
            'message': 'Nutrition goals updated successfully',
            'goals': data
        })
        
    except Exception as e:
        print(f"Error updating user goals: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/log_meal', methods=['POST'])
def log_meal():
    """Log a meal with nutrition data"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Check for Firebase authentication
        auth_header = request.headers.get('Authorization')
        user_id = None
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user_info = verify_firebase_token(token)
            if user_info:
                user_id = user_info['uid']
                # Get or create user profile
                get_or_create_user_profile(user_info)
        
        # Fallback to user_id in request body if no Firebase auth
        if not user_id:
            user_id = data.get('user_id')
        
        food_items = data.get('food_items')
        meal_date = data.get('date', date.today().isoformat())
        
        if not user_id:
            return jsonify({'error': 'user_id is required or valid Firebase token must be provided'}), 400
        
        if not food_items:
            return jsonify({'error': 'food_items is required'}), 400
        
        # Parse food items and get nutrition data
        parser = FoodParser()
        parsed_items = parser.parse_food_items(food_items)
        foods_with_nutrition, total_nutrients = parser.get_nutrition_for_items(parsed_items)
        
        # Create meal document
        meal_document = {
            'user_id': user_id,
            'date': meal_date,
            'food_items': food_items,
            'total_nutrients': total_nutrients,
            'foods': foods_with_nutrition,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Store in Firestore
        if db:
            add_result = db.collection('meals').add(meal_document)
            if hasattr(add_result, 'id'):
                # Newer Firestore: add() returns DocumentReference
                meal_document['_id'] = add_result.id
                meal_id = add_result.id
            elif isinstance(add_result, tuple) and hasattr(add_result[0], 'id'):
                # Older Firestore: add() returns (DocumentReference, write_result)
                meal_document['_id'] = add_result[0].id
                meal_id = add_result[0].id
            else:
                meal_document['_id'] = 'unknown'
                meal_id = 'unknown'
            
            return jsonify({
                'message': 'Meal logged successfully',
                'meal_id': meal_id,
                'data': meal_document
            }), 201
        else:
            # Return nutrition data without storing
            meal_document['_id'] = 'temp_id'
            return jsonify({
                'message': 'Meal processed (database not available)',
                'meal_id': 'temp_id',
                'data': meal_document
            }), 200
        
    except Exception as e:
        print(f"Error logging meal: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def update_daily_summary(user_id, meal_date, nutrients):
    """Update or create daily nutrition summary"""
    if not db:
        print("Database not available, skipping daily summary update")
        return
        
    try:
        # Find existing summary for the date
        existing_summary_query = db.collection('daily_summaries').where('user_id', '==', user_id).where('date', '==', meal_date).get()
        
        if existing_summary_query:
            # Update existing summary
            existing_summary_doc = existing_summary_query[0]
            existing_data = existing_summary_doc.to_dict()
            updated_nutrients = {}
            for nutrient, value in nutrients.items():
                updated_nutrients[nutrient] = existing_data.get('total_nutrients', {}).get(nutrient, 0) + value
            
            db.collection('daily_summaries').document(existing_summary_doc.id).update({
                'total_nutrients': updated_nutrients,
                'updated_at': datetime.utcnow()
            })
        else:
            # Create new summary
            summary_document = {
                'user_id': user_id,
                'date': meal_date,
                'total_nutrients': nutrients,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            db.collection('daily_summaries').add(summary_document)
        
    except Exception as e:
        print(f"Error updating daily summary: {e}")

@app.route('/api/meals/<user_id>', methods=['GET'])
def get_user_meals(user_id):
    """Get meals for a specific user"""
    try:
        date_filter = request.args.get('date')
        
        if not db:
            return jsonify({'error': 'Firestore not available'}), 503
        
        # Build query
        query = db.collection('meals').where('user_id', '==', user_id)
        if date_filter:
            query = query.where('date', '==', date_filter)
        
        meals_query = query.order_by('created_at', direction=firestore.Query.DESCENDING).get()
        meals = []
        
        # Convert Firestore documents to dictionaries
        for meal in meals_query:
            meal_data = meal.to_dict()
            meal_data['_id'] = str(meal.id)
            if 'created_at' in meal_data:
                meal_data['created_at'] = meal_data['created_at'].isoformat()
            if 'updated_at' in meal_data:
                meal_data['updated_at'] = meal_data['updated_at'].isoformat()
            meals.append(meal_data)
        
        return jsonify({
            'meals': meals,
            'count': len(meals)
        })
        
    except Exception as e:
        print(f"Error fetching meals: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/summary/<user_id>', methods=['GET'])
def get_daily_summary(user_id):
    """Get daily nutrition summary for a user"""
    try:
        summary_date = request.args.get('date', date.today().isoformat())
        
        if not db:
            return jsonify({'error': 'Firestore not available'}), 503
        
        # Calculate totals directly from meals collection for the specific date
        meals_query = db.collection('meals').where('user_id', '==', user_id).where('date', '==', summary_date).get()
        
        # Initialize totals
        total_nutrients = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0
        }
        
        # Sum up nutrients from all meals for the date
        for meal in meals_query:
            meal_data = meal.to_dict()
            if 'total_nutrients' in meal_data:
                nutrients = meal_data['total_nutrients']
                for nutrient, value in total_nutrients.items():
                    total_nutrients[nutrient] += nutrients.get(nutrient, 0)
        
        return jsonify({
            'summary': total_nutrients,
            'date': summary_date
        })
        
    except Exception as e:
        print(f"Error fetching summary: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/nutrition_summary', methods=['GET'])
def nutrition_summary():
    """
    Get total nutrients consumed for a user on a given date.
    Query params: user_id, date (YYYY-MM-DD)
    Returns: total calories, protein, carbs, fat, fiber, sugar
    """
    user_id = request.args.get('user_id')
    summary_date = request.args.get('date', date.today().isoformat())

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    # If Firestore is not available, return empty data
    if not db:
        summary = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0,
        }
        return jsonify({'user_id': user_id, 'date': summary_date, 'summary': summary})

    try:
        # Get all meals for the user on the specified date
        meals_query = db.collection('meals').where('user_id', '==', user_id).where('date', '==', summary_date).get()
        
        # Calculate totals
        total_nutrients = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0,
        }
        
        for meal in meals_query:
            meal_data = meal.to_dict()
            if 'total_nutrients' in meal_data:
                nutrients = meal_data['total_nutrients']
                for nutrient, value in total_nutrients.items():
                    total_nutrients[nutrient] += nutrients.get(nutrient, 0)
        
        return jsonify({'user_id': user_id, 'date': summary_date, 'summary': total_nutrients})
    except Exception as e:
        print(f"Error calculating nutrition summary: {e}")
        # Return empty data instead of error
        summary = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0,
        }
        return jsonify({'user_id': user_id, 'date': summary_date, 'summary': summary})

@app.route('/api/recommend_next_meal', methods=['GET'])
def recommend_next_meal():
    """
    Recommend foods for the next meal based on today's nutrient deficits.
    Query params: user_id, date (YYYY-MM-DD)
    Returns: deficits and 2-3 food suggestions
    """
    user_id = request.args.get('user_id')
    summary_date = request.args.get('date', date.today().isoformat())

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    # User goals (could be fetched from DB in a real app)
    goals = {
        'calories': 2000,
        'protein': 100,
        'carbs': 250,
        'fat': 70,
        'fiber': 30,
        'sugar': 50
    }

    # Predefined food/recipe list (could be expanded or loaded from DB)
    food_list = [
        {'name': 'Grilled Chicken Breast', 'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0, 'sugar': 0},
        {'name': 'Lentil Soup', 'calories': 180, 'protein': 12, 'carbs': 30, 'fat': 3, 'fiber': 8, 'sugar': 4},
        {'name': 'Tofu Stir Fry', 'calories': 200, 'protein': 16, 'carbs': 10, 'fat': 12, 'fiber': 3, 'sugar': 2},
        {'name': 'Oats with Berries', 'calories': 250, 'protein': 8, 'carbs': 45, 'fat': 5, 'fiber': 6, 'sugar': 10},
        {'name': 'Greek Yogurt with Nuts', 'calories': 220, 'protein': 20, 'carbs': 10, 'fat': 12, 'fiber': 2, 'sugar': 8},
        {'name': 'Salmon Fillet', 'calories': 208, 'protein': 25, 'carbs': 0, 'fat': 12, 'fiber': 0, 'sugar': 0},
        {'name': 'Quinoa Salad', 'calories': 180, 'protein': 6, 'carbs': 32, 'fat': 3, 'fiber': 5, 'sugar': 2},
        {'name': 'Chickpea Curry', 'calories': 210, 'protein': 10, 'carbs': 35, 'fat': 6, 'fiber': 7, 'sugar': 5},
        {'name': 'Steamed Broccoli', 'calories': 55, 'protein': 4, 'carbs': 11, 'fat': 0.5, 'fiber': 5, 'sugar': 2},
        {'name': 'Egg Omelette', 'calories': 150, 'protein': 12, 'carbs': 2, 'fat': 10, 'fiber': 0, 'sugar': 1}
    ]

    # Fetch today's nutrients from Firestore
    if not db:
        today_nutrients = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0
        }
    else:
        try:
            meals_query = db.collection('meals').where('user_id', '==', user_id).where('date', '==', summary_date).get()
            
            today_nutrients = {
                'calories': 0,
                'protein': 0,
                'carbs': 0,
                'fat': 0,
                'fiber': 0,
                'sugar': 0
            }
            
            for meal in meals_query:
                meal_data = meal.to_dict()
                if 'total_nutrients' in meal_data:
                    nutrients = meal_data['total_nutrients']
                    for nutrient, value in today_nutrients.items():
                        today_nutrients[nutrient] += nutrients.get(nutrient, 0)
        except Exception as e:
            print(f"Error fetching today's nutrients: {e}")
            today_nutrients = {
                'calories': 0,
                'protein': 0,
                'carbs': 0,
                'fat': 0,
                'fiber': 0,
                'sugar': 0
            }

    # Identify deficits
    deficits = {}
    for nutrient, goal in goals.items():
        consumed = today_nutrients.get(nutrient, 0)
        if consumed < goal:
            deficits[nutrient] = round(goal - consumed, 1)

    # Suggest foods to fill the largest deficits
    # Sort deficits by largest gap
    sorted_deficits = sorted(deficits.items(), key=lambda x: -x[1])
    top_nutrients = [nutrient for nutrient, gap in sorted_deficits[:2]]  # focus on top 2 gaps

    # Score foods by how well they fill the top deficits
    def food_score(food):
        score = 0
        for nutrient in top_nutrients:
            score += food.get(nutrient, 0)
        return score
    
    # Sort food list by score and pick top 2-3
    suggested_foods = sorted(food_list, key=food_score, reverse=True)[:3]

    return jsonify({
        'user_id': user_id,
        'date': summary_date,
        'deficits': deficits,
        'suggestions': suggested_foods
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 