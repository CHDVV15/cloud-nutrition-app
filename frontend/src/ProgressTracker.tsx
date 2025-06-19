import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, subDays } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface NutritionDay {
  date: string;
  summary: NutritionData;
}

interface SummaryResponse {
  summary: NutritionData;
}

const API_BASE_URL = 'http://localhost:5000/api';
const USER_ID = 'user123';

export default function ProgressTracker(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [nutritionData, setNutritionData] = useState<NutritionDay[]>([]);

  useEffect(() => {
    fetchLast7DaysData();
  }, []);

  const fetchLast7DaysData = async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      const promises: Promise<any>[] = [];
      const dates: string[] = [];
      
      // Generate last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dates.push(date);
        promises.push(
          axios.get<SummaryResponse>(`${API_BASE_URL}/nutrition_summary`, {
            params: { user_id: USER_ID, date }
          })
        );
      }

      const responses = await Promise.all(promises);
      const data: NutritionDay[] = responses.map((res, index) => ({
        date: dates[index],
        summary: res.data.summary || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0
        }
      }));

      setNutritionData(data);
    } catch (err) {
      setError('Failed to fetch nutrition data');
      console.error('Error fetching nutrition data:', err);
    } finally {
      setLoading(false);
    }
  };

  const caloriesChartData = {
    labels: nutritionData.map(d => format(new Date(d.date), 'MMM dd')),
    datasets: [
      {
        label: 'Calories',
        data: nutritionData.map(d => d.summary.calories),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const macronutrientsChartData = {
    labels: nutritionData.map(d => format(new Date(d.date), 'MMM dd')),
    datasets: [
      {
        label: 'Protein (g)',
        data: nutritionData.map(d => d.summary.protein),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
      {
        label: 'Carbs (g)',
        data: nutritionData.map(d => d.summary.carbs),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      },
      {
        label: 'Fat (g)',
        data: nutritionData.map(d => d.summary.fat),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 600
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  const lineChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Daily Calorie Intake (Last 7 Days)',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: '#374151'
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Macronutrient Intake (Last 7 Days)',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: '#374151'
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchLast7DaysData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text mb-2">Nutrition Progress</h2>
        <p className="text-gray-600">Track your nutrition intake over the last 7 days</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="nutrition-card">
          <Line data={caloriesChartData} options={lineChartOptions} />
        </div>
        
        <div className="nutrition-card">
          <Bar data={macronutrientsChartData} options={barChartOptions} />
        </div>
      </div>

      <div className="nutrition-card">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Weekly Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.keys(nutritionData[0]?.summary || {}).map((nutrient) => {
            const total = nutritionData.reduce((sum, day) => sum + day.summary[nutrient as keyof NutritionData], 0);
            const average = total / nutritionData.length;
            
            return (
              <div key={nutrient} className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(average)}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {nutrient === 'calories' ? 'kcal/day' : `${nutrient}/day`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 