import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import our newly isolated components!
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import SupervisorPanel from './components/SupervisorPanel';
import DriverPanel from './components/DriverPanel';

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('tms_role'));
  const [name, setName] = useState(localStorage.getItem('tms_name'));

  const handleLogin = (newRole, newName) => { 
    setRole(newRole); 
    setName(newName); 
  };
  
  const handleLogout = () => { 
    localStorage.clear(); 
    setRole(null); 
    setName(null); 
  };

  if (!role) return <LoginScreen onLogin={handleLogin} />;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        
        {/* Universal Navigation Bar */}
        <nav className="bg-sky-600 px-6 py-4 sticky top-0 z-40 shadow-xl flex justify-between items-center text-white">
          <h1 className="font-black text-2xl tracking-wide">TMS<span className="text-sky-200">.</span></h1>
          <div className="flex items-center gap-6">
            <div className="text-sm hidden sm:block">Logged in as <span className="font-bold text-sky-200">{name}</span></div>
            <button onClick={handleLogout} className="bg-sky-800 hover:bg-rose-600 px-4 py-2 rounded-lg font-bold transition-colors text-sm">Logout</button>
          </div>
        </nav>
        
        {/* Main Content Router */}
        <main className="pb-12 pt-6">
          <Routes>
            <Route path="/" element={
                role === 'admin' ? <AdminPanel /> : 
                role === 'supervisor' ? <SupervisorPanel /> : 
                <DriverPanel userName={name} />
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}