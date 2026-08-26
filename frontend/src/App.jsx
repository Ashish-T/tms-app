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

const DetailItem = ({ label, value }) => (
  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className="block text-sm font-semibold text-slate-900 mt-1">{value || '-'}</span>
  </div>
);

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);
const getCurrentDate = () => new Date().toISOString().split('T')[0];

const StatusBadge = ({ status }) => {
  const colors = { 'Started': 'bg-blue-100 text-blue-800', 'Completed': 'bg-indigo-100 text-indigo-800', 'Reviewed': 'bg-purple-100 text-purple-800', 'Billed': 'bg-emerald-100 text-emerald-800' };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-slate-100 text-slate-800'}`}>{status}</span>;
};

// --- LOGIN SCREEN ---
function LoginScreen({ onLogin }) {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8"><h1 className="font-black text-4xl text-slate-900 tracking-wide mb-2">TMS<span className="text-indigo-600">.</span></h1><p className="text-slate-500">Sign in to your account</p></div>
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
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({ vehicle_number: '', reporting_time: '', out_km: '', out_time: '', date: '' });
  const [endData, setEndData] = useState({ in_km: '', in_time: '' });
  const [activeEndTrip, setActiveEndTrip] = useState(null);

  useEffect(() => { 
    fetchTrips(); 
    API.get('/vehicles_list/').then(res => setVehicles(res.data.map(v => v.vehicle_number))).catch(console.error);
  }, []);
  
  const fetchTrips = () => API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);

  const handleStartTrip = async (e) => {
    e.preventDefault();
    try {
      await API.post('/trips/', formData);
      setFormData({ vehicle_number: '', reporting_time: '', out_km: '', out_time: '', date: '' }); fetchTrips();
    } catch (err) { alert("Failed to start trip."); }
  };

  const handleEndTrip = async (e, trip) => {
    e.preventDefault();
    if (Number(endData.in_km) <= trip.out_km) { alert(`⚠️ Error: The 'In KM' reading must be higher than your starting KM (${trip.out_km}).`); return; }
    try {
      await API.patch(`/trips/${trip.id}/end`, endData);
      setActiveEndTrip(null); setEndData({ in_km: '', in_time: '' }); fetchTrips();
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <h3 className="text-xl font-bold border-b pb-3 mb-4">Start New Trip</h3>
        <form onSubmit={handleStartTrip} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <SelectField label="Vehicle Number" name="vehicle_number" value={formData.vehicle_number} onChange={handleStartChange} options={vehicles} />
          <InputField label="Reporting Time" type="time" name="reporting_time" value={formData.reporting_time} onChange={handleStartChange} />
          <InputField label="Out KM" type="number" name="out_km" value={formData.out_km} onChange={handleStartChange} />
          <InputField label="Date (Auto)" type="date" name="date" value={formData.date} onChange={handleStartChange} />
          <InputField label="Out Time (Auto)" type="time" name="out_time" value={formData.out_time} onChange={handleStartChange} />
          <button type="submit" className="bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Start Journey</button>
        </form>
      </div>
      <h3 className="text-xl font-bold mb-4">Your Active Trips</h3>
      <div className="grid gap-4">
        {trips.filter(t => t.status === 'Started').map(trip => (
          <div key={trip.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div><span className="font-bold text-xl">{trip.vehicle_number}</span><span className="text-slate-500 ml-2 font-medium">({trip.date})</span></div>
              <StatusBadge status={trip.status} />
            </div>
            <div className="mb-6 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 inline-block">🚀 Started Journey at: <span className="text-indigo-600 font-bold text-base ml-1">{trip.out_km} KM</span></div>
            {activeEndTrip === trip.id ? (
              <form onSubmit={(e) => handleEndTrip(e, trip)} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex-1 w-full"><InputField label="In KM" type="number" name="in_km" value={endData.in_km} onChange={handleEndChange} /></div>
                <div className="flex-1 w-full"><InputField label="In Time (Auto)" type="time" name="in_time" value={endData.in_time} onChange={handleEndChange} /></div>
                <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold w-full md:w-auto">Complete</button>
                <button type="button" onClick={() => setActiveEndTrip(null)} className="text-slate-500 px-4 font-semibold w-full md:w-auto">Cancel</button>
              </form>
            ) : (
              <div><button onClick={() => setActiveEndTrip(trip.id)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors">Log Arrival (In KM)</button></div>
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
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [reviewTrip, setReviewTrip] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
  const [reviewData, setReviewData] = useState({ vehicle_type: '', vehicle_mode: '', body_type: '', vendor_name: '', helper_name: '' });
  
  const [endingTrip, setEndingTrip] = useState(null);
  const [endData, setEndData] = useState({ in_km: '', in_time: '' });

  const [driverForm, setDriverForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [vehicleForm, setVehicleForm] = useState('');

  const vehicleTypes = ["Tata Ace", "Intra", "Bolero Pickup", "Verro", "Bara Dast", "10' FT", "14' FT", "17' FT", "20' FT", "22' FT", "32' FT SXL", "32' FT MXL"];
  
  useEffect(() => { fetchAllData(); }, []);
  const fetchAllData = () => {
    API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);
    API.get('/users/all').then(res => setUsers(res.data)).catch(console.error);
    API.get('/vendors_list/').then(res => setVendors(res.data.map(v => v.name))).catch(console.error);
    API.get('/vehicles_list/').then(res => setVehicles(res.data)).catch(console.error);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/trips/${reviewTrip.id}/review`, reviewData);
      setReviewTrip(null); fetchAllData();
    } catch (err) { alert("Error saving review."); }
  };

  const handleEndTrip = async (e) => {
    e.preventDefault();
    if (Number(endData.in_km) <= endingTrip.out_km) { alert(`⚠️ Error: The 'In KM' reading must be higher than starting KM (${endingTrip.out_km}).`); return; }
    try {
      await API.patch(`/trips/${endingTrip.id}/end`, endData);
      setEndingTrip(null); setEndData({ in_km: '', in_time: '' }); fetchAllData();
    } catch (err) { alert("Failed to end trip."); }
  };

  const handleEndChange = (e) => {
    const { name, value } = e.target;
    setEndData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'in_km' && value && !prev.in_time) newData.in_time = getCurrentTime();
      return newData;
    });
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users/driver', { ...driverForm, role: 'driver' });
      alert("Driver Account Created!"); setDriverForm({ username: '', password: '', name: '', phone: '' }); fetchAllData();
    } catch (err) { alert("Failed to create driver."); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await API.post('/vehicles_list/', { vehicle_number: vehicleForm.toUpperCase() });
      setVehicleForm(''); fetchAllData(); alert("Vehicle Added Successfully!");
    } catch (err) { alert("Error adding vehicle. It might already exist."); }
  };

  const getDriverName = (driverId) => { const driver = users.find(u => u.id === driverId); return driver ? driver.name : 'Unknown Driver'; };
  const getActiveVehicle = (driverId) => { const active = trips.find(t => t.driver_id === driverId && t.status === 'Started'); return active ? active.vehicle_number : 'Available (No Active Trip)'; };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Supervisor Dispatch Center</h2>
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl inline-flex">
        <button onClick={() => setActiveTab('trips')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'trips' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Review Trips</button>
        <button onClick={() => setActiveTab('fleet')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'fleet' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>My Fleet Overview</button>
        <button onClick={() => setActiveTab('drivers')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'drivers' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Add New Driver</button>
        <button onClick={() => setActiveTab('vehicles')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vehicles' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Manage Vehicles</button>
      </div>

      {activeTab === 'trips' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-4">ID / Date</th><th className="p-4">Driver</th><th className="p-4">Vehicle</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id} className="border-b">
                  <td className="p-4 font-bold">#{trip.id} <span className="text-slate-400 block font-normal">{trip.date}</span></td>
                  <td className="p-4 font-bold text-indigo-600">{getDriverName(trip.driver_id)}</td>
                  <td className="p-4">{trip.vehicle_number}</td>
                  <td className="p-4"><StatusBadge status={trip.status} /></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {/* Only allow Review if the trip has NOT been reviewed yet */}
                      {(trip.status === 'Started' || trip.status === 'Completed') && (
                         <button onClick={() => { setReviewTrip(trip); setReviewData({ vehicle_type: trip.vehicle_type || '', vehicle_mode: trip.vehicle_mode || '', body_type: trip.body_type || '', vendor_name: trip.vendor_name || '', helper_name: trip.helper_name || '' }); }} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-200 text-xs shadow-sm">Review & Assign</button>
                      )}
                      
                      {/* READ ONLY view for finalized trips */}
                      {(trip.status === 'Reviewed' || trip.status === 'Billed') && (
                         <button onClick={() => setViewingTrip(trip)} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 text-xs shadow-sm">View Details</button>
                      )}
                      
                      {trip.status === 'Started' && (
                        <button onClick={() => { setEndingTrip(trip); setEndData({ in_km: '', in_time: '' }); }} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 text-xs shadow-sm">Log Arrival</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* READ ONLY DETAILS MODAL FOR SUPERVISOR */}
      {viewingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Details (Trip #{viewingTrip.id})</h3>
              <button onClick={() => setViewingTrip(null)} className="text-slate-400 font-bold bg-slate-100 p-2 rounded-full">✕</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailItem label="Vehicle" value={viewingTrip.vehicle_number} />
              <DetailItem label="Vehicle Type" value={viewingTrip.vehicle_type} />
              <DetailItem label="Mode" value={viewingTrip.vehicle_mode} />
              <DetailItem label="Vendor" value={viewingTrip.vendor_name} />
              <DetailItem label="Out KM / Time" value={`${viewingTrip.out_km} km / ${viewingTrip.out_time}`} />
              <DetailItem label="In KM / Time" value={`${viewingTrip.in_km} km / ${viewingTrip.in_time}`} />
              <DetailItem label="Total Route" value={`${viewingTrip.in_km - viewingTrip.out_km} km`} />
              <DetailItem label="Status" value={viewingTrip.status} />
            </div>
            <div className="mt-6 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              ℹ️ This trip has been submitted to Admin. Contact Admin to make any corrections.
            </div>
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
                <div className="bg-white p-2 rounded-lg text-xs font-semibold border">
                  Current Vehicle: <span className={getActiveVehicle(driver.id).includes('Available') ? 'text-emerald-600' : 'text-blue-600'}>{getActiveVehicle(driver.id)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPERVISOR REVIEW MODAL */}
      {reviewTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg">
            <h3 className="text-2xl font-bold mb-6">Review Trip #{reviewTrip.id}</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <SelectField label="Vehicle Type" value={reviewData.vehicle_type} onChange={e => setReviewData({...reviewData, vehicle_type: e.target.value})} options={vehicleTypes} />
              <SelectField label="Vehicle Mode" value={reviewData.vehicle_mode} onChange={e => setReviewData({...reviewData, vehicle_mode: e.target.value})} options={['Adhoc', 'Dedicated']} />
              <SelectField label="Body Type" value={reviewData.body_type} onChange={e => setReviewData({...reviewData, body_type: e.target.value})} options={['Open', 'Closed']} />
              <SelectField label="Vendor Name" value={reviewData.vendor_name} onChange={e => setReviewData({...reviewData, vendor_name: e.target.value})} options={vendors} />
              <InputField label="Helper Name" value={reviewData.helper_name} onChange={e => setReviewData({...reviewData, helper_name: e.target.value})} />
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setReviewTrip(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* END TRIP / CREATE DRIVER / ETC FORMS ... */}
      {endingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm">
            <h3 className="text-2xl font-bold mb-6">Log Arrival (Trip #{endingTrip.id})</h3>
            <div className="mb-4 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border">Started at: <span className="text-indigo-600 text-lg">{endingTrip.out_km} KM</span></div>
            <form onSubmit={handleEndTrip} className="space-y-4">
              <InputField label="In KM" type="number" name="in_km" value={endData.in_km} onChange={handleEndChange} />
              <InputField label="In Time (Auto)" type="time" name="in_time" value={endData.in_time} onChange={handleEndChange} />
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setEndingTrip(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Complete</button>
              </div>
            </form>
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
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Create Account</button>
          </form>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Register New Vehicle</h3>
          <form onSubmit={handleAddVehicle} className="flex flex-col gap-4 mb-6">
            <InputField label="Vehicle Number (e.g., WB 12 3456)" value={vehicleForm} onChange={e => setVehicleForm(e.target.value)} uppercase pattern="^WB[-\s]?\d{1,2}[-\s]?[A-Za-z]{0,2}[-\s]?\d{4}$" title="Must start with WB, followed by digits and letters (e.g., WB123456, WB 12 AB 3456)" />
            <button type="submit" className="bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">Add to System</button>
          </form>
        </div>
      )}
    </div>
  );
}

// --- ADMIN PANEL ---
function AdminPanel() {
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [billingTrip, setBillingTrip] = useState(null);
  const [editDetailsTrip, setEditDetailsTrip] = useState(null);
  const [editDetailsData, setEditDetailsData] = useState({ vehicle_type: '', vehicle_mode: '', body_type: '', vendor_name: '', helper_name: '' });
  const [viewingTrip, setViewingTrip] = useState(null);

  const vehicleTypes = ["Tata Ace", "Intra", "Bolero Pickup", "Verro", "Bara Dast", "10' FT", "14' FT", "17' FT", "20' FT", "22' FT", "32' FT SXL", "32' FT MXL"];

  // The massive new financial state
  const [billData, setBillData] = useState({ 
    fuel_litres: '', fuel_price: '', toll_charges: '', parking_charges: '', entry_charges: '', 
    loading_charges: '', unloading_charges: '', police_fines: '', other_expenses: '', 
    driver_daily_salary: '', trip_days: '', driver_bata: '', food_allowance: '', fixed_cost: '', billing_amount: '' 
  });
  
  const [supForm, setSupForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [vendorName, setVendorName] = useState('');
  const [vehicleForm, setVehicleForm] = useState('');

  useEffect(() => { fetchAllData(); }, []);
  const fetchAllData = () => {
    API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);
    API.get('/users/all').then(res => setUsers(res.data)).catch(console.error);
    API.get('/vendors_list/').then(res => setVendors(res.data)).catch(console.error);
    API.get('/vehicles_list/').then(res => setVehicles(res.data)).catch(console.error);
  };

  const openBillingModal = (trip) => {
    setBillingTrip(trip);
    // Pre-fill the data if it was already billed so Admin can edit!
    setBillData({
      fuel_litres: trip.fuel_litres || '', fuel_price: trip.fuel_price || '', toll_charges: trip.toll_charges || '',
      parking_charges: trip.parking_charges || '', entry_charges: trip.entry_charges || '', loading_charges: trip.loading_charges || '',
      unloading_charges: trip.unloading_charges || '', police_fines: trip.police_fines || '', other_expenses: trip.other_expenses || '',
      driver_daily_salary: trip.driver_daily_salary || '', trip_days: trip.trip_days || '', driver_bata: trip.driver_bata || '',
      food_allowance: trip.food_allowance || '', fixed_cost: trip.fixed_cost || '', billing_amount: trip.billing_amount || ''
    });
  };

  const handleBillSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {}; Object.keys(billData).forEach(k => payload[k] = Number(billData[k]) || 0);
      await API.patch(`/trips/${billingTrip.id}/finalize`, payload);
      setBillingTrip(null); fetchAllData();
    } catch (err) { alert("Failed to finalize billing."); }
  };

  const handleEditDetailsSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/trips/${editDetailsTrip.id}/admin_edit`, editDetailsData);
      setEditDetailsTrip(null); fetchAllData();
    } catch (err) { alert("Failed to save changes."); }
  };

  // --- LIVE MATH PREVIEWS FOR ADMIN ---
  const calculateLiveTotals = () => {
    const fuel = (Number(billData.fuel_litres)||0) * (Number(billData.fuel_price)||0);
    const drvCost = ((Number(billData.driver_daily_salary)||0) * (Number(billData.trip_days)||0)) + (Number(billData.driver_bata)||0) + (Number(billData.food_allowance)||0);
    const runCost = fuel + (Number(billData.toll_charges)||0) + (Number(billData.parking_charges)||0) + (Number(billData.entry_charges)||0) + drvCost + (Number(billData.loading_charges)||0) + (Number(billData.unloading_charges)||0) + (Number(billData.other_expenses)||0) + (Number(billData.police_fines)||0) + (Number(billData.fixed_cost)||0);
    const pft = (Number(billData.billing_amount)||0) - runCost;
    return { fuel, drvCost, runCost, pft };
  };
  const liveStats = calculateLiveTotals();

  const handleCreateSupervisor = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users/supervisor', { ...supForm, role: 'supervisor' });
      alert("Supervisor Account Created!"); setSupForm({ username: '', password: '', name: '', phone: '' }); fetchAllData();
    } catch (err) { alert("Failed to create supervisor."); }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try { await API.post('/vendors_list/', { name: vendorName }); setVendorName(''); fetchAllData(); } catch (err) { alert("Error adding vendor."); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try { await API.post('/vehicles_list/', { vehicle_number: vehicleForm.toUpperCase() }); setVehicleForm(''); fetchAllData(); alert("Vehicle Added Successfully!"); } catch (err) { alert("Error adding vehicle. It might already exist."); }
  };

  const getDriverName = (driverId) => { const driver = users.find(u => u.id === driverId); return driver ? driver.name : 'Unknown'; };
  const getSupervisorName = (supId) => { const sup = users.find(u => u.id === supId); return sup ? sup.name : 'Unknown'; };
  const getActiveVehicle = (driverId) => { const active = trips.find(t => t.driver_id === driverId && t.status === 'Started'); return active ? active.vehicle_number : 'Available (No active trip)'; };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Master Admin Dashboard</h2>
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl inline-flex">
        <button onClick={() => setActiveTab('trips')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'trips' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Financial Billing</button>
        <button onClick={() => setActiveTab('fleet')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'fleet' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Fleet Overview</button>
        <button onClick={() => setActiveTab('supervisors')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'supervisors' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Add Supervisor</button>
        <button onClick={() => setActiveTab('vendors')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vendors' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Manage Vendors</button>
        <button onClick={() => setActiveTab('vehicles')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vehicles' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Manage Vehicles</button>
      </div>

      {activeTab === 'trips' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-4">ID</th><th className="p-4">Personnel</th><th className="p-4">Vehicle & Vendor</th><th className="p-4">Status</th><th className="p-4">Total Cost</th><th className="p-4">Profit</th><th className="p-4">Action</th></tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id} className="border-b">
                  <td className="p-4 font-bold">#{trip.id}</td>
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
                           <button onClick={() => { setEditDetailsTrip(trip); setEditDetailsData({ vehicle_type: trip.vehicle_type, vehicle_mode: trip.vehicle_mode, body_type: trip.body_type, vendor_name: trip.vendor_name, helper_name: trip.helper_name }); }} className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 text-xs shadow-sm">Edit Details</button>
                           <button onClick={() => openBillingModal(trip)} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 text-xs shadow-sm">{trip.status === 'Billed' ? 'Edit Finances' : 'Finalize Finances'}</button>
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

      {/* ADMIN READ ONLY LOG */}
      {viewingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Complete Trip Log (#{viewingTrip.id})</h3>
              <button onClick={() => setViewingTrip(null)} className="text-slate-400 font-bold bg-slate-100 p-2 rounded-full">✕</button>
            </div>
            
            <h4 className="font-bold border-b pb-1 mb-4 text-slate-500">Supervisor & Driver Inputs</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <DetailItem label="Driver" value={getDriverName(viewingTrip.driver_id)} />
              <DetailItem label="Supervisor" value={getSupervisorName(viewingTrip.supervisor_id)} />
              <DetailItem label="Vehicle" value={viewingTrip.vehicle_number} />
              <DetailItem label="Vehicle Mode" value={viewingTrip.vehicle_mode} />
              <DetailItem label="Vehicle Type" value={viewingTrip.vehicle_type} />
              <DetailItem label="Vendor" value={viewingTrip.vendor_name} />
              <DetailItem label="Helper" value={viewingTrip.helper_name} />
              <DetailItem label="Date" value={viewingTrip.date} />
              <DetailItem label="Out KM / Time" value={`${viewingTrip.out_km} km / ${viewingTrip.out_time}`} />
              <DetailItem label="In KM / Time" value={`${viewingTrip.in_km} km / ${viewingTrip.in_time}`} />
              <DetailItem label="Total Distance" value={`${viewingTrip.in_km - viewingTrip.out_km} km`} />
              <DetailItem label="Status" value={viewingTrip.status} />
            </div>

            {viewingTrip.status === 'Billed' && (
              <>
                <h4 className="font-bold border-b pb-1 mb-4 text-slate-500">Financial Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DetailItem label="Tolls" value={`₹${viewingTrip.toll_charges}`} />
                  <DetailItem label="Parking" value={`₹${viewingTrip.parking_charges}`} />
                  <DetailItem label="Entry Charges" value={`₹${viewingTrip.entry_charges}`} />
                  <DetailItem label="Loading" value={`₹${viewingTrip.loading_charges}`} />
                  <DetailItem label="Unloading" value={`₹${viewingTrip.unloading_charges}`} />
                  <DetailItem label="Police Fines" value={`₹${viewingTrip.police_fines}`} />
                  <DetailItem label="Other Exp." value={`₹${viewingTrip.other_expenses}`} />
                  <DetailItem label="Fuel Total" value={`₹${viewingTrip.fuel_litres * viewingTrip.fuel_price}`} />
                  <DetailItem label="Driver Salary" value={`₹${viewingTrip.driver_daily_salary} /day`} />
                  <DetailItem label="Trip Days" value={viewingTrip.trip_days} />
                  <DetailItem label="Driver Bata" value={`₹${viewingTrip.driver_bata}`} />
                  <DetailItem label="Food Allowance" value={`₹${viewingTrip.food_allowance}`} />
                </div>
                
                <div className="mt-6 flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-rose-50 p-4 rounded-xl border border-rose-200">
                    <div className="text-sm font-bold text-rose-500">TOTAL RUNNING COST</div>
                    <div className="text-3xl font-black text-rose-700">₹{viewingTrip.total_running_cost}</div>
                  </div>
                  <div className="flex-1 bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                    <div className="text-sm font-bold text-indigo-500">CUSTOMER BILLING</div>
                    <div className="text-3xl font-black text-indigo-700">₹{viewingTrip.billing_amount}</div>
                  </div>
                  <div className="flex-1 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <div className="text-sm font-bold text-emerald-500">NET PROFIT</div>
                    <div className="text-3xl font-black text-emerald-700">₹{viewingTrip.profit}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ADMIN EDIT DETAILS MODAL */}
      {editDetailsTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg">
            <h3 className="text-2xl font-bold mb-6">Admin Override: Trip #{editDetailsTrip.id} Details</h3>
            <form onSubmit={handleEditDetailsSubmit} className="space-y-4">
              <SelectField label="Vehicle Type" value={editDetailsData.vehicle_type} onChange={e => setEditDetailsData({...editDetailsData, vehicle_type: e.target.value})} options={vehicleTypes} />
              <SelectField label="Vehicle Mode" value={editDetailsData.vehicle_mode} onChange={e => setEditDetailsData({...editDetailsData, vehicle_mode: e.target.value})} options={['Adhoc', 'Dedicated']} />
              <SelectField label="Body Type" value={editDetailsData.body_type} onChange={e => setEditDetailsData({...editDetailsData, body_type: e.target.value})} options={['Open', 'Closed']} />
              <SelectField label="Vendor Name" value={editDetailsData.vendor_name} onChange={e => setEditDetailsData({...editDetailsData, vendor_name: e.target.value})} options={vendors.map(v => v.name)} />
              <InputField label="Helper Name" value={editDetailsData.helper_name} onChange={e => setEditDetailsData({...editDetailsData, helper_name: e.target.value})} />
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setEditDetailsTrip(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold">Override Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MASSIVE ADMIN FINANCIAL MODAL */}
      {billingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Financial Reconciliation (Trip #{billingTrip.id})</h3>
            
            <div className={`p-4 rounded-xl font-bold mb-6 border ${billingTrip.vehicle_mode === 'Dedicated' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
              Mode: {billingTrip.vehicle_mode || 'Unspecified'} | Vehicle: {billingTrip.vehicle_number} | Route: {billingTrip.in_km - billingTrip.out_km} KM
            </div>

            <form onSubmit={handleBillSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              
              {/* SECTION 1: Fuel & Transport */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="font-bold text-indigo-800 border-b pb-2 mb-4">⛽ Fuel & Transport</div>
                <InputField label="Fuel Litres" type="number" value={billData.fuel_litres} onChange={e => setBillData({...billData, fuel_litres: e.target.value})} />
                <InputField label="Fuel Price / L" type="number" value={billData.fuel_price} onChange={e => setBillData({...billData, fuel_price: e.target.value})} />
                <div className="text-sm font-bold text-slate-500">Live Fuel Cost: ₹{liveStats.fuel}</div>
                <InputField label="Toll Charges" type="number" value={billData.toll_charges} onChange={e => setBillData({...billData, toll_charges: e.target.value})} />
                <InputField label="Parking Charges" type="number" value={billData.parking_charges} onChange={e => setBillData({...billData, parking_charges: e.target.value})} />
                <InputField label="Entry/Border Charges" type="number" value={billData.entry_charges} onChange={e => setBillData({...billData, entry_charges: e.target.value})} />
              </div>

              {/* SECTION 2: Driver & Labor */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="font-bold text-indigo-800 border-b pb-2 mb-4">🧑‍✈️ Driver & Labor</div>
                <InputField label="Driver Daily Salary" type="number" value={billData.driver_daily_salary} onChange={e => setBillData({...billData, driver_daily_salary: e.target.value})} />
                <InputField label="Number of Days on Trip" type="number" value={billData.trip_days} onChange={e => setBillData({...billData, trip_days: e.target.value})} />
                <InputField label="Driver Bata/Allowance" type="number" value={billData.driver_bata} onChange={e => setBillData({...billData, driver_bata: e.target.value})} />
                <InputField label="Food Allowance" type="number" value={billData.food_allowance} onChange={e => setBillData({...billData, food_allowance: e.target.value})} />
                <div className="text-sm font-bold text-slate-500">Live Driver Cost: ₹{liveStats.drvCost}</div>
                <InputField label="Loading Charges" type="number" value={billData.loading_charges} onChange={e => setBillData({...billData, loading_charges: e.target.value})} />
                <InputField label="Unloading Charges" type="number" value={billData.unloading_charges} onChange={e => setBillData({...billData, unloading_charges: e.target.value})} />
              </div>

              {/* SECTION 3: Misc & Billing */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="font-bold text-indigo-800 border-b pb-2 mb-4">💰 Misc & Billing</div>
                <InputField label="Other Trip Expenses" type="number" value={billData.other_expenses} onChange={e => setBillData({...billData, other_expenses: e.target.value})} />
                <InputField label="Police Fines" type="number" value={billData.police_fines} onChange={e => setBillData({...billData, police_fines: e.target.value})} />
                
                {billingTrip.vehicle_mode === 'Dedicated' && (
                  <div className="bg-purple-100 p-3 rounded-lg border border-purple-200">
                    <InputField label="Fixed Cost (Dedicated)" type="number" value={billData.fixed_cost} onChange={e => setBillData({...billData, fixed_cost: e.target.value})} />
                  </div>
                )}
                
                <div className="mt-8">
                  <InputField label="Customer Revenue (Billing)" type="number" value={billData.billing_amount} onChange={e => setBillData({...billData, billing_amount: e.target.value})} />
                </div>
              </div>

              {/* LIVE TOTALS FOOTER */}
              <div className="col-span-1 md:col-span-3 mt-6 flex flex-col md:flex-row gap-4 border-t pt-6">
                <div className="flex-1 bg-slate-100 p-4 rounded-xl text-center">
                  <div className="text-xs font-bold text-slate-500 tracking-wider">TOTAL RUNNING COST</div>
                  <div className="text-2xl font-black text-rose-600">₹{liveStats.runCost}</div>
                </div>
                <div className="flex-1 bg-slate-100 p-4 rounded-xl text-center">
                  <div className="text-xs font-bold text-slate-500 tracking-wider">CUSTOMER BILLING</div>
                  <div className="text-2xl font-black text-indigo-600">₹{Number(billData.billing_amount) || 0}</div>
                </div>
                <div className={`flex-1 p-4 rounded-xl text-center ${liveStats.pft >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  <div className={`text-xs font-bold tracking-wider ${liveStats.pft >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>TRIP PROFIT</div>
                  <div className={`text-2xl font-black ${liveStats.pft >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{liveStats.pft}</div>
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-3 flex gap-4 mt-6">
                <button type="button" onClick={() => setBillingTrip(null)} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700">Save to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLEET / SUPERVISORS / VENDORS / VEHICLES TABS ... */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.filter(u => u.role === 'supervisor').map(supervisor => (
            <div key={supervisor.id} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
              <h3 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-700 flex justify-between">
                {supervisor.name} <span className="text-xs bg-indigo-100 px-2 py-1 rounded-full text-indigo-800">Supervisor</span>
              </h3>
              <div className="space-y-4">
                {users.filter(u => u.supervisor_id === supervisor.id).map(driver => (
                  <div key={driver.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">{driver.name}</div>
                    <div className="text-xs text-slate-500 mb-1">📞 {driver.phone || 'N/A'}</div>
                    <div className="text-xs font-semibold bg-white p-1.5 rounded border inline-block">
                      🚗 {getActiveVehicle(driver.id)}
                    </div>
                  </div>
                ))}
                {users.filter(u => u.supervisor_id === supervisor.id).length === 0 && (
                  <div className="text-slate-400 text-sm italic">No drivers assigned yet.</div>
                )}
              </div>
            </div>
          ))}
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

      {activeTab === 'vendors' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Manage Vendors</h3>
          <form onSubmit={handleAddVendor} className="flex gap-4 mb-6">
            <input type="text" value={vendorName} onChange={e => setVendorName(e.target.value)} required placeholder="Add Vendor Name..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none" />
            <button type="submit" className="bg-indigo-600 text-white px-6 rounded-xl font-bold">Add</button>
          </form>
          <div className="grid grid-cols-2 gap-2">
            {vendors.map(v => (
              <div key={v.id} className="bg-slate-50 p-2 rounded-lg border text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{v.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Register New Vehicle</h3>
          <form onSubmit={handleAddVehicle} className="flex flex-col gap-4 mb-6">
            <InputField label="Vehicle Number (e.g., WB 12 3456)" value={vehicleForm} onChange={e => setVehicleForm(e.target.value)} uppercase pattern="^WB[-\s]?\d{1,2}[-\s]?[A-Za-z]{0,2}[-\s]?\d{4}$" title="Must start with WB, followed by digits and letters (e.g., WB123456, WB 12 AB 3456)" />
            <button type="submit" className="bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">Add to System</button>
          </form>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-4">Approved Vehicles</h4>
          <div className="grid grid-cols-2 gap-2">
            {vehicles.map(v => (
              <div key={v.id} className="bg-slate-50 p-2 rounded-lg border text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{v.vehicle_number}
              </div>
            ))}
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
  
  const handleLogout = () => { localStorage.clear(); setRole(null); setName(null); };

  if (!role) return <LoginScreen onLogin={handleLogin} />;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <nav className="bg-slate-900 px-6 py-4 sticky top-0 z-40 shadow-xl flex justify-between items-center text-white">
          <h1 className="font-black text-2xl tracking-wide">TMS<span className="text-indigo-500">.</span></h1>
          <div className="flex items-center gap-6">
            <div className="text-sm hidden sm:block">Logged in as <span className="font-bold text-indigo-400">{name}</span> ({role.toUpperCase()})</div>
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