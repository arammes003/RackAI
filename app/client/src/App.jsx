import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
    <DashboardLayout>
      <div className="app-minimal">
        {/* Content goes here */}
      </div>
    </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
