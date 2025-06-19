import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Apple, 
  Utensils, 
  TrendingUp, 
  Target, 
  Plus,
  Calendar,
  Clock,
  Zap,
  Heart,
  Activity,
  LogOut,
  User
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useAuth } from './contexts/AuthContext'
import { apiService } from './services/api'
import Login from './components/Login'

interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
}

interface FoodItem {
  item: string
  nutrients: NutritionData
}

interface Meal {
  _id: string
  user_id: string
  date: string
  food_items: string
  total_nutrients: NutritionData
  foods: FoodItem[]
  created_at: string
}

function App() {
  const { currentUser, logout } = useAuth()
  const [foodItems, setFoodItems] = useState('')
  const [meals, setMeals] = useState<Meal[]>([])
  const [dailySummary, setDailySummary] = useState<NutritionData>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'log' | 'dashboard'>('log')

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (currentUser) {
      fetchMeals()
      fetchDailySummary()
    }
  }, [currentUser])

  const fetchMeals = async () => {
    if (!currentUser) return
    try {
      const response = await apiService.getUserMeals(currentUser.uid, today)
      setMeals(response.data.meals || [])
    } catch (error) {
      console.error('Error fetching meals:', error)
    }
  }

  const fetchDailySummary = async () => {
    if (!currentUser) return
    try {
      const response = await apiService.getDailySummary(currentUser.uid, today)
      const summaryData = response.data.summary || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0
      }
      setDailySummary(summaryData)
    } catch (error) {
      console.error('Error fetching summary:', error)
      // Set default values on error
      setDailySummary({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0
      })
    }
  }

  const logMeal = async () => {
    if (!foodItems.trim()) {
      toast.error('Please enter what you ate!')
      return
    }

    setLoading(true)
    try {
      await apiService.logMeal({
        food_items: foodItems,
        date: today
      })

      toast.success('Meal logged successfully! 🎉')
      setFoodItems('')
      fetchMeals()
      fetchDailySummary()
    } catch (error) {
      console.error('Error logging meal:', error)
      toast.error('Failed to log meal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getNutritionColor = (nutrient: keyof NutritionData) => {
    const colors = {
      calories: 'bg-nutrition-calories',
      protein: 'bg-nutrition-protein',
      carbs: 'bg-nutrition-carbs',
      fat: 'bg-nutrition-fat',
      fiber: 'bg-nutrition-fiber',
      sugar: 'bg-nutrition-sugar'
    }
    return colors[nutrient]
  }

  const getNutritionIcon = (nutrient: keyof NutritionData) => {
    const icons = {
      calories: <Zap className="w-4 h-4" />,
      protein: <Target className="w-4 h-4" />,
      carbs: <Apple className="w-4 h-4" />,
      fat: <Heart className="w-4 h-4" />,
      fiber: <Activity className="w-4 h-4" />,
      sugar: <Utensils className="w-4 h-4" />
    }
    return icons[nutrient]
  }

  const getDailyGoal = (nutrient: keyof NutritionData) => {
    const goals = {
      calories: 2000,
      protein: 100,
      carbs: 250,
      fat: 70,
      fiber: 30,
      sugar: 50
    }
    return goals[nutrient]
  }

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100)
  }

  // Show login screen if not authenticated
  if (!currentUser) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-effect border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Nutrition Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{currentUser.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white/50 backdrop-blur-sm rounded-2xl p-1 mb-8">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'log'
                ? 'bg-white shadow-sm text-gray-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Log Meal</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'dashboard'
                ? 'bg-white shadow-sm text-gray-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Dashboard</span>
            </div>
          </button>
        </div>

        {/* Main Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'log' ? (
            /* Meal Logger */
            <div className="space-y-8">
              {/* Quick Log */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="nutrition-card"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Quick Log</h2>
                    <p className="text-gray-600">Log what you ate today</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <textarea
                    value={foodItems}
                    onChange={(e) => setFoodItems(e.target.value)}
                    placeholder="e.g., 2 boiled eggs, 1 apple, 1 cup oatmeal..."
                    className="input-field resize-none"
                    rows={4}
                    disabled={loading}
                  />
                  <button
                    onClick={logMeal}
                    disabled={loading || !foodItems.trim()}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <Plus className="w-5 h-5 mr-2" />
                    )}
                    Log Meal
                  </button>
                </div>
              </motion.div>

              {/* Recent Meals */}
              {meals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="nutrition-card"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Today's Meals</h2>
                      <p className="text-gray-600">Your logged meals for today</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {meals.map((meal, index) => (
                      <div key={meal._id} className="bg-white/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-800">{meal.food_items}</h3>
                          <span className="text-sm text-gray-500">
                            {format(new Date(meal.created_at), 'HH:mm')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <span className="font-semibold text-blue-600">
                              {Math.round(meal.total_nutrients.calories)}
                            </span>
                            <div className="text-gray-500">kcal</div>
                          </div>
                          <div className="text-center">
                            <span className="font-semibold text-green-600">
                              {Math.round(meal.total_nutrients.protein)}g
                            </span>
                            <div className="text-gray-500">protein</div>
                          </div>
                          <div className="text-center">
                            <span className="font-semibold text-orange-600">
                              {Math.round(meal.total_nutrients.carbs)}g
                            </span>
                            <div className="text-gray-500">carbs</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            /* Dashboard */
            <div className="space-y-8">
              {/* Daily Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(dailySummary).map(([nutrient, value]) => (
                  <motion.div
                    key={nutrient}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="nutrition-card"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${getNutritionColor(nutrient as keyof NutritionData)} rounded-xl flex items-center justify-center`}>
                          {getNutritionIcon(nutrient as keyof NutritionData)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 capitalize">{nutrient}</h3>
                          <p className="text-sm text-gray-500">
                            {nutrient === 'calories' ? 'kcal' : 'g'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          {Math.round(value)}
                        </div>
                        <div className="text-sm text-gray-500">
                          / {getDailyGoal(nutrient as keyof NutritionData)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`nutrition-progress-bar ${getNutritionColor(nutrient as keyof NutritionData)}`}
                        style={{
                          width: `${getProgressPercentage(value, getDailyGoal(nutrient as keyof NutritionData))}%`
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default App 