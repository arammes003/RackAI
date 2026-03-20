import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Rankings from './pages/Rankings/Rankings';
import Athletes from './pages/Athletes/Athletes';
import Competitions from './pages/Competitions/Competitions';
import Retention from './pages/Retention/Retention';
import Market from './pages/Market/Market';
import Platform from './pages/Platform/Platform';

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/atletas" element={<Athletes />} />
          <Route path="/competiciones" element={<Competitions />} />
          <Route path="/retencion" element={<Retention />} />
          <Route path="/mercado" element={<Market />} />
          <Route path="/plataforma" element={<Platform />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
