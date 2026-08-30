import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import API from './api';

const blockInvalidChars = (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); };

const InputField = ({ label, name, type = "text", value, onChange, placeholder, uppercase, pattern, title, disabled }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} required placeholder={placeholder} pattern={pattern} title={title} disabled={disabled} min={type === "number" ? "0" : undefined} onKeyDown={type === "number" ? blockInvalidChars : undefined} className={`bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-sky-500/20 block w-full p-3 outline-none ${uppercase ? 'uppercase' : ''} ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`} />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, optionObjects, disabled }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <select name={name} value={value} onChange={onChange} required disabled={disabled} className={`bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-sky-500/20 block w-full p-3 outline-none ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}>
      <option value="">-- Select --</option>
      {options && options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      {optionObjects && optionObjects.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
    </select>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span><span className="block text-sm font-semibold text-slate-900 mt-1">{value || '-'}</span></div>
);

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);
const getCurrentDate = () => new Date().toISOString().split('T')[0];

const StatusBadge = ({ status }) => {
  const colors = { 'Pending Approval': 'bg-rose-100 text-rose-800', 'Approved': 'bg-sky-100 text-sky-800', 'Reported': 'bg-amber-100 text-amber-800', 'Started': 'bg-blue-100 text-blue-800', 'Completed': 'bg-indigo-100 text-indigo-800', 'Reviewed': 'bg-purple-100 text-purple-800', 'Billed': 'bg-emerald-100 text-emerald-800' };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-slate-100 text-slate-800'}`}>{status}</span>;
};

