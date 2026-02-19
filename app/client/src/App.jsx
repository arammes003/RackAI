import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/Skeleton.css';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Athletes from './pages/Athletes';

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <div className="app-minimal">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/atletas" element={<Athletes />} />
          </Routes>
        </div>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
