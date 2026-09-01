import React, { useState } from 'react';
import API from '../api';
import { InputField } from './SharedUI';

export default function LoginScreen({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const params = new URLSearchParams();
    params.append('username', credentials.username); params.append('password', credentials.password);
    try {
      const res = await API.post('/login', params);
      localStorage.setItem('tms_token', res.data.access_token); 
      localStorage.setItem('tms_role', res.data.role); 
      localStorage.setItem('tms_name', res.data.name);
      onLogin(res.data.role, res.data.name);
    } catch (err) { setError('Invalid username or password.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-400 p-4">
      <div className="bg-gray-200 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-400">
        <div className="text-center mb-8">
          <div className="bg-sky-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-sky-600/30">
            <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="font-black text-4xl text-gray-900 tracking-wide mb-2">TMS<span className="text-orange-500">.</span></h1>
          <p className="text-gray-600 font-medium">Enterprise Management System</p>
        </div>
        {error && <div className="bg-orange-200 text-orange-800 p-3 rounded-lg text-sm font-semibold mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField label="Username" name="username" value={credentials.username} onChange={e => setCredentials({...credentials, username: e.target.value})} />
          <InputField label="Password" type="password" name="password" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} />
          <button type="submit" className="w-full bg-sky-600 text-gray-200 rounded-xl py-4 font-bold hover:bg-sky-700 transition-all mt-6 shadow-lg shadow-sky-600/30">Login</button>
        </form>
      </div>
    </div>
  );
}