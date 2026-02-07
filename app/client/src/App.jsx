import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import DashboardLayout from './layouts/DashboardLayout';
import AnalyticsCharts from './components/AnalyticsCharts';

import Home from './pages/Home';
import Rankings from './pages/Rankings';
import NewDashboard from './pages/NewDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/new-dashboard" element={<NewDashboard />} />
        <Route path="/*" element={
          <DashboardLayout>
            <div className="bg-gray-900 min-h-screen text-white">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/competitions" element={<AnalyticsCharts />} />
                <Route path="*" element={<div className="p-10">Página en construcción</div>} />
              </Routes>
            </div>
          </DashboardLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
