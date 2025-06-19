# Edamam API Setup Guide

This guide will help you set up the Edamam Nutrition API to get accurate nutrition data for your Nutrition Assistant application.

## 🚀 Quick Setup Steps

### 1. Get Edamam API Credentials

1. **Go to Edamam Developer Portal**: https://developer.edamam.com/edamam-nutrition-api
2. **Sign up** for a free account
3. **Create a new application**:
   - Click "Create Application"
   - Choose "Nutrition Analysis API"
   - Give it a name (e.g., "Nutrition Assistant")
4. **Get your credentials**:
   - **Application ID** (starts with something like "abc12345")
   - **Application Key** (starts with something like "def67890")

### 2. Configure Environment Variables

1. **Navigate to your backend folder**:
   ```bash
   cd backend
   ```

2. **Create a `.env` file** (if it doesn't exist):
   ```bash
   # On Windows (PowerShell):
   New-Item -Path ".env" -ItemType File
   
   # Or create it manually in your text editor
   ```

3. **Add your Edamam credentials to the `.env` file**:
   ```env
   # Edamam API Configuration
   EDAMAM_APP_ID=your_actual_app_id_here
   EDAMAM_APP_KEY=your_actual_app_key_here
   
   # Firebase Configuration
   FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
   FIREBASE_PROJECT_ID=nutrition-assistant-63023
   ```

### 3. Test the Edamam API

1. **Run the test script**:
   ```bash
   cd backend
   python test_edamam.py
   ```

2. **Expected output**:
   ```
   🧪 Testing Edamam API Integration...
   ==================================================
   ✅ Found Edamam credentials:
      App ID: abc12345...
      App Key: def67890...
   
   🔍 Testing: 1 apple
      ✅ Calories: 95.0
      ✅ Protein: 0.5g
      ✅ Carbs: 25.0g
      ✅ Fat: 0.3g
   
   🔍 Testing: 2 boiled eggs
      ✅ Calories: 140.0
      ✅ Protein: 12.6g
      ✅ Carbs: 1.2g
      ✅ Fat: 10.0g
   
   🎉 All tests passed! Edamam API is working correctly.
   
   ✅ Edamam API is ready to use!
   You can now log meals and get accurate nutrition data.
   ```

### 4. Start Your Application

1. **Start the backend server**:
   ```bash
   cd backend
   python app.py
   ```

2. **Start the frontend development server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test meal logging** with real nutrition data!

## 🔧 How It Works

### API Integration Flow

1. **User enters food** (e.g., "2 boiled eggs and 1 apple")
2. **Food parser** splits into individual items
3. **Edamam API** gets nutrition data for each item
4. **Backend calculates** total nutrition for the meal
5. **Data is stored** in Firebase with accurate nutrition values

### Example API Response

When you query "1 apple", Edamam returns:
```json
{
  "totalNutrients": {
    "ENERC_KCAL": {
      "label": "Energy",
      "quantity": 95,
      "unit": "kcal"
    },
    "PROCNT": {
      "label": "Protein",
      "quantity": 0.5,
      "unit": "g"
    },
    "CHOCDF": {
      "label": "Carbohydrate",
      "quantity": 25,
      "unit": "g"
    },
    "FAT": {
      "label": "Total lipid (fat)",
      "quantity": 0.3,
      "unit": "g"
    }
  },
  "totalWeight": 182
}
```

### Nutrition Data Mapping

The backend maps Edamam's nutrient keys to our format:

| Edamam Key | Our Key | Description |
|------------|---------|-------------|
| `ENERC_KCAL` | `calories` | Energy in kilocalories |
| `PROCNT` | `protein` | Protein in grams |
| `CHOCDF` | `carbs` | Carbohydrates in grams |
| `FAT` | `fat` | Total fat in grams |
| `FIBTG` | `fiber` | Fiber in grams |
| `SUGAR` | `sugar` | Sugar in grams |

## 📊 Supported Food Formats

The Edamam API supports various food input formats:

### Basic Foods
- `apple`
- `banana`
- `chicken breast`
- `salmon`

### With Quantities
- `1 apple`
- `2 boiled eggs`
- `100g chicken breast`
- `1 cup oatmeal`

### Complex Descriptions
- `1 medium apple`
- `2 large boiled eggs`
- `100 grams grilled chicken breast`
- `1 cup cooked oatmeal`

## 🎯 Benefits of Edamam API

### ✅ Accurate Nutrition Data
- **Real nutrition values** from USDA database
- **Comprehensive nutrient information**
- **Regularly updated data**

### ✅ Wide Food Coverage
- **Over 800,000 foods** in the database
- **International foods** supported
- **Branded products** available

### ✅ Flexible Input
- **Natural language** food descriptions
- **Various measurement units**
- **Quantity specifications**

### ✅ Reliable Fallback
- **Mock data** when API is unavailable
- **Error handling** for failed requests
- **Graceful degradation**

## 🚨 Important Notes

### API Limits
- **Free tier**: 10,000 requests per month
- **Rate limiting**: 10 requests per minute
- **Monitor usage** in Edamam dashboard

### Cost Considerations
- **Free tier** is sufficient for development
- **Paid plans** available for production use
- **Usage monitoring** recommended

### Security
- **Never commit** API keys to version control
- **Use environment variables** for credentials
- **Rotate keys** regularly

## 🆘 Troubleshooting

### Common Issues

1. **"API key not valid" error**
   - Check your Application ID and Key
   - Verify they're correctly set in `.env` file
   - Ensure no extra spaces or characters

2. **"No nutrition data found"**
   - Try different food descriptions
   - Use more specific food names
   - Check Edamam's food database

3. **"Rate limit exceeded"**
   - Wait before making more requests
   - Consider upgrading to paid plan
   - Implement request caching

4. **"Network error"**
   - Check internet connection
   - Verify Edamam API is accessible
   - Check firewall settings

### Testing Commands

```bash
# Test Edamam API directly
curl "https://api.edamam.com/api/nutrition-data?app_id=YOUR_APP_ID&app_key=YOUR_APP_KEY&ingr=1%20apple"

# Test your backend
curl http://localhost:5000/health

# Test meal logging
curl -X POST http://localhost:5000/api/log_meal \
  -H "Content-Type: application/json" \
  -d '{"food_items": "1 apple", "user_id": "test_user"}'
```

## 📈 Next Steps

1. **Test with various foods** to ensure accuracy
2. **Monitor API usage** in Edamam dashboard
3. **Implement caching** for frequently used foods
4. **Add food suggestions** based on user history
5. **Consider upgrading** to paid plan for production

## 🎉 Success!

Once you've completed this setup:

- ✅ **Accurate nutrition data** for all logged meals
- ✅ **Real-time nutrition calculations**
- ✅ **Comprehensive nutrient tracking**
- ✅ **Professional-grade nutrition analysis**

Your Nutrition Assistant now has access to one of the most comprehensive nutrition databases available! 