import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <div className="app-minimal">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
