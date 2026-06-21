'use client';

import { useState, useEffect, useRef } from 'react';
import { AppState, Meal, FitnessGoal } from '@/types';

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [foodName, setFoodName] = useState('');
  const [weight, setWeight] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Keep a reference to the previous state to check if we just transitioned to "exceeded"
  const prevStateRef = useRef<AppState | null>(null);

  // Fetch state on mount
  useEffect(() => {
    fetchState();
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data: AppState = await res.json();
        setState(data);
        prevStateRef.current = data;
      }
    } catch (err) {
      console.error('Error fetching state:', err);
    }
  };

  const handleGoalChange = async (goal: FitnessGoal) => {
    if (!state) return;
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      if (res.ok) {
        const data: AppState = await res.json();
        
        // If changing goals causes the calorie limit to exceed, show the warning modal
        if (data.exceeded && (!state.exceeded)) {
          setShowModal(true);
        }
        
        setState(data);
        prevStateRef.current = data;
      }
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      setFormError('Please enter a food name');
      return;
    }
    const portionWeight = parseFloat(weight);
    if (isNaN(portionWeight) || portionWeight <= 0) {
      setFormError('Please enter a valid weight in grams');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: foodName, weight: portionWeight }),
      });

      if (res.ok) {
        const data: AppState = await res.json();
        
        // Show modal if we crossed the calorie budget
        const previouslyExceeded = prevStateRef.current?.exceeded ?? false;
        if (data.exceeded && !previouslyExceeded) {
          setShowModal(true);
        }

        setState(data);
        prevStateRef.current = data;
        setFoodName('');
        setWeight('');
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Failed to log meal');
      }
    } catch (err) {
      setFormError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      const res = await fetch(`/api/meals?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data: AppState = await res.json();
        setState(data);
        prevStateRef.current = data;
      }
    } catch (err) {
      console.error('Error deleting meal:', err);
    }
  };

  const handleAIScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setFormError('');

    // Simulate AI scanning delay of 1.2 seconds for realistic experience
    setTimeout(async () => {
      try {
        const res = await fetch('/api/mock-scan');
        if (res.ok) {
          const mockFood = await res.json();
          setFoodName(mockFood.name);
          setWeight(mockFood.weight.toString());
        }
      } catch (err) {
        console.error('Error scanning food:', err);
      } finally {
        setIsScanning(false);
      }
    }, 1200);
  };

  if (!state) {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#060913', color: '#f8fafc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontFamily: 'sans-serif', fontSize: '0.9rem', color: '#94a3b8' }}>Loading Dashboard State...</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const { totals, targets, meals, currentGoal, exceeded } = state;
  const caloriePercent = Math.min(100, Math.round((totals.calories / targets.calories) * 100));
  const proteinPercent = Math.min(100, Math.round((totals.protein / targets.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((totals.carbs / targets.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((totals.fat / targets.fat) * 100));
  const goalIndex = { 'weight-loss': 0, 'maintenance': 1, 'muscle-gain': 2 }[currentGoal];

  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="logo-text">
            <h1>CaloMacro</h1>
            <p>Real-Time Nutritional Intelligence</p>
          </div>
        </div>

        {/* Dynamic Goal Toggle */}
        <div className="goal-selector">
          <div 
            className="goal-slider-bg"
            style={{
              width: '110px',
              transform: `translateX(${goalIndex * 114}px)`
            }}
          />
          <button 
            className={`goal-option ${currentGoal === 'weight-loss' ? 'active' : ''}`}
            style={{ width: '110px', textAlign: 'center' }}
            onClick={() => handleGoalChange('weight-loss')}
          >
            Weight Loss
          </button>
          <button 
            className={`goal-option ${currentGoal === 'maintenance' ? 'active' : ''}`}
            style={{ width: '110px', textAlign: 'center' }}
            onClick={() => handleGoalChange('maintenance')}
          >
            Maintenance
          </button>
          <button 
            className={`goal-option ${currentGoal === 'muscle-gain' ? 'active' : ''}`}
            style={{ width: '110px', textAlign: 'center' }}
            onClick={() => handleGoalChange('muscle-gain')}
          >
            Muscle Gain
          </button>
        </div>
      </header>

      {/* DASHBOARD ELEMENTS */}
      <main className="dashboard-grid">
        
        {/* TOP VISUAL DASHBOARD (BUDGET BARS) */}
        <section className="top-dashboard glass-panel calorie-target-card" style={{ borderColor: exceeded ? 'rgba(244, 63, 94, 0.25)' : '' }}>
          <div className="calorie-card-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: exceeded ? '#f43f5e' : '#06b6d4' }}>
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
              Daily Budget Monitor
            </h2>
            <span className="goal-badge" style={{ 
              backgroundColor: exceeded ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              color: exceeded ? '#f43f5e' : '#a5b4fc',
              borderColor: exceeded ? 'rgba(244, 63, 94, 0.3)' : 'rgba(99, 102, 241, 0.3)'
            }}>
              {currentGoal.replace('-', ' ')}
            </span>
          </div>

          {/* Master Calorie Budget Bar */}
          <div className="master-progress-container">
            <div className="calorie-numbers">
              <div>
                <span className="calorie-value" style={{ color: exceeded ? '#f43f5e' : '' }}>{totals.calories}</span>
                <span className="calorie-target"> / {targets.calories} kcal</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: exceeded ? '#f43f5e' : '#10b981' }}>
                {caloriePercent}%
              </span>
            </div>
            
            <div className="progress-track" style={{ borderColor: exceeded ? 'rgba(244, 63, 94, 0.2)' : '' }}>
              <div 
                className={`progress-fill ${exceeded ? 'danger pulse' : 'safe'}`}
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
          </div>

          {/* Macronutrient Breakdowns */}
          <div className="macro-grid">
            
            {/* Protein */}
            <div className="macro-card">
              <div className="macro-header protein">
                <span>Protein</span>
                <span>{proteinPercent}%</span>
              </div>
              <div className="macro-progress-track">
                <div className="macro-progress-fill protein" style={{ width: `${proteinPercent}%` }} />
              </div>
              <div className="macro-amounts">
                <span>{totals.protein}g</span>
                <span>Target: {targets.protein}g</span>
              </div>
            </div>

            {/* Carbs */}
            <div className="macro-card">
              <div className="macro-header carbs">
                <span>Carbs</span>
                <span>{carbsPercent}%</span>
              </div>
              <div className="macro-progress-track">
                <div className="macro-progress-fill carbs" style={{ width: `${carbsPercent}%` }} />
              </div>
              <div className="macro-amounts">
                <span>{totals.carbs}g</span>
                <span>Target: {targets.carbs}g</span>
              </div>
            </div>

            {/* Fats */}
            <div className="macro-card">
              <div className="macro-header fat">
                <span>Fats</span>
                <span>{fatPercent}%</span>
              </div>
              <div className="macro-progress-track">
                <div className="macro-progress-fill fat" style={{ width: `${fatPercent}%` }} />
              </div>
              <div className="macro-amounts">
                <span>{totals.fat}g</span>
                <span>Target: {targets.fat}g</span>
              </div>
            </div>

          </div>
        </section>

        {/* LEFT COLUMN: FOOD LOGGING */}
        <section className="glass-panel logging-panel">
          <h2 className="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6366f1' }}>
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8A7 7 0 0 1 11 20z" />
              <path d="M9 22a1 1 0 1 0 2 0 1 1 0 1 0-2 0" />
            </svg>
            Log Meal
          </h2>

          <form onSubmit={handleAddMeal} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Food Item Input */}
            <div className="form-group">
              <label htmlFor="food-name">Food Item Name</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </span>
                <input 
                  id="food-name"
                  type="text" 
                  className="text-input" 
                  placeholder="e.g. Chicken Breast, Egg, Oatmeal" 
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  disabled={isSubmitting || isScanning}
                />
              </div>
            </div>

            {/* Weight Input */}
            <div className="form-group">
              <label htmlFor="portion-weight">Portion Weight (Grams)</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="12" x="2" y="6" rx="2" />
                    <path d="M12 12h.01M16 12h.01M8 12h.01" />
                  </svg>
                </span>
                <input 
                  id="portion-weight"
                  type="number" 
                  className="number-input" 
                  placeholder="e.g. 150" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="1"
                  disabled={isSubmitting || isScanning}
                />
              </div>
            </div>

            {formError && <p style={{ fontSize: '0.8rem', color: '#f43f5e', fontWeight: 600 }}>{formError}</p>}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-submit"
              disabled={isSubmitting || isScanning}
            >
              {isSubmitting ? 'Logging Item...' : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5v14" />
                  </svg>
                  Add to Food Log
                </>
              )}
            </button>

            {/* AI SCANNER BUTTON PLACEHOLDER */}
            <div 
              className={`ai-scanner-placeholder ${isScanning ? 'scanning' : ''}`}
              onClick={handleAIScan}
            >
              <div className="scan-line" />
              <div className="scanner-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <div className="scanner-text">
                <h4>{isScanning ? 'Scanning Plate...' : 'AI Photo Scanner'}</h4>
                <p>{isScanning ? 'Analyzing calories and portion weight...' : 'Simulate snap upload of food photo'}</p>
              </div>
            </div>

          </form>
        </section>

        {/* RIGHT COLUMN: DAILY HISTORY */}
        <section className="glass-panel history-panel">
          <div className="history-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Daily Food Log
            </h2>
            <span className="meals-count-badge">{meals.length} {meals.length === 1 ? 'item' : 'items'}</span>
          </div>

          <div className="meals-list">
            {meals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🍽️</div>
                <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>No food items logged for today.<br />Start typing above or try the AI Photo Scanner!</p>
              </div>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="meal-card-item">
                  <div className="meal-info">
                    <div className="meal-name-row">
                      <span className="meal-name">{meal.name}</span>
                      <span className="meal-portion">{meal.weight}g</span>
                    </div>
                    <div className="meal-macros-row">
                      <div className="meal-macro-tag cals">
                        <span>{meal.calories}</span> kcal
                      </div>
                      <div className="meal-macro-tag prot">
                        <span>{meal.protein}g</span> P
                      </div>
                      <div className="meal-macro-tag carb">
                        <span>{meal.carbs}g</span> C
                      </div>
                      <div className="meal-macro-tag fat">
                        <span>{meal.fat}g</span> F
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <div className="delete-btn-wrapper">
                    <button 
                      className="btn-delete-meal"
                      onClick={() => handleDeleteMeal(meal.id)}
                      title="Delete logged item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* WARNING POPUP MODAL */}
      <div className={`modal-overlay ${showModal ? 'open' : ''}`} onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-alert-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 className="modal-title">Daily Budget Exceeded!</h3>
          <p className="modal-description">
            Your current calorie intake has exceeded the limits of your <strong>{currentGoal.replace('-', ' ')}</strong> budget! Consider swapping subsequent meals with higher protein or lighter alternatives.
          </p>
          <button className="btn-modal-close" onClick={() => setShowModal(false)}>
            Acknowledge & Adjust
          </button>
        </div>
      </div>

      <footer className="app-footer">
        <p>CaloMacro Prototype Dashboard &copy; 2026. Made with ❤️ for fitness champions.</p>
      </footer>
    </div>
  );
}
