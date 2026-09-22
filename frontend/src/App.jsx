import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Onboarding from './pages/Onboarding';
import PlanView from './pages/PlanView';
import DailyStudy from './pages/DailyStudy';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import AITutor from './pages/AITutor';
import useStore from './store/useStore';

export default function App() {
  const location = useLocation();
  const { activePlanId, setActivePlanId } = useStore();

  const isLanding = location.pathname === '/';

  useEffect(() => {
    const saved = localStorage.getItem('activePlanId');
    if (saved && !activePlanId) {
      setActivePlanId(saved);
    }
  }, [activePlanId, setActivePlanId]);

  return (
    <div className="min-h-screen bg-den-bg text-den-text font-grotesk grain selection:bg-den-yellow selection:text-black">
      {/* Navbar rendered on all app pages except landing */}
      {!isLanding && <Navbar />}

      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route
            path="/plan"
            element={activePlanId ? <PlanView /> : <Navigate to="/" replace />}
          />
          <Route
            path="/today"
            element={activePlanId ? <DailyStudy /> : <Navigate to="/" replace />}
          />
          <Route
            path="/dashboard"
            element={activePlanId ? <Dashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/insights"
            element={activePlanId ? <Insights /> : <Navigate to="/" replace />}
          />
          <Route
            path="/tutor"
            element={activePlanId ? <AITutor /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
