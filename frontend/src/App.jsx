import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import SupervisorPanel from './components/SupervisorPanel';
import DriverPanel from './components/DriverPanel';
import API from './api';
import { InputField } from './components/SharedUI';

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('tms_role'));
  const [name, setName] = useState(localStorage.getItem('tms_name'));
  const [showSettings, setShowSettings] = useState(false);
  const [passData, setPassData] = useState({ current_password: '', new_password: '' });

  const handleLogin = (newRole, newName) => { 
    setRole(newRole); 
    setName(newName); 
  };
  
  const handleLogout = () => { 
    localStorage.clear(); 
    setRole(null); 
    setName(null); 
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
        await API.patch('/users/me/password', passData);
        alert("Password securely updated!");
        setShowSettings(false);
        setPassData({ current_password: '', new_password: '' });
    } catch (err) {
        alert("Error: Incorrect current password.");
    }
  }

  if (!role) return <LoginScreen onLogin={handleLogin} />;

  return (
    <Router>
      <div className="min-h-screen bg-gray-300 font-sans text-gray-900">
        
        <nav className="bg-sky-600 px-6 py-4 sticky top-0 z-40 shadow-xl flex justify-between items-center text-gray-200">
          <h1 className="font-black text-2xl tracking-wide">TMS<span className="text-orange-400">.</span></h1>
          <div className="flex items-center gap-4">
            <div className="text-sm hidden sm:block">Logged in as <span className="font-bold text-gray-100">{name}</span></div>
            <button onClick={() => setShowSettings(true)} className="bg-sky-700 hover:bg-sky-800 px-4 py-2 rounded-lg font-bold transition-colors text-sm shadow-inner">Settings</button>
            <button onClick={handleLogout} className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg font-bold transition-colors text-sm text-white shadow-md">Logout</button>
          </div>
        </nav>
        
        {showSettings && (
            <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-200 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900">Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <InputField label="Current Password" type="password" value={passData.current_password} onChange={e=>setPassData({...passData, current_password: e.target.value})} />
                        <InputField label="New Password" type="password" value={passData.new_password} onChange={e=>setPassData({...passData, new_password: e.target.value})} />
                        <div className="flex gap-4 mt-6">
                            <button type="button" onClick={() => setShowSettings(false)} className="flex-1 bg-gray-400 py-3 rounded-xl font-bold text-gray-800 hover:bg-gray-500">Cancel</button>
                            <button type="submit" className="flex-1 bg-emerald-600 text-gray-200 py-3 rounded-xl font-bold hover:bg-emerald-700">Update Securely</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

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