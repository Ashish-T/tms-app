import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import API from './api';

// --- SHARED UI COMPONENTS ---
const blockInvalidChars = (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); };

const InputField = ({ label, name, type = "text", value, onChange, placeholder, uppercase }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} required placeholder={placeholder} min={type === "number" ? "0" : undefined} onKeyDown={type === "number" ? blockInvalidChars : undefined} className={`bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-indigo-500/20 block w-full p-3 outline-none ${uppercase ? 'uppercase' : ''}`} />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <select name={name} value={value} onChange={onChange} required className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-indigo-500/20 block w-full p-3 outline-none">
      <option value="">-- Select --</option>
      {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);
const getCurrentDate = () => new Date().toISOString().split('T')[0];

const StatusBadge = ({ status }) => {
  const colors = {
    'Initiated': 'bg-amber-100 text-amber-800',
    'Started': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-indigo-100 text-indigo-800',
    'Reviewed': 'bg-purple-100 text-purple-800',
    'Billed': 'bg-emerald-100 text-emerald-800'
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-slate-100 text-slate-800'}`}>{status}</span>;
};

// --- LOGIN SCREEN ---
function LoginScreen({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // FastAPI expects form-encoded data for OAuth2 login
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    try {
      const res = await API.post('/login', params);
      localStorage.setItem('tms_token', res.data.access_token);
      localStorage.setItem('tms_role', res.data.role);
      localStorage.setItem('tms_name', res.data.name);
      onLogin(res.data.role, res.data.name);
    } catch (err) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-black text-4xl text-slate-900 tracking-wide mb-2">TMS<span className="text-indigo-600">.</span></h1>
          <p className="text-slate-500">Sign in to your account</p>
        </div>
        {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-semibold mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField label="Username" name="username" value={credentials.username} onChange={e => setCredentials({...credentials, username: e.target.value})} />
          <InputField label="Password" type="password" name="password" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} />
          <button type="submit" className="w-full bg-indigo-600 text-white rounded-xl py-4 font-bold hover:bg-indigo-700 transition-all mt-4">Access System</button>
        </form>
      </div>
    </div>
  );
}

// --- DRIVER PANEL ---
function DriverPanel({ userName }) {
  const [trips, setTrips] = useState([]);
  const [formData, setFormData] = useState({ vehicle_number: '', reporting_time: '', out_km: '', out_time: '', date: '' });
  const [endData, setEndData] = useState({ in_km: '', in_time: '' });
  const [activeEndTrip, setActiveEndTrip] = useState(null);

  useEffect(() => { fetchTrips(); }, []);
  const fetchTrips = () => API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);

  const handleStartTrip = async (e) => {
    e.preventDefault();
    try {
      await API.post('/trips/', { ...formData, vehicle_number: formData.vehicle_number.toUpperCase() });
      setFormData({ vehicle_number: '', reporting_time: '', out_km: '', out_time: '', date: '' });
      fetchTrips();
    } catch (err) { alert("Failed to start trip."); }
  };

  const handleEndTrip = async (e, id) => {
    e.preventDefault();
    try {
      await API.patch(`/trips/${id}/end`, endData);
      setActiveEndTrip(null); setEndData({ in_km: '', in_time: '' });
      fetchTrips();
    } catch (err) { alert("Failed to end trip."); }
  };

  const handleStartChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'out_km' && value) {
        if (!prev.out_time) newData.out_time = getCurrentTime();
        if (!prev.date) newData.date = getCurrentDate();
      }
      return newData;
    });
  };

  const handleEndChange = (e) => {
    const { name, value } = e.target;
    setEndData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'in_km' && value && !prev.in_time) newData.in_time = getCurrentTime();
      return newData;
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Welcome, {userName} 🚛</h2>
      
      {/* Start New Trip */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <h3 className="text-xl font-bold border-b pb-3 mb-4">Start New Trip</h3>
        <form onSubmit={handleStartTrip} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <InputField label="Vehicle Number" name="vehicle_number" value={formData.vehicle_number} onChange={handleStartChange} uppercase />
          <InputField label="Reporting Time" type="time" name="reporting_time" value={formData.reporting_time} onChange={handleStartChange} />
          <InputField label="Out KM" type="number" name="out_km" value={formData.out_km} onChange={handleStartChange} />
          <InputField label="Date (Auto)" type="date" name="date" value={formData.date} onChange={handleStartChange} />
          <InputField label="Out Time (Auto)" type="time" name="out_time" value={formData.out_time} onChange={handleStartChange} />
          <button type="submit" className="bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Start Journey</button>
        </form>
      </div>

      {/* Active Trips needing End KM */}
      <h3 className="text-xl font-bold mb-4">Your Active Trips</h3>
      <div className="grid gap-4">
        {trips.filter(t => t.status === 'Started').map(trip => (
          <div key={trip.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div><span className="font-bold text-lg">{trip.vehicle_number}</span><span className="text-slate-500 ml-2">({trip.date})</span></div>
              <StatusBadge status={trip.status} />
            </div>
            
            {activeEndTrip === trip.id ? (
              <form onSubmit={(e) => handleEndTrip(e, trip.id)} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl">
                <div className="flex-1"><InputField label="In KM" type="number" name="in_km" value={endData.in_km} onChange={handleEndChange} /></div>
                <div className="flex-1"><InputField label="In Time (Auto)" type="time" name="in_time" value={endData.in_time} onChange={handleEndChange} /></div>
                <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Complete</button>
                <button type="button" onClick={() => setActiveEndTrip(null)} className="text-slate-500 px-4">Cancel</button>
              </form>
            ) : (
              <button onClick={() => setActiveEndTrip(trip.id)} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold">Log Arrival (In KM)</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SUPERVISOR PANEL ---
function SupervisorPanel() {
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState([]);
  const [reviewTrip, setReviewTrip] = useState(null);
  const [reviewData, setReviewData] = useState({ vehicle_type: '', vehicle_mode: '', body_type: '', vendor_name: '', helper_name: '' });
  const [driverForm, setDriverForm] = useState({ username: '', password: '', name: '', phone: '' });

  const vehicleTypes = ["Tata Ace", "Intra", "Bolero Pickup", "Verro", "Bara Dast", "10' FT", "14' FT", "17' FT", "20' FT", "22' FT", "32' FT SXL", "32' FT MXL"];
  
  useEffect(() => { fetchTrips(); }, []);
  const fetchTrips = () => API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/trips/${reviewTrip.id}/review`, reviewData);
      setReviewTrip(null); fetchTrips();
    } catch (err) { alert("Error saving review."); }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users/driver', { ...driverForm, role: 'driver' });
      alert("Driver Account Created!");
      setDriverForm({ username: '', password: '', name: '', phone: '' });
    } catch (err) { alert("Failed to create driver. Username might exist."); }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Supervisor Dispatch Center</h2>
      <div className="flex space-x-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl inline-flex">
        <button onClick={() => setActiveTab('trips')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'trips' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Review Trips</button>
        <button onClick={() => setActiveTab('drivers')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'drivers' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Add New Driver</button>
      </div>

      {activeTab === 'trips' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-4">ID / Date</th><th className="p-4">Vehicle</th><th className="p-4">Route KM</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id} className="border-b">
                  <td className="p-4 font-bold">#{trip.id} <span className="text-slate-400 block font-normal">{trip.date}</span></td>
                  <td className="p-4">{trip.vehicle_number}</td>
                  <td className="p-4">{trip.in_km ? trip.in_km - trip.out_km + ' km' : 'In Transit'}</td>
                  <td className="p-4"><StatusBadge status={trip.status} /></td>
                  <td className="p-4">
                    {(trip.status === 'Started' || trip.status === 'Completed') && (
                       <button onClick={() => { setReviewTrip(trip); setReviewData({ vehicle_type: '', vehicle_mode: '', body_type: '', vendor_name: '', helper_name: '' }); }} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-200">Review & Assign</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Create Driver Account</h3>
          <form onSubmit={handleCreateDriver} className="space-y-4">
            <InputField label="Full Name" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} />
            <InputField label="Phone Number" type="number" value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} />
            <InputField label="Login Username" value={driverForm.username} onChange={e => setDriverForm({...driverForm, username: e.target.value})} />
            <InputField label="Login Password" type="password" value={driverForm.password} onChange={e => setDriverForm({...driverForm, password: e.target.value})} />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Create Account</button>
          </form>
        </div>
      )}

      {reviewTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg">
            <h3 className="text-2xl font-bold mb-6">Review Trip #{reviewTrip.id}</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <SelectField label="Vehicle Type" value={reviewData.vehicle_type} onChange={e => setReviewData({...reviewData, vehicle_type: e.target.value})} options={vehicleTypes} />
              <SelectField label="Vehicle Mode" value={reviewData.vehicle_mode} onChange={e => setReviewData({...reviewData, vehicle_mode: e.target.value})} options={['Adhoc', 'Dedicated']} />
              <SelectField label="Body Type" value={reviewData.body_type} onChange={e => setReviewData({...reviewData, body_type: e.target.value})} options={['Open', 'Closed']} />
              <InputField label="Vendor Name" value={reviewData.vendor_name} onChange={e => setReviewData({...reviewData, vendor_name: e.target.value})} />
              <InputField label="Helper Name" value={reviewData.helper_name} onChange={e => setReviewData({...reviewData, helper_name: e.target.value})} />
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setReviewTrip(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ADMIN PANEL ---
function AdminPanel() {
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState([]);
  const [billingTrip, setBillingTrip] = useState(null);
  const [billData, setBillData] = useState({ toll_money: '', fuel_litres: '', fuel_price: '', police_fines: '', overtime_money: '', driver_cost: '', vehicle_charged: '', billing_amount: '' });
  const [supForm, setSupForm] = useState({ username: '', password: '', name: '', phone: '' });

  useEffect(() => { fetchTrips(); }, []);
  const fetchTrips = () => API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);

  const handleBillSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {};
      Object.keys(billData).forEach(k => payload[k] = Number(billData[k]) || 0);
      await API.patch(`/trips/${billingTrip.id}/finalize`, payload);
      setBillingTrip(null); fetchTrips();
    } catch (err) { alert("Failed to finalize billing."); }
  };

  const handleCreateSupervisor = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users/supervisor', { ...supForm, role: 'supervisor' });
      alert("Supervisor Account Created!");
      setSupForm({ username: '', password: '', name: '', phone: '' });
    } catch (err) { alert("Failed to create supervisor."); }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Master Admin Dashboard</h2>
      <div className="flex space-x-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl inline-flex">
        <button onClick={() => setActiveTab('trips')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'trips' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Financial Billing</button>
        <button onClick={() => setActiveTab('supervisors')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'supervisors' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Add Supervisor</button>
      </div>

      {activeTab === 'trips' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-4">ID</th><th className="p-4">Vehicle & Vendor</th><th className="p-4">Status</th><th className="p-4">Profit</th><th className="p-4">Action</th></tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id} className="border-b">
                  <td className="p-4 font-bold">#{trip.id}</td>
                  <td className="p-4">{trip.vehicle_number} <span className="block text-slate-500 text-xs">{trip.vendor_name || 'Unassigned'}</span></td>
                  <td className="p-4"><StatusBadge status={trip.status} /></td>
                  <td className="p-4 font-bold text-emerald-600">₹{trip.profit}</td>
                  <td className="p-4">
                    {trip.status === 'Reviewed' && (
                       <button onClick={() => { setBillingTrip(trip); setBillData({ toll_money: '', fuel_litres: '', fuel_price: '', police_fines: '', overtime_money: '', driver_cost: '', vehicle_charged: '', billing_amount: '' }); }} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold hover:bg-emerald-200">Finalize Finances</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'supervisors' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Create Supervisor Account</h3>
          <form onSubmit={handleCreateSupervisor} className="space-y-4">
            <InputField label="Full Name" value={supForm.name} onChange={e => setSupForm({...supForm, name: e.target.value})} />
            <InputField label="Phone Number" type="number" value={supForm.phone} onChange={e => setSupForm({...supForm, phone: e.target.value})} />
            <InputField label="Login Username" value={supForm.username} onChange={e => setSupForm({...supForm, username: e.target.value})} />
            <InputField label="Login Password" type="password" value={supForm.password} onChange={e => setSupForm({...supForm, password: e.target.value})} />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Create Account</button>
          </form>
        </div>
      )}

      {billingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Finalize Billing (Trip #{billingTrip.id})</h3>
            <form onSubmit={handleBillSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 border-b pb-2 mb-2 font-bold text-slate-500">Expenses (₹)</div>
              <InputField label="Toll Money" type="number" value={billData.toll_money} onChange={e => setBillData({...billData, toll_money: e.target.value})} />
              <InputField label="Police Fines" type="number" value={billData.police_fines} onChange={e => setBillData({...billData, police_fines: e.target.value})} />
              <InputField label="Fuel Litres" type="number" value={billData.fuel_litres} onChange={e => setBillData({...billData, fuel_litres: e.target.value})} />
              <InputField label="Fuel Price / L" type="number" value={billData.fuel_price} onChange={e => setBillData({...billData, fuel_price: e.target.value})} />
              <InputField label="Overtime Money" type="number" value={billData.overtime_money} onChange={e => setBillData({...billData, overtime_money: e.target.value})} />
              <InputField label="Driver Base Cost" type="number" value={billData.driver_cost} onChange={e => setBillData({...billData, driver_cost: e.target.value})} />
              
              <div className="col-span-2 border-b pb-2 mb-2 mt-4 font-bold text-slate-500">Client Billing (₹)</div>
              <InputField label="Vehicle Charged" type="number" value={billData.vehicle_charged} onChange={e => setBillData({...billData, vehicle_charged: e.target.value})} />
              <InputField label="Final Billing Amount" type="number" value={billData.billing_amount} onChange={e => setBillData({...billData, billing_amount: e.target.value})} />
              
              <div className="col-span-2 flex gap-4 mt-6">
                <button type="button" onClick={() => setBillingTrip(null)} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold">Calculate & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [role, setRole] = useState(localStorage.getItem('tms_role'));
  const [name, setName] = useState(localStorage.getItem('tms_name'));

  const handleLogin = (newRole, newName) => { setRole(newRole); setName(newName); };
  
  const handleLogout = () => {
    localStorage.clear();
    setRole(null); setName(null);
  };

  if (!role) return <LoginScreen onLogin={handleLogin} />;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <nav className="bg-slate-900 px-6 py-4 sticky top-0 z-40 shadow-xl flex justify-between items-center text-white">
          <h1 className="font-black text-2xl tracking-wide">TMS<span className="text-indigo-500">.</span></h1>
          <div className="flex items-center gap-6">
            <div className="text-sm">Logged in as <span className="font-bold text-indigo-400">{name}</span> ({role.toUpperCase()})</div>
            <button onClick={handleLogout} className="bg-slate-800 hover:bg-rose-600 px-4 py-2 rounded-lg font-bold transition-colors text-sm">Logout</button>
          </div>
        </nav>
        
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