function LoginScreen({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const params = new URLSearchParams();
    params.append('username', credentials.username); params.append('password', credentials.password);
    try {
      const res = await API.post('/login', params);
      localStorage.setItem('tms_token', res.data.access_token); localStorage.setItem('tms_role', res.data.role); localStorage.setItem('tms_name', res.data.name);
      onLogin(res.data.role, res.data.name);
    } catch (err) { setError('Invalid username or password.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-sky-200">
        <div className="text-center mb-8">
          <div className="bg-sky-500 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-sky-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="font-black text-4xl text-slate-900 tracking-wide mb-2">TMS<span className="text-sky-500">.</span></h1>
          <p className="text-slate-500 font-medium">Enterprise Management System</p>
        </div>
        {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-semibold mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField label="Username" name="username" value={credentials.username} onChange={e => setCredentials({...credentials, username: e.target.value})} />
          <InputField label="Password" type="password" name="password" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} />
          <button type="submit" className="w-full bg-sky-600 text-white rounded-xl py-4 font-bold hover:bg-sky-700 transition-all mt-6 shadow-lg shadow-sky-600/30">Login</button>
        </form>
      </div>
    </div>
  );
}

function DriverPanel({ userName }) {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [actionTrip, setActiveTrip] = useState(null);
  const [startData, setStartData] = useState({ out_km: '' });
  const [endData, setEndData] = useState({ in_km: '' });

  useEffect(() => { fetchTrips(); API.get('/vehicles_list/').then(res => setVehicles(res.data.map(v => v.vehicle_number))).catch(console.error); }, []);
  const fetchTrips = () => API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);
  const hasActiveTrip = trips.some(t => ['Reported', 'Started'].includes(t.status));

  const handleReport = async (id) => { try { await API.patch(`/trips/${id}/report`, { reporting_time: getCurrentTime() }); fetchTrips(); } catch (err) { alert(err.response?.data?.detail || "Error."); } };
  const handleStart = async (e, id) => { e.preventDefault(); try { await API.patch(`/trips/${id}/start`, { out_time: getCurrentTime(), out_km: Number(startData.out_km) }); setActiveTrip(null); setStartData({out_km:''}); fetchTrips(); } catch (err) { alert("Error."); } };
  const handleEnd = async (e, trip) => { e.preventDefault(); if (Number(endData.in_km) <= trip.out_km) { alert(`Stop KM must be higher than Starting KM (${trip.out_km}).`); return; } try { await API.patch(`/trips/${trip.id}/end`, { in_time: getCurrentTime(), in_km: Number(endData.in_km) }); setActiveTrip(null); setEndData({in_km:''}); fetchTrips(); } catch (err) { alert("Error."); } };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Welcome, {userName} 🚛</h2>
      <h3 className="text-xl font-bold mb-4">Your Dispatched Trips</h3>
      <div className="grid gap-4 mb-12">
        {trips.filter(t => ['Approved', 'Reported', 'Started'].includes(t.status)).map(trip => (
          <div key={trip.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${trip.status === 'Reported' || trip.status === 'Started' ? 'border-sky-400 shadow-sky-100' : 'border-slate-100'}`}>
            <div className="flex justify-between items-center mb-4"><div><span className="font-bold text-xl">{trip.vehicle_number}</span><span className="text-slate-500 ml-2 font-medium">({trip.date})</span></div><StatusBadge status={trip.status} /></div>
            {trip.status === 'Approved' && (
              <button onClick={() => handleReport(trip.id)} disabled={hasActiveTrip} className={`px-6 py-3 rounded-xl font-bold w-full md:w-auto transition-all ${hasActiveTrip ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-sky-600 text-white shadow-md hover:bg-sky-700'}`}>
                {hasActiveTrip ? 'Another trip is active' : 'Report for Duty'}
              </button>
            )}
            {trip.status === 'Reported' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-sm font-semibold text-slate-600 mb-4">Reported at: <span className="text-slate-900">{trip.reporting_time}</span></div>
                {actionTrip === trip.id ? (
                  <form onSubmit={(e) => handleStart(e, trip.id)} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full"><InputField label="Starting KM" type="number" name="out_km" value={startData.out_km} onChange={e=>setStartData({out_km: e.target.value})} /></div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Start Journey</button>
                    <button type="button" onClick={() => setActiveTrip(null)} className="text-slate-500 px-4 font-semibold">Cancel</button>
                  </form>
                ) : (<button onClick={() => setActiveTrip(trip.id)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md">Enter Starting KM</button>)}
              </div>
            )}
            {trip.status === 'Started' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-sm font-semibold text-slate-600 mb-4">Started at: <span className="text-indigo-600 font-bold text-lg">{trip.out_km} KM</span> ({trip.out_time})</div>
                {actionTrip === trip.id ? (
                  <form onSubmit={(e) => handleEnd(e, trip)} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full"><InputField label="Stop KM" type="number" name="in_km" value={endData.in_km} onChange={e=>setEndData({in_km: e.target.value})} /></div>
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Close Trip</button>
                    <button type="button" onClick={() => setActiveTrip(null)} className="text-slate-500 px-4 font-semibold">Cancel</button>
                  </form>
                ) : (<button onClick={() => setActiveTrip(trip.id)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors">Log Arrival (Stop KM)</button>)}
              </div>
            )}
          </div>
        ))}
        {trips.filter(t => ['Approved', 'Reported', 'Started'].includes(t.status)).length === 0 && <div className="text-slate-500 italic">No dispatched trips waiting for you.</div>}
      </div>

      <h3 className="text-xl font-bold mb-4">Your Past Journeys</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.filter(t => !['Approved', 'Reported', 'Started', 'Pending Approval'].includes(t.status)).map(trip => (
          <div key={trip.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-800">{trip.vehicle_number}</span><span className="text-xs font-semibold text-slate-500">{trip.date}</span></div>
            <div className="text-sm text-slate-600 mb-2">Distance: {trip.in_km - trip.out_km} KM</div>
            <StatusBadge status={trip.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SupervisorPanel() {
  const [activeTab, setActiveTab] = useState('dispatch');
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [dispatchData, setDispatchData] = useState({ driver_id: '', vehicle_number: '', date: getCurrentDate() });
  const [shuffleTrip, setShuffleTrip] = useState(null);
  const [shuffleVehicle, setShuffleVehicle] = useState('');
  
  const [reviewTrip, setReviewTrip] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
  const [reviewData, setReviewData] = useState({ vehicle_type: '', vehicle_mode: '', body_type: '', vendor_name: '', helper_name: '', client_name: '', source: '', destination: '' });
  
  const [expenseTrip, setExpenseTrip] = useState(null);
  const [expTab, setExpTab] = useState('expenses');
  const [expData, setExpData] = useState({ fuel_litres: '', fuel_price: '', toll_charges: '', other_expenses: '', driver_cost: '', trip_days: 1, overtime_allowance: '', vehicle_cost_type: '', vehicle_cost: '', b2c_billing: '' });

  const [endingTrip, setEndingTrip] = useState(null);
  const [endData, setEndData] = useState({ in_km: '' });

  const [driverForm, setDriverForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [vehicleForm, setVehicleForm] = useState({ vehicle_number: '', ownership_type: 'Third Party', emi: '' });

  const vehicleTypes = ["Tata Ace", "Intra", "Bolero Pickup", "Verro", "Bara Dast", "10' FT", "14' FT", "17' FT", "20' FT", "22' FT", "32' FT SXL", "32' FT MXL"];
  
  useEffect(() => { fetchAllData(); }, []);
  const fetchAllData = () => {
    API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);
    API.get('/users/all').then(res => setUsers(res.data)).catch(console.error);
    API.get('/vendors_list/').then(res => setVendors(res.data.map(v => v.name))).catch(console.error);
    API.get('/clients_list/').then(res => setClients(res.data.map(c => c.name))).catch(console.error);
    API.get('/vehicles_list/').then(res => setVehicles(res.data)).catch(console.error);
  };

  const openExpenses = (trip) => {
    setExpenseTrip(trip); setExpTab('expenses');
    const assignedVehicle = vehicles.find(v => v.vehicle_number === trip.vehicle_number);
    let autoCostType = trip.vehicle_cost_type || '';
    let autoCost = trip.vehicle_cost || '';

    if (!trip.vehicle_cost_type && assignedVehicle) {
        if (assignedVehicle.ownership_type === 'Own Company') {
            autoCostType = 'Own Company';
            autoCost = (assignedVehicle.emi / 30).toFixed(2);
        } else {
            autoCostType = 'Third Party';
        }
    }
    setExpData({ 
        fuel_litres: trip.fuel_litres || '', fuel_price: trip.fuel_price || '', toll_charges: trip.toll_charges || '', 
        other_expenses: trip.other_expenses || '', driver_cost: trip.driver_cost || '', trip_days: trip.trip_days || 1, 
        overtime_allowance: trip.overtime_allowance || '', vehicle_cost_type: autoCostType || 'Third Party', 
        vehicle_cost: autoCost, b2c_billing: trip.b2c_billing || '' 
    });
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try { 
      const payload = {}; 
      Object.keys(expData).forEach(k => {
          if (k === 'vehicle_cost_type') { payload[k] = expData[k] || "Third Party"; }
          else { payload[k] = Number(expData[k]) || 0; }
      });
      await API.patch(`/trips/${expenseTrip.id}/supervisor_expenses`, payload); 
      setExpenseTrip(null); fetchAllData(); 
    } catch (err) { alert("Failed to save. Make sure all fields are valid numbers."); }
  };

  const liveFuel = (Number(expData.fuel_litres)||0) * (Number(expData.fuel_price)||0);
  const liveCost = liveFuel + (Number(expData.toll_charges)||0) + (Number(expData.other_expenses)||0) + (Number(expData.driver_cost)||0) + (Number(expData.overtime_allowance)||0) + (Number(expData.vehicle_cost)||0);
  const liveProfit = (Number(expData.b2c_billing)||0) - liveCost;

  const handleDispatch = async (e) => { e.preventDefault(); try { await API.post('/trips/', dispatchData); setDispatchData({ driver_id: '', vehicle_number: '', date: getCurrentDate() }); fetchAllData(); alert("Trip Dispatched!"); setActiveTab('trips'); } catch (err) { alert("Failed."); } };
  const handleShuffle = async (e) => { e.preventDefault(); try { await API.patch(`/trips/${shuffleTrip.id}/shuffle_vehicle`, { vehicle_number: shuffleVehicle }); setShuffleTrip(null); fetchAllData(); alert("Vehicle changed!"); } catch (err) { alert("Failed."); } };
  const handleReviewSubmit = async (e) => { e.preventDefault(); try { await API.patch(`/trips/${reviewTrip.id}/review`, reviewData); setReviewTrip(null); fetchAllData(); } catch (err) { alert("Error."); } };
  const handleEndTrip = async (e) => { e.preventDefault(); if (Number(endData.in_km) <= endingTrip.out_km) { alert(`Stop KM must be higher than Starting KM (${endingTrip.out_km}).`); return; } try { await API.patch(`/trips/${endingTrip.id}/end`, { in_time: getCurrentTime(), in_km: Number(endData.in_km) }); setEndingTrip(null); fetchAllData(); } catch (err) { alert("Error."); } };
  const handleCreateDriver = async (e) => { e.preventDefault(); try { await API.post('/users/driver', { ...driverForm, role: 'driver' }); alert("Created!"); setDriverForm({ username: '', password: '', name: '', phone: '' }); fetchAllData(); } catch (err) { alert("Error."); } };
  const handleAddVehicle = async (e) => { e.preventDefault(); try { await API.post('/vehicles_list/', { vehicle_number: vehicleForm.vehicle_number.replace(/\s+/g, '').toUpperCase(), ownership_type: vehicleForm.ownership_type, emi: Number(vehicleForm.emi) || 0 }); setVehicleForm({ vehicle_number: '', ownership_type: 'Third Party', emi: '' }); fetchAllData(); alert("Vehicle Added!"); } catch (err) { alert("Error."); } };
  const handleDeleteVehicle = async (id) => { if (window.confirm("Delete vehicle?")) { try { await API.delete(`/vehicles_list/${id}`); fetchAllData(); } catch(err) { alert("Failed."); } } };

  const getDriverName = (driverId) => { const driver = users.find(u => u.id === driverId); return driver ? driver.name : 'Unknown'; };
  const getActiveVehicle = (driverId) => { const active = trips.find(t => t.driver_id === driverId && ['Pending Approval','Approved','Reported','Started'].includes(t.status)); return active ? active.vehicle_number : 'Available'; };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Supervisor Dispatch Center</h2>
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl inline-flex">
        <button onClick={() => setActiveTab('dispatch')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'dispatch' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Dispatch New Trip</button>
        <button onClick={() => setActiveTab('trips')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'trips' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Manage Trips</button>
        <button onClick={() => setActiveTab('fleet')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'fleet' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>My Fleet</button>
        <button onClick={() => setActiveTab('drivers')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'drivers' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Add Driver</button>
        <button onClick={() => setActiveTab('vehicles')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vehicles' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Manage Vehicles</button>
      </div>

      {activeTab === 'dispatch' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl border border-slate-100">
          <h3 className="text-2xl font-bold mb-6">Create Trip Assignment</h3>
          <form onSubmit={handleDispatch} className="space-y-5">
            <SelectField label="Select Driver" value={dispatchData.driver_id} onChange={e => setDispatchData({...dispatchData, driver_id: Number(e.target.value)})} optionObjects={users.filter(u=>u.role==='driver')} />
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Assign Vehicle Number</label>
              <input list="vehicles-list" required placeholder="Type or select..." value={dispatchData.vehicle_number} onChange={(e) => setDispatchData(prev => ({...prev, vehicle_number: e.target.value.replace(/\s+/g, '').toUpperCase()}))} className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-sky-500/20 block w-full p-3 outline-none" />
              <datalist id="vehicles-list">{vehicles.map((v, i) => <option key={i} value={v.vehicle_number} />)}</datalist>
            </div>
            <InputField label="Trip Date" type="date" value={dispatchData.date} onChange={e => setDispatchData({...dispatchData, date: e.target.value})} />
            <button type="submit" className="w-full bg-sky-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg shadow-sky-600/30">Dispatch to Admin for Approval</button>
          </form>
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b"><tr><th className="p-4">ID / Date</th><th className="p-4">Driver</th><th className="p-4">Vehicle</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id} className="border-b">
                  <td className="p-4 font-bold">#{trip.id} <span className="text-slate-400 block font-normal">{trip.date}</span></td>
                  <td className="p-4 font-bold text-sky-600">{getDriverName(trip.driver_id)}</td>
                  <td className="p-4">{trip.vehicle_number}</td>
                  <td className="p-4"><StatusBadge status={trip.status} /></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {['Pending Approval', 'Approved'].includes(trip.status) && (<button onClick={() => { setShuffleTrip(trip); setShuffleVehicle(''); }} className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 text-xs shadow-sm">Shuffle Vehicle</button>)}
                      {trip.status !== '' && (<button onClick={() => openExpenses(trip)} className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-200 text-xs shadow-sm">Expenses</button>)}
                      {['Started', 'Completed'].includes(trip.status) && (<button onClick={() => { setReviewTrip(trip); setReviewData({ vehicle_type: trip.vehicle_type || '', vehicle_mode: trip.vehicle_mode || '', body_type: trip.body_type || '', vendor_name: trip.vendor_name || '', helper_name: trip.helper_name || '', client_name: trip.client_name || '', source: trip.source || '', destination: trip.destination || '' }); }} className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg font-bold hover:bg-sky-200 text-xs shadow-sm">Review Details</button>)}
                      {['Reviewed', 'Billed'].includes(trip.status) && (<button onClick={() => setViewingTrip(trip)} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 text-xs shadow-sm">Details</button>)}
                      {trip.status === 'Started' && (<button onClick={() => { setEndingTrip(trip); setEndData({ in_km: '' }); }} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 text-xs shadow-sm">Log Arrival</button>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expenseTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Log Expenses & B2C Billing (#{expenseTrip.id})</h3>
            <div className="flex space-x-2 mb-6 bg-slate-100 p-1.5 rounded-xl">
              <button onClick={() => setExpTab('expenses')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${expTab === 'expenses' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Vehicle Expenses</button>
              <button onClick={() => setExpTab('b2c')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${expTab === 'b2c' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>B2C Billing</button>
            </div>
            <form onSubmit={handleExpenseSubmit}>
              {expTab === 'expenses' && (
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Fuel Litres" type="number" value={expData.fuel_litres} onChange={e => setExpData({...expData, fuel_litres: e.target.value})} />
                  <InputField label="Fuel Price / L" type="number" value={expData.fuel_price} onChange={e => setExpData({...expData, fuel_price: e.target.value})} />
                  <InputField label="Toll Charges" type="number" value={expData.toll_charges} onChange={e => setExpData({...expData, toll_charges: e.target.value})} />
                  <InputField label="Other Expenses" type="number" value={expData.other_expenses} onChange={e => setExpData({...expData, other_expenses: e.target.value})} />
                  <div className="col-span-2 border-t pt-4 mt-2 grid grid-cols-3 gap-4">
                    <InputField label="Driver Total Cost" type="number" value={expData.driver_cost} onChange={e => setExpData({...expData, driver_cost: e.target.value})} />
                    <InputField label="Trip Days (Attendance)" type="number" value={expData.trip_days} onChange={e => setExpData({...expData, trip_days: e.target.value})} />
                    <InputField label="Overtime Allowance" type="number" value={expData.overtime_allowance} onChange={e => setExpData({...expData, overtime_allowance: e.target.value})} />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                    <SelectField label="Vehicle Cost Type" value={expData.vehicle_cost_type} onChange={e => setExpData({...expData, vehicle_cost_type: e.target.value, vehicle_cost: ''})} options={['Own Company', 'Third Party']} />
                    <InputField label="Vehicle Cost" type="number" value={expData.vehicle_cost} disabled={expData.vehicle_cost_type === 'Own Company'} onChange={e => setExpData({...expData, vehicle_cost: e.target.value})} placeholder={expData.vehicle_cost_type === 'Own Company' ? "Auto-calculated (EMI/30)" : "Enter Manual Cost"} />
                  </div>
                </div>
              )}
              {expTab === 'b2c' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100"><InputField label="B2C (Bill to Company) Revenue" type="number" value={expData.b2c_billing} onChange={e => setExpData({...expData, b2c_billing: e.target.value})} /></div>
                  <div className="flex flex-col md:flex-row gap-4 border-t pt-6">
                    <div className="flex-1 bg-slate-100 p-4 rounded-xl text-center"><div className="text-xs font-bold text-slate-500">TOTAL EXPENSES</div><div className="text-2xl font-black text-rose-600">₹{liveCost}</div></div>
                    <div className="flex-1 bg-slate-100 p-4 rounded-xl text-center"><div className="text-xs font-bold text-slate-500">B2C BILLING</div><div className="text-2xl font-black text-indigo-600">₹{Number(expData.b2c_billing) || 0}</div></div>
                    <div className={`flex-1 p-4 rounded-xl text-center ${liveProfit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}><div className={`text-xs font-bold ${liveProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>PROFIT</div><div className={`text-2xl font-black ${liveProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{liveProfit}</div></div>
                  </div>
                </div>
              )}
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setExpenseTrip(null)} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-sky-600 text-white py-4 rounded-xl font-bold">Save Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {shuffleTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6">Change Vehicle for #{shuffleTrip.id}</h3>
            <form onSubmit={handleShuffle}>
              <div className="flex flex-col space-y-1.5 mb-6">
                <label className="text-sm font-semibold text-slate-700">New Vehicle Number</label>
                <input list="vehicles-list" required value={shuffleVehicle} onChange={(e) => setShuffleVehicle(e.target.value.replace(/\s+/g, '').toUpperCase())} className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-sky-500/20 block w-full p-3 outline-none" />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShuffleTrip(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold">Request Approval</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Review Trip (#{reviewTrip.id}) Details</h3>
            <form onSubmit={handleReviewSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Vehicle Type" value={reviewData.vehicle_type} onChange={e => setReviewData({...reviewData, vehicle_type: e.target.value})} options={vehicleTypes} />
              <SelectField label="Vehicle Mode" value={reviewData.vehicle_mode} onChange={e => setReviewData({...reviewData, vehicle_mode: e.target.value})} options={['Adhoc', 'Dedicated']} />
              <SelectField label="Body Type" value={reviewData.body_type} onChange={e => setReviewData({...reviewData, body_type: e.target.value})} options={['Open', 'Closed']} />
              <SelectField label="Vendor Name" value={reviewData.vendor_name} onChange={e => setReviewData({...reviewData, vendor_name: e.target.value})} options={vendors} />
              <div className="col-span-1 md:col-span-2 mt-2 font-bold text-sky-800 border-b pb-2">Client Details</div>
              
              <SelectField label="Select Client" value={reviewData.client_name} onChange={e => setReviewData({...reviewData, client_name: e.target.value})} options={clients} />
              <InputField label="Source (From)" value={reviewData.source} onChange={e => setReviewData({...reviewData, source: e.target.value})} />
              <InputField label="Destination (To)" value={reviewData.destination} onChange={e => setReviewData({...reviewData, destination: e.target.value})} />
              <InputField label="Helper Name" value={reviewData.helper_name} onChange={e => setReviewData({...reviewData, helper_name: e.target.value})} />
              <div className="col-span-1 md:col-span-2 flex gap-4 mt-6">
                <button type="button" onClick={() => setReviewTrip(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 bg-sky-600 text-white py-3 rounded-xl font-bold">Save Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold">Details (#{viewingTrip.id})</h3><button onClick={() => setViewingTrip(null)} className="text-slate-400 font-bold bg-slate-100 p-2 rounded-full">✕</button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailItem label="Vehicle" value={viewingTrip.vehicle_number} />
              <DetailItem label="Vehicle Type" value={viewingTrip.vehicle_type} />
              <DetailItem label="Mode" value={viewingTrip.vehicle_mode} />
              <DetailItem label="Vendor" value={viewingTrip.vendor_name} />
              <DetailItem label="Client Name" value={viewingTrip.client_name} />
              <DetailItem label="Source (From)" value={viewingTrip.source} />
              <DetailItem label="Destination (To)" value={viewingTrip.destination} />
              <DetailItem label="Status" value={viewingTrip.status} />
              <DetailItem label="Starting KM / Time" value={`${viewingTrip.out_km} / ${viewingTrip.out_time}`} />
              <DetailItem label="Stop KM / Time" value={`${viewingTrip.in_km} / ${viewingTrip.in_time}`} />
              <DetailItem label="Total Route" value={`${viewingTrip.in_km - viewingTrip.out_km} km`} />
            </div>
          </div>
        </div>
      )}

      {endingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm">
            <h3 className="text-2xl font-bold mb-6">Log Arrival (#{endingTrip.id})</h3>
            <div className="mb-4 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border">Started at: <span className="text-sky-600 text-lg">{endingTrip.out_km} KM</span></div>
            <form onSubmit={handleEndTrip} className="space-y-4">
              <InputField label="Stop KM" type="number" name="in_km" value={endData.in_km} onChange={e=>setEndData({in_km: e.target.value})} />
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setEndingTrip(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Complete</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {activeTab === 'fleet' && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">Drivers Active Under You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.filter(u => u.role === 'driver').map(driver => (
              <div key={driver.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-lg text-slate-800">{driver.name}</div>
                <div className="text-sm text-slate-500 mb-2">📞 {driver.phone || 'N/A'}</div>
                <div className="bg-white p-2 rounded-lg text-xs font-semibold border">🚗 {getActiveVehicle(driver.id)}</div>
              </div>
            ))}
          </div>
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
            <button type="submit" className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold">Create Account</button>
          </form>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Register New Vehicle</h3>
          <form onSubmit={handleAddVehicle} className="flex flex-col gap-4 mb-6">
            <InputField label="Vehicle Number (No Spaces)" value={vehicleForm.vehicle_number} onChange={e => setVehicleForm({...vehicleForm, vehicle_number: e.target.value.replace(/\s+/g, '').toUpperCase()})} uppercase />
            <SelectField label="Ownership Type" value={vehicleForm.ownership_type} onChange={e => setVehicleForm({...vehicleForm, ownership_type: e.target.value})} options={['Own Company', 'Third Party']} />
            {vehicleForm.ownership_type === 'Own Company' && (
              <InputField label="Monthly EMI (₹)" type="number" value={vehicleForm.emi} onChange={e => setVehicleForm({...vehicleForm, emi: e.target.value})} />
            )}
            <button type="submit" className="bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700">Add Vehicle</button>
          </form>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-4">Approved Vehicles</h4>
          <div className="grid grid-cols-1 gap-2">
            {vehicles.map(v => (
              <div key={v.id} className="bg-slate-50 p-3 rounded-lg border text-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-700 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{v.vehicle_number}</div>
                  <div className="text-xs text-slate-500 mt-1">{v.ownership_type} {v.ownership_type === 'Own Company' ? `(EMI: ₹${v.emi})` : ''}</div>
                </div>
                <button onClick={() => handleDeleteVehicle(v.id)} className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 bg-rose-100 rounded text-xs">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('attendance'); // Defaults to the new Attendance view!
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [billingTrip, setBillingTrip] = useState(null);
  const [editDetailsTrip, setEditDetailsTrip] = useState(null);
  const [editDetailsData, setEditDetailsData] = useState({ vehicle_type: '', vehicle_mode: '', body_type: '', vendor_name: '', helper_name: '', client_name: '', source: '', destination: '' });
  const [viewingTrip, setViewingTrip] = useState(null);

  const vehicleTypes = ["Tata Ace", "Intra", "Bolero Pickup", "Verro", "Bara Dast", "10' FT", "14' FT", "17' FT", "20' FT", "22' FT", "32' FT SXL", "32' FT MXL"];
  const [billData, setBillData] = useState({ fuel_litres: '', fuel_price: '', toll_charges: '', other_expenses: '', driver_cost: '', trip_days: 1, overtime_allowance: '', vehicle_cost_type: '', vehicle_cost: '', b2c_billing: '' });
  
  const [supForm, setSupForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [vendorName, setVendorName] = useState('');
  const [clientName, setClientName] = useState('');
  const [vehicleForm, setVehicleForm] = useState({ vehicle_number: '', ownership_type: 'Third Party', emi: '' });

  useEffect(() => { fetchAllData(); }, []);
  const fetchAllData = () => {
    API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);
    API.get('/users/all').then(res => setUsers(res.data)).catch(console.error);
    API.get('/vendors_list/').then(res => setVendors(res.data)).catch(console.error);
    API.get('/clients_list/').then(res => setClients(res.data)).catch(console.error);
    API.get('/vehicles_list/').then(res => setVehicles(res.data)).catch(console.error);
  };

  const handleApprove = async (id) => { try { await API.patch(`/trips/${id}/approve`); fetchAllData(); } catch (err) { alert("Error."); } };

  const openBillingModal = (trip) => {
    setBillingTrip(trip);
    setBillData({
      fuel_litres: trip.fuel_litres || '', fuel_price: trip.fuel_price || '', toll_charges: trip.toll_charges || '', other_expenses: trip.other_expenses || '', driver_cost: trip.driver_cost || '', trip_days: trip.trip_days || 1, overtime_allowance: trip.overtime_allowance || '', vehicle_cost_type: trip.vehicle_cost_type || 'Third Party', vehicle_cost: trip.vehicle_cost || '', b2c_billing: trip.b2c_billing || ''
    });
  };

  const handleBillSubmit = async (e) => { e.preventDefault(); try { const payload = {}; Object.keys(billData).forEach(k => { if (k === 'vehicle_cost_type') { payload[k] = billData[k] || "Third Party"; } else { payload[k] = Number(billData[k]) || 0; } }); await API.patch(`/trips/${billingTrip.id}/finalize`, payload); setBillingTrip(null); fetchAllData(); } catch (err) { alert("Failed."); } };
  const handleEditDetailsSubmit = async (e) => { e.preventDefault(); try { await API.patch(`/trips/${editDetailsTrip.id}/admin_edit`, editDetailsData); setEditDetailsTrip(null); fetchAllData(); } catch (err) { alert("Failed."); } };

  const liveFuel = (Number(billData.fuel_litres)||0) * (Number(billData.fuel_price)||0);
  const liveCost = liveFuel + (Number(billData.toll_charges)||0) + (Number(billData.other_expenses)||0) + (Number(billData.driver_cost)||0) + (Number(billData.overtime_allowance)||0) + (Number(billData.vehicle_cost)||0);
  const liveProfit = (Number(billData.b2c_billing)||0) - liveCost;

  const handleCreateSupervisor = async (e) => { e.preventDefault(); try { await API.post('/users/supervisor', { ...supForm, role: 'supervisor' }); alert("Created!"); setSupForm({ username: '', password: '', name: '', phone: '' }); fetchAllData(); } catch (err) { alert("Error."); } };
  const handleDeleteUser = async (id) => { if (window.confirm("Delete this user permanently?")) { try { await API.delete(`/users/${id}`); fetchAllData(); } catch(err) { alert("Failed."); } } };
  
  const handleAddVendor = async (e) => { e.preventDefault(); try { await API.post('/vendors_list/', { name: vendorName }); setVendorName(''); fetchAllData(); } catch (err) { alert("Error."); } };
  const handleDeleteVendor = async (id) => { if (window.confirm("Delete vendor?")) { try { await API.delete(`/vendors_list/${id}`); fetchAllData(); } catch(err) { alert("Failed."); } } };

  const handleAddClient = async (e) => { e.preventDefault(); try { await API.post('/clients_list/', { name: clientName }); setClientName(''); fetchAllData(); alert("Client Saved"); } catch (err) { alert("Error."); } };
  const handleDeleteClient = async (id) => { if (window.confirm("Delete client?")) { try { await API.delete(`/clients_list/${id}`); fetchAllData(); } catch(err) { alert("Failed."); } } };

  const handleAddVehicle = async (e) => { e.preventDefault(); try { await API.post('/vehicles_list/', { vehicle_number: vehicleForm.vehicle_number.replace(/\s+/g, '').toUpperCase(), ownership_type: vehicleForm.ownership_type, emi: Number(vehicleForm.emi) || 0 }); setVehicleForm({ vehicle_number: '', ownership_type: 'Third Party', emi: '' }); fetchAllData(); alert("Vehicle Added!"); } catch (err) { alert("Error."); } };
  const handleDeleteVehicle = async (id) => { if (window.confirm("Delete vehicle?")) { try { await API.delete(`/vehicles_list/${id}`); fetchAllData(); } catch(err) { alert("Failed."); } } };

  const getDriverName = (driverId) => { const driver = users.find(u => u.id === driverId); return driver ? driver.name : 'Unknown'; };
  const getSupervisorName = (supId) => { const sup = users.find(u => u.id === supId); return sup ? sup.name : 'Unknown'; };
  const pendingCount = trips.filter(t => t.status === 'Pending Approval').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Master Admin Dashboard</h2>
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl inline-flex">
        <button onClick={() => setActiveTab('attendance')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'attendance' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Driver Tracking</button>
        <button onClick={() => setActiveTab('approvals')} className={`px-5 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Approvals {pendingCount > 0 && <span className="bg-rose-500 text-white rounded-full px-2 py-0.5 text-xs">{pendingCount}</span>}</button>
        <button onClick={() => setActiveTab('trips')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'trips' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Financial Billing</button>
        <button onClick={() => setActiveTab('supervisors')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'supervisors' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Supervisors</button>
        <button onClick={() => setActiveTab('clients')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'clients' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Clients</button>
        <button onClick={() => setActiveTab('vendors')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vendors' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Vendors</button>
        <button onClick={() => setActiveTab('vehicles')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vehicles' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Vehicles</button>
      </div>

      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
          <h3 className="text-xl font-bold mb-6 border-b pb-2">Driver Attendance & Cost Tracking</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b">
                <tr><th className="p-4">Driver Details</th><th className="p-4">Total Trips</th><th className="p-4">Days Worked</th><th className="p-4">Overtime Allowance</th><th className="p-4">Base Driver Cost</th></tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === 'driver').map(driver => {
                  const driverTrips = trips.filter(t => t.driver_id === driver.id && t.status !== 'Pending Approval');
                  const daysPresent = new Set(driverTrips.map(t => t.date)).size; // Unique dates
                  const totalTrips = driverTrips.length;
                  const totalOvertime = driverTrips.reduce((sum, t) => sum + (t.overtime_allowance || 0), 0);
                  const totalDriverCost = driverTrips.reduce((sum, t) => sum + (t.driver_cost || 0), 0);
                  return (
                    <tr key={driver.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-indigo-700">{driver.name} <span className="text-xs text-slate-500 block font-semibold mt-1">📞 {driver.phone || 'No Phone'}</span></td>
                      <td className="p-4 font-bold text-slate-800 text-lg">{totalTrips}</td>
                      <td className="p-4 font-bold text-emerald-600 text-lg">{daysPresent} Days</td>
                      <td className="p-4 text-amber-600 font-bold">₹{totalOvertime}</td>
                      <td className="p-4 font-semibold text-slate-600">₹{totalDriverCost}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b"><tr><th className="p-4">ID</th><th className="p-4">Personnel</th><th className="p-4">Assigned Vehicle</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
            <tbody>
              {trips.filter(t => t.status === 'Pending Approval').map(trip => (
                <tr key={trip.id} className="border-b">
                  <td className="p-4 font-bold">#{trip.id}</td>
                  <td className="p-4"><span className="font-bold text-slate-800 block">D: {getDriverName(trip.driver_id)}</span><span className="text-slate-500 text-xs">S: {getSupervisorName(trip.supervisor_id)}</span></td>
                  <td className="p-4 font-bold text-sky-600">{trip.vehicle_number}</td>
                  <td className="p-4"><StatusBadge status={trip.status} /></td>
                  <td className="p-4"><button onClick={() => handleApprove(trip.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-600">Approve Trip</button></td>
                </tr>
              ))}
              {pendingCount === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500 italic">No trips waiting for approval.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-4">ID</th><th className="p-4">Date</th><th className="p-4">Personnel</th><th className="p-4">Vehicle & Vendor</th><th className="p-4">Status</th><th className="p-4">Total Cost</th><th className="p-4">Profit</th><th className="p-4">Action</th></tr>
            </thead>
            <tbody>
              {trips.filter(t => t.status !== 'Pending Approval').map(trip => (
                <tr key={trip.id} className="border-b">
                  <td className="p-4 font-bold">#{trip.id}</td>
                  <td className="p-4 font-semibold text-slate-600">{trip.date}</td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800 block">D: {getDriverName(trip.driver_id)}</span>
                    <span className="text-slate-500 text-xs">S: {getSupervisorName(trip.supervisor_id)}</span>
                  </td>
                  <td className="p-4">{trip.vehicle_number} <span className="block text-slate-500 text-xs">{trip.vendor_name || 'Unassigned'}</span></td>
                  <td className="p-4"><StatusBadge status={trip.status} /></td>
                  <td className="p-4 font-bold text-rose-600">₹{trip.total_running_cost || 0}</td>
                  <td className="p-4 font-bold text-emerald-600">₹{trip.profit || 0}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => setViewingTrip(trip)} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 text-xs shadow-sm">View Log</button>
                      {(trip.status === 'Reviewed' || trip.status === 'Billed') && (
                         <>
                           <button onClick={() => { setEditDetailsTrip(trip); setEditDetailsData({ vehicle_type: trip.vehicle_type || '', vehicle_mode: trip.vehicle_mode || '', body_type: trip.body_type || '', vendor_name: trip.vendor_name || '', helper_name: trip.helper_name || '', client_name: trip.client_name || '', source: trip.source || '', destination: trip.destination || '' }); }} className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 text-xs shadow-sm">Edit Details</button>
                           <button onClick={() => openBillingModal(trip)} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 text-xs shadow-sm">{trip.status === 'Billed' ? 'Edit Finances' : 'Finalize'}</button>
                         </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold">Complete Trip Log (#{viewingTrip.id})</h3><button onClick={() => setViewingTrip(null)} className="text-slate-400 font-bold bg-slate-100 p-2 rounded-full">✕</button></div>
            <h4 className="font-bold border-b pb-1 mb-4 text-slate-500">Supervisor & Driver Inputs</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <DetailItem label="Driver" value={getDriverName(viewingTrip.driver_id)} />
              <DetailItem label="Supervisor" value={getSupervisorName(viewingTrip.supervisor_id)} />
              <DetailItem label="Vehicle" value={viewingTrip.vehicle_number} />
              <DetailItem label="Vehicle Mode" value={viewingTrip.vehicle_mode} />
              <DetailItem label="Client Name" value={viewingTrip.client_name} />
              <DetailItem label="Source (From)" value={viewingTrip.source} />
              <DetailItem label="Destination (To)" value={viewingTrip.destination} />
              <DetailItem label="Vendor" value={viewingTrip.vendor_name} />
              <DetailItem label="Starting KM / Time" value={`${viewingTrip.out_km} km / ${viewingTrip.out_time}`} />
              <DetailItem label="Stop KM / Time" value={`${viewingTrip.in_km} km / ${viewingTrip.in_time}`} />
              <DetailItem label="Total Distance" value={`${viewingTrip.in_km - viewingTrip.out_km} km`} />
              <DetailItem label="Status" value={viewingTrip.status} />
            </div>

            {(viewingTrip.status === 'Reviewed' || viewingTrip.status === 'Billed') && (
              <>
                <h4 className="font-bold border-b pb-1 mb-4 text-slate-500">Financial Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DetailItem label="Tolls" value={`₹${viewingTrip.toll_charges}`} />
                  <DetailItem label="Driver Cost" value={`₹${viewingTrip.driver_cost}`} />
                  <DetailItem label="Trip Days" value={`${viewingTrip.trip_days} Days`} />
                  <DetailItem label="Overtime Paid" value={`₹${viewingTrip.overtime_allowance}`} />
                  <DetailItem label="Other Exp." value={`₹${viewingTrip.other_expenses}`} />
                  <DetailItem label="Fuel Total" value={`₹${viewingTrip.fuel_litres * viewingTrip.fuel_price}`} />
                  <DetailItem label="Vehicle Cost" value={`₹${viewingTrip.vehicle_cost} (${viewingTrip.vehicle_cost_type})`} />
                </div>
              </>
            )}
            
            {viewingTrip.status === 'Billed' && (
                <div className="mt-6 flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-rose-50 p-4 rounded-xl border border-rose-200"><div className="text-sm font-bold text-rose-500">TOTAL EXPENSES</div><div className="text-3xl font-black text-rose-700">₹{viewingTrip.total_running_cost}</div></div>
                  <div className="flex-1 bg-indigo-50 p-4 rounded-xl border border-indigo-200"><div className="text-sm font-bold text-indigo-500">B2C REVENUE</div><div className="text-3xl font-black text-indigo-700">₹{viewingTrip.b2c_billing}</div></div>
                  <div className="flex-1 bg-emerald-50 p-4 rounded-xl border border-emerald-200"><div className="text-sm font-bold text-emerald-500">NET PROFIT</div><div className="text-3xl font-black text-emerald-700">₹{viewingTrip.profit}</div></div>
                </div>
            )}
          </div>
        </div>
      )}

      {editDetailsTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Admin Override: Trip #{editDetailsTrip.id}</h3>
            <form onSubmit={handleEditDetailsSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Vehicle Type" value={editDetailsData.vehicle_type} onChange={e => setEditDetailsData({...editDetailsData, vehicle_type: e.target.value})} options={vehicleTypes} />
              <SelectField label="Vehicle Mode" value={editDetailsData.vehicle_mode} onChange={e => setEditDetailsData({...editDetailsData, vehicle_mode: e.target.value})} options={['Adhoc', 'Dedicated']} />
              <SelectField label="Body Type" value={editDetailsData.body_type} onChange={e => setEditDetailsData({...editDetailsData, body_type: e.target.value})} options={['Open', 'Closed']} />
              <SelectField label="Vendor Name" value={editDetailsData.vendor_name} onChange={e => setEditDetailsData({...editDetailsData, vendor_name: e.target.value})} options={vendors.map(v=>v.name)} />
              <div className="col-span-1 md:col-span-2 mt-2 font-bold text-sky-800 border-b pb-2">Client Details</div>
              
              <SelectField label="Select Client" value={editDetailsData.client_name} onChange={e => setEditDetailsData({...editDetailsData, client_name: e.target.value})} options={clients.map(c=>c.name)} />
              <InputField label="Source (From)" value={editDetailsData.source} onChange={e => setEditDetailsData({...editDetailsData, source: e.target.value})} />
              <InputField label="Destination (To)" value={editDetailsData.destination} onChange={e => setEditDetailsData({...editDetailsData, destination: e.target.value})} />
              <InputField label="Helper Name" value={editDetailsData.helper_name} onChange={e => setEditDetailsData({...editDetailsData, helper_name: e.target.value})} />
              <div className="col-span-1 md:col-span-2 flex gap-4 mt-6">
                <button type="button" onClick={() => setEditDetailsTrip(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold">Override Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {billingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Financial Reconciliation (#{billingTrip.id})</h3>
            <form onSubmit={handleBillSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Fuel Litres" type="number" value={billData.fuel_litres} onChange={e => setBillData({...billData, fuel_litres: e.target.value})} />
                <InputField label="Fuel Price / L" type="number" value={billData.fuel_price} onChange={e => setBillData({...billData, fuel_price: e.target.value})} />
                <InputField label="Toll Charges" type="number" value={billData.toll_charges} onChange={e => setBillData({...billData, toll_charges: e.target.value})} />
                <InputField label="Other Expenses" type="number" value={billData.other_expenses} onChange={e => setBillData({...billData, other_expenses: e.target.value})} />
                
                {/* Updated Tracking Section */}
                <div className="col-span-2 border-t pt-4 mt-2 grid grid-cols-3 gap-4">
                  <InputField label="Driver Total Cost" type="number" value={billData.driver_cost} onChange={e => setBillData({...billData, driver_cost: e.target.value})} />
                  <InputField label="Trip Days (Attendance)" type="number" value={billData.trip_days} onChange={e => setBillData({...billData, trip_days: e.target.value})} />
                  <InputField label="Overtime Allowance" type="number" value={billData.overtime_allowance} onChange={e => setBillData({...billData, overtime_allowance: e.target.value})} />
                </div>
                
                <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                  <SelectField label="Vehicle Cost Type" value={billData.vehicle_cost_type} onChange={e => setBillData({...billData, vehicle_cost_type: e.target.value, vehicle_cost: ''})} options={['Own Company', 'Third Party']} />
                  <InputField label="Vehicle Cost" type="number" value={billData.vehicle_cost} disabled={billData.vehicle_cost_type === 'Own Company'} onChange={e => setBillData({...billData, vehicle_cost: e.target.value})} />
                </div>
                <div className="col-span-2 border-t pt-4 mt-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <InputField label="B2C (Bill to Company) Revenue" type="number" value={billData.b2c_billing} onChange={e => setBillData({...billData, b2c_billing: e.target.value})} />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 border-t pt-6 mt-6">
                <div className="flex-1 bg-slate-100 p-4 rounded-xl text-center"><div className="text-xs font-bold text-slate-500">TOTAL EXPENSES</div><div className="text-2xl font-black text-rose-600">₹{liveCost}</div></div>
                <div className="flex-1 bg-slate-100 p-4 rounded-xl text-center"><div className="text-xs font-bold text-slate-500">B2C REVENUE</div><div className="text-2xl font-black text-indigo-600">₹{Number(billData.b2c_billing) || 0}</div></div>
                <div className={`flex-1 p-4 rounded-xl text-center ${liveProfit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}><div className={`text-xs font-bold ${liveProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>PROFIT</div><div className={`text-2xl font-black ${liveProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{liveProfit}</div></div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setBillingTrip(null)} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold">Finalize</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN TABS: SUPERVISORS / CLIENTS / VENDORS / VEHICLES */}
      {activeTab === 'supervisors' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Create Supervisor Account</h3>
          <form onSubmit={handleCreateSupervisor} className="space-y-4">
            <InputField label="Full Name" value={supForm.name} onChange={e => setSupForm({...supForm, name: e.target.value})} />
            <InputField label="Phone Number" type="number" value={supForm.phone} onChange={e => setSupForm({...supForm, phone: e.target.value})} />
            <InputField label="Login Username" value={supForm.username} onChange={e => setSupForm({...supForm, username: e.target.value})} />
            <InputField label="Login Password" type="password" value={supForm.password} onChange={e => setSupForm({...supForm, password: e.target.value})} />
            <button type="submit" className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold">Create Account</button>
          </form>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mt-8 mb-4">Active Supervisors</h4>
          <div className="grid gap-2">
            {users.filter(u=>u.role==='supervisor').map(sup => (
              <div key={sup.id} className="bg-slate-50 p-3 rounded-lg border text-sm font-semibold flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-500"></span>{sup.name}</div><button onClick={() => handleDeleteUser(sup.id)} className="text-rose-500 hover:text-rose-700 px-2 py-1 bg-rose-100 rounded text-xs font-bold">Delete</button></div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Manage Clients</h3>
          <form onSubmit={handleAddClient} className="flex gap-4 mb-6">
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Add Client Name..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none" />
            <button type="submit" className="bg-sky-600 text-white px-6 rounded-xl font-bold">Add</button>
          </form>
          <div className="grid grid-cols-2 gap-2">
            {clients.map(c => (
              <div key={c.id} className="bg-slate-50 p-2 rounded-lg border text-sm font-semibold flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>{c.name}</div><button onClick={() => handleDeleteClient(c.id)} className="text-rose-500 hover:text-rose-700 font-bold px-2 bg-rose-100 rounded">✕</button></div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Manage Vendors</h3>
          <form onSubmit={handleAddVendor} className="flex gap-4 mb-6">
            <input type="text" value={vendorName} onChange={e => setVendorName(e.target.value)} required placeholder="Add Vendor Name..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none" />
            <button type="submit" className="bg-sky-600 text-white px-6 rounded-xl font-bold">Add</button>
          </form>
          <div className="grid grid-cols-2 gap-2">
            {vendors.map(v => (
              <div key={v.id} className="bg-slate-50 p-2 rounded-lg border text-sm font-semibold flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{v.name}</div><button onClick={() => handleDeleteVendor(v.id)} className="text-rose-500 hover:text-rose-700 font-bold px-2 bg-rose-100 rounded">✕</button></div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Register New Vehicle</h3>
          <form onSubmit={handleAddVehicle} className="flex flex-col gap-4 mb-6">
            <InputField label="Vehicle Number (No Spaces)" value={vehicleForm.vehicle_number} onChange={e => setVehicleForm({...vehicleForm, vehicle_number: e.target.value.replace(/\s+/g, '').toUpperCase()})} uppercase />
            <SelectField label="Ownership Type" value={vehicleForm.ownership_type} onChange={e => setVehicleForm({...vehicleForm, ownership_type: e.target.value})} options={['Own Company', 'Third Party']} />
            {vehicleForm.ownership_type === 'Own Company' && (
              <InputField label="Monthly EMI (₹)" type="number" value={vehicleForm.emi} onChange={e => setVehicleForm({...vehicleForm, emi: e.target.value})} />
            )}
            <button type="submit" className="bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700">Add Vehicle</button>
          </form>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-4">Approved Vehicles</h4>
          <div className="grid grid-cols-1 gap-2">
            {vehicles.map(v => (
              <div key={v.id} className="bg-slate-50 p-3 rounded-lg border text-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-700 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{v.vehicle_number}</div>
                  <div className="text-xs text-slate-500 mt-1">{v.ownership_type} {v.ownership_type === 'Own Company' ? `(EMI: ₹${v.emi})` : ''}</div>
                </div>
                <button onClick={() => handleDeleteVehicle(v.id)} className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 bg-rose-100 rounded text-xs">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('tms_role'));
  const [name, setName] = useState(localStorage.getItem('tms_name'));

  const handleLogin = (newRole, newName) => { setRole(newRole); setName(newName); };
  const handleLogout = () => { localStorage.clear(); setRole(null); setName(null); };

  if (!role) return <LoginScreen onLogin={handleLogin} />;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <nav className="bg-sky-600 px-6 py-4 sticky top-0 z-40 shadow-xl flex justify-between items-center text-white">
          <h1 className="font-black text-2xl tracking-wide">TMS<span className="text-sky-200">.</span></h1>
          <div className="flex items-center gap-6">
            <div className="text-sm hidden sm:block">Logged in as <span className="font-bold text-sky-200">{name}</span></div>
            <button onClick={handleLogout} className="bg-sky-800 hover:bg-rose-600 px-4 py-2 rounded-lg font-bold transition-colors text-sm">Logout</button>
          </div>
        </nav>
        <main className="pb-12 pt-6">
          <Routes>
            <Route path="/" element={role === 'admin' ? <AdminPanel /> : role === 'supervisor' ? <SupervisorPanel /> : <DriverPanel userName={name} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}