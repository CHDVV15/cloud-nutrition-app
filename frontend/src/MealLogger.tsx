import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from './contexts/AuthContext';
import { apiService } from './services/api';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

interface MealResponse {
  data: {
    total_nutrients: NutritionData;
  };
}

interface SummaryResponse {
  summary: NutritionData;
}

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function MealLogger(): JSX.Element {
  const { currentUser } = useAuth();
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [nutrients, setNutrients] = useState<NutritionData | null>(null);
  const [summary, setSummary] = useState<NutritionData | null>(null);

  const fetchSummary = async (): Promise<void> => {
    if (!currentUser) return;
    try {
      const res = await apiService.getNutritionSummary(currentUser.uid, TODAY);
      setSummary(res.data.summary);
    } catch (e) {
      setSummary(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!currentUser) return;
    
    setError('');
    setNutrients(null);
    setLoading(true);
    try {
      const res = await apiService.logMeal({
        food_items: input,
        date: TODAY,
      });
      setNutrients(res.data.data.total_nutrients);
      setInput('');
      fetchSummary();
    } catch (err) {
      setError('Failed to log meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [currentUser]);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white/80 rounded-2xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold gradient-text mb-4">Log Your Meal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder="e.g., 2 boiled eggs and 1 apple"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary w-full flex items-center justify-center"
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <span className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
          ) : null}
          Log Meal
        </button>
      </form>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {nutrients && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Nutrient Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(nutrients).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <span className={`font-bold capitalize text-sm`}>{key}:</span>
                <span className="text-blue-700 font-semibold">{Math.round(value * 100) / 100}</span>
                <span className="text-xs text-gray-500">{key === 'calories' ? 'kcal' : 'g'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {summary && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Today's Total</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <span className={`font-bold capitalize text-sm`}>{key}:</span>
                <span className="text-purple-700 font-semibold">{Math.round(value * 100) / 100}</span>
                <span className="text-xs text-gray-500">{key === 'calories' ? 'kcal' : 'g'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 