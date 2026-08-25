import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import API from './api';

// --- STRICT NUMBER INPUT HANDLER ---
// Blocks 'e', 'E', '+', '-' from being typed into number fields
const blockInvalidChars = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
};

const InputField = ({ label, name, type = "text", value, onChange, placeholder, pattern, title, uppercase }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <input
      type={type} name={name} value={value} onChange={onChange} required
      placeholder={placeholder} pattern={pattern} title={title}
      min={type === "number" ? "0" : undefined}
      onKeyDown={type === "number" ? blockInvalidChars : undefined}
      className={`bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all outline-none ${uppercase ? 'uppercase' : ''}`}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <select name={name} value={value} onChange={onChange} required className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all outline-none">
      <option value="">-- Select --</option>
      {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const Card = ({ title, icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100">
    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
      <span className="text-2xl">{icon}</span><h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className="block text-sm font-semibold text-slate-900 mt-1">{value || '-'}</span>
  </div>
);

// --- DRIVER PANEL ---
function DriverPanel() {
  const [formData, setFormData] = useState({
    date: '', vehicle_number: '', vehicle_type: '', reporting_time: '', out_time: '', out_km: '', in_time: '', in_km: '', driver_name: '', mobile_number: '', vendor_name: '', helper_name: '', toll_money: '', fuel_litres: '', fuel_price: '', police_fines: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const vehicleTypes = ["Truck - 18 Wheeler", "Truck - 10 Wheeler", "Mini Truck", "Van", "Flatbed", "Refrigerated"];

  useEffect(() => {
    API.get('/drivers_list/').then(res => setDrivers(res.data.map(d => d.name))).catch(err => console.error(err));
    API.get('/vendors_list/').then(res => setVendors(res.data.map(v => v.name))).catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { ...formData, vehicle_number: formData.vehicle_number.toUpperCase() };
    const numericFields = ['out_km', 'in_km', 'toll_money', 'fuel_litres', 'fuel_price', 'police_fines'];
    numericFields.forEach(field => { payload[field] = payload[field] ? Number(payload[field]) : 0; });

    try {
      await API.post('/trips/', payload);
      alert("✨ Journey Logged Successfully!");
      window.location.reload();
    } catch (error) {
      alert("❌ Error saving journey data.");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Driver Logbook</h2>
        <p className="text-slate-500 mt-2 text-lg">Securely record your journey details below.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <Card title="Trip Details" icon="🚛">
            <InputField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} />
            <InputField label="Vehicle Number" name="vehicle_number" value={formData.vehicle_number} onChange={handleChange} 
              uppercase placeholder="WB 12 3456" 
              pattern="^WB[-\s]?\d{1,2}[-\s]?[A-Za-z]{0,2}[-\s]?\d{4}$" 
              title="Must start with WB, followed by 1 or 2 digits, and end with 4 digits. (e.g., WB123456, WB 12 AB 3456)" />
            <SelectField label="Vehicle Type" name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} options={vehicleTypes} />
            <SelectField label="Vendor Name" name="vendor_name" value={formData.vendor_name} onChange={handleChange} options={vendors} />
          </Card>
          <Card title="Time & Odometer (Digits Only)" icon="⏱️">
            <InputField label="Reporting Time" name="reporting_time" type="time" value={formData.reporting_time} onChange={handleChange} />
            <InputField label="Out Time" name="out_time" type="time" value={formData.out_time} onChange={handleChange} />
            <InputField label="In Time" name="in_time" type="time" value={formData.in_time} onChange={handleChange} />
            <div className="hidden sm:block"></div>
            <InputField label="Out KM" name="out_km" type="number" value={formData.out_km} onChange={handleChange} />
            <InputField label="In KM" name="in_km" type="number" value={formData.in_km} onChange={handleChange} />
          </Card>
          <Card title="Personnel" icon="👥">
            <SelectField label="Driver Name" name="driver_name" value={formData.driver_name} onChange={handleChange} options={drivers} />
            <InputField label="Mobile Number" name="mobile_number" type="number" value={formData.mobile_number} onChange={handleChange} placeholder="10 Digit Mobile" />
            <InputField label="Helper Name" name="helper_name" value={formData.helper_name} onChange={handleChange} />
          </Card>
          <Card title="Expenses (Digits Only)" icon="💳">
            <InputField label="Toll Money (₹)" name="toll_money" type="number" value={formData.toll_money} onChange={handleChange} />
            <InputField label="Fuel Consumed (Litres)" name="fuel_litres" type="number" value={formData.fuel_litres} onChange={handleChange} />
            <InputField label="Fuel Price / L (₹)" name="fuel_price" type="number" value={formData.fuel_price} onChange={handleChange} />
            <InputField label="Police Fines (₹)" name="police_fines" type="number" value={formData.police_fines} onChange={handleChange} />
          </Card>
        </div>
        <div className="mt-8">
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/30 rounded-xl px-5 py-4 font-bold tracking-wide transform hover:-translate-y-0.5 transition-all text-lg">
            {isSubmitting ? 'Syncing to Database...' : 'Submit Journey Report 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- ADMIN PANEL ---
function AdminPanel() {
  const [activeTab, setActiveTab] = useState('trips'); // 'trips', 'drivers', 'vendors'
  
  // Trip State
  const [trips, setTrips] = useState([]);
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [billingData, setBillingData] = useState({ driver_cost: '', vehicle_charged: '', billing_amount: '' });

  // List State
  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => { 
    fetchTrips(); 
    fetchLists();
  }, []);

  const fetchTrips = () => API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);
  const fetchLists = () => {
    API.get('/drivers_list/').then(res => setDrivers(res.data)).catch(console.error);
    API.get('/vendors_list/').then(res => setVendors(res.data)).catch(console.error);
  };

  const openBillingModal = (trip) => { setSelectedTrip(trip); setBillingData({ driver_cost: '', vehicle_charged: '', billing_amount: '' }); setIsModalOpen(true); };

  const handleProcessBilling = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/trips/${selectedTrip.id}/billing`, { driver_cost: Number(billingData.driver_cost), vehicle_charged: Number(billingData.vehicle_charged), billing_amount: Number(billingData.billing_amount) });
      setIsModalOpen(false); fetchTrips();
    } catch (err) { alert("Failed to process billing."); }
  };

  const handleAddListItem = async (e, type) => {
    e.preventDefault();
    try {
      await API.post(`/${type}_list/`, { name: newItemName });
      setNewItemName(''); fetchLists();
    } catch (err) { alert("Error adding item or name already exists."); }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Admin Control Center</h2>
        <p className="text-slate-500 mt-2 text-lg">Manage financial data and dropdown menus.</p>
      </div>

      {/* ADMIN TABS */}
      <div className="flex space-x-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl inline-flex">
        <button onClick={() => setActiveTab('trips')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'trips' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>📊 Financials</button>
        <button onClick={() => setActiveTab('drivers')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'drivers' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>🧑‍✈️ Manage Drivers</button>
        <button onClick={() => setActiveTab('vendors')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vendors' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>🏢 Manage Vendors</button>
      </div>

      {/* TAB 1: FINANCIALS */}
      {activeTab === 'trips' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr><th className="p-4 font-bold uppercase text-xs">Trip ID</th><th className="p-4 font-bold uppercase text-xs">Driver/Vendor</th><th className="p-4 font-bold uppercase text-xs">Distance</th><th className="p-4 font-bold uppercase text-xs text-right">Total Cost</th><th className="p-4 font-bold uppercase text-xs text-right">Billed Amount</th><th className="p-4 font-bold uppercase text-xs text-right">Net Profit</th><th className="p-4 font-bold uppercase text-xs text-center">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map(trip => (
                  <React.Fragment key={trip.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4"><span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">#{trip.id}</span><div className="text-slate-400 text-xs mt-1.5 font-medium">{trip.date}</div></td>
                      <td className="p-4"><span className="font-bold text-slate-900 block">{trip.driver_name}</span><span className="text-slate-500 text-xs">{trip.vendor_name} ({trip.vehicle_number})</span></td>
                      <td className="p-4 text-slate-600 font-medium">{trip.in_km - trip.out_km} km</td>
                      <td className="p-4 font-bold text-rose-600 text-right text-base">₹{trip.total_cost.toLocaleString()}</td>
                      <td className="p-4 font-bold text-indigo-600 text-right text-base">₹{trip.billing_amount.toLocaleString()}</td>
                      <td className="p-4 font-bold text-emerald-600 text-right text-base">₹{trip.profit.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200">Details</button>
                          {!trip.is_billed ? (<button onClick={() => openBillingModal(trip)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600">Process</button>) : (<span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold">✓ Billed</span>)}
                        </div>
                      </td>
                    </tr>
                    {expandedTrip === trip.id && (
                      <tr>
                        <td colSpan="7" className="bg-slate-50 border-b-2 border-indigo-100 p-6 shadow-inner">
                          <h4 className="text-indigo-800 font-bold mb-4 flex items-center gap-2">Full Driver Log Details</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <DetailItem label="Vendor" value={trip.vendor_name} />
                            <DetailItem label="Vehicle Type" value={trip.vehicle_type} />
                            <DetailItem label="Mobile" value={trip.mobile_number} />
                            <DetailItem label="Helper" value={trip.helper_name} />
                            <DetailItem label="Reporting Time" value={trip.reporting_time} />
                            <DetailItem label="Out Time" value={trip.out_time} />
                            <DetailItem label="In Time" value={trip.in_time} />
                            <DetailItem label="Out KM" value={trip.out_km} />
                            <DetailItem label="In KM" value={trip.in_km} />
                            <DetailItem label="Toll Paid" value={`₹${trip.toll_money}`} />
                            <DetailItem label="Fuel (Litres)" value={`${trip.fuel_litres} L`} />
                            <DetailItem label="Fuel Rate" value={`₹${trip.fuel_price}/L`} />
                            <DetailItem label="Police Fines" value={`₹${trip.police_fines}`} />
                            {trip.is_billed && (<><DetailItem label="Admin: Driver Cost" value={`₹${trip.driver_cost}`} /><DetailItem label="Admin: Vehicle Chrg." value={`₹${trip.vehicle_charged}`} /></>)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2 & 3: MANAGE DRIVERS / VENDORS */}
      {(activeTab === 'drivers' || activeTab === 'vendors') && (
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 max-w-2xl">
          <h3 className="text-2xl font-bold mb-6">Add New {activeTab === 'drivers' ? 'Driver' : 'Vendor'}</h3>
          <form onSubmit={(e) => handleAddListItem(e, activeTab)} className="flex gap-4 mb-8">
            <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} required placeholder={`Enter ${activeTab === 'drivers' ? 'Driver' : 'Vendor'} Name...`} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-4 focus:ring-indigo-500/20" />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700">Add to List</button>
          </form>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-4">Current Active {activeTab === 'drivers' ? 'Drivers' : 'Vendors'}</h4>
          <ul className="grid grid-cols-2 gap-3">
            {(activeTab === 'drivers' ? drivers : vendors).map(item => (
              <li key={item.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-semibold text-slate-700 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{item.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* BILLING MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-extrabold">Finalize Billing</h3><button onClick={() => setIsModalOpen(false)} className="bg-slate-100 rounded-full p-2">✕</button></div>
            <form onSubmit={handleProcessBilling} className="space-y-5">
              <InputField label="Driver Cost (Wage/Contract) ₹" type="number" name="driver_cost" value={billingData.driver_cost} onChange={e => setBillingData({...billingData, driver_cost: e.target.value})} />
              <InputField label="Vehicle Charged (Transport) ₹" type="number" name="vehicle_charged" value={billingData.vehicle_charged} onChange={e => setBillingData({...billingData, vehicle_charged: e.target.value})} />
              <InputField label="Final Client Invoice Amount ₹" type="number" name="billing_amount" value={billingData.billing_amount} onChange={e => setBillingData({...billingData, billing_amount: e.target.value})} />
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl py-4 font-bold shadow-lg transition-all mt-6 text-lg">Calculate Profit & Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MAIN ROUTER & NAVIGATION ---
function TopNav() {
  const location = useLocation();
  const navItemClass = (path) => `px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${location.pathname === path ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`;
  return (
    <nav className="bg-slate-900 px-6 py-4 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="font-black text-2xl text-white tracking-wide">TMS<span className="text-indigo-500">.</span></h1>
        <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-2xl"><Link to="/" className={navItemClass('/')}>Driver Log</Link><Link to="/admin" className={navItemClass('/admin')}>Admin</Link></div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900"><TopNav /><main className="pb-12"><Routes><Route path="/" element={<DriverPanel />} /><Route path="/admin" element={<AdminPanel />} /></Routes></main></div>
    </Router>
  );
}