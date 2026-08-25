import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import API from './api';

// --- SHARED UI COMPONENTS ---
// Note: Keeping these OUTSIDE the main components prevents the "losing focus" input bug!
const InputField = ({ label, name, type = "text", value, onChange }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <input
      type={type} name={name} value={value} onChange={onChange} required
      className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-3 transition-all duration-200 outline-none"
    />
  </div>
);

const Card = ({ title, icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100">
    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {children}
    </div>
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
    date: '', vehicle_number: '', vehicle_type: '', reporting_time: '', out_time: '',
    out_km: '', in_time: '', in_km: '', driver_name: '', mobile_number: '', vendor_name: '',
    helper_name: '', toll_money: '', fuel_litres: '', fuel_price: '', police_fines: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Safely cast numbers just before sending to avoid the "stuck input" bug during typing
    const payload = { ...formData };
    const numericFields = ['out_km', 'in_km', 'toll_money', 'fuel_litres', 'fuel_price', 'police_fines'];
    numericFields.forEach(field => { payload[field] = payload[field] ? Number(payload[field]) : 0; });

    try {
      await API.post('/trips/', payload);
      alert("✨ Journey Logged Successfully!");
      setFormData({ // Reset form
        date: '', vehicle_number: '', vehicle_type: '', reporting_time: '', out_time: '', out_km: '', in_time: '', in_km: '', driver_name: '', mobile_number: '', vendor_name: '', helper_name: '', toll_money: '', fuel_litres: '', fuel_price: '', police_fines: ''
      });
      setIsSubmitting(false);
    } catch (error) {
      alert("❌ Error saving journey data.");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update state exactly as typed (fixes the spacebar/decimal freezing issue)
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
            <InputField label="Vehicle Number" name="vehicle_number" value={formData.vehicle_number} onChange={handleChange} />
            <InputField label="Vehicle Type" name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} />
            <InputField label="Vendor Name" name="vendor_name" value={formData.vendor_name} onChange={handleChange} />
          </Card>

          <Card title="Time & Odometer" icon="⏱️">
            <InputField label="Reporting Time" name="reporting_time" type="time" value={formData.reporting_time} onChange={handleChange} />
            <InputField label="Out Time" name="out_time" type="time" value={formData.out_time} onChange={handleChange} />
            <InputField label="In Time" name="in_time" type="time" value={formData.in_time} onChange={handleChange} />
            <div className="hidden sm:block"></div>
            <InputField label="Out KM" name="out_km" type="number" value={formData.out_km} onChange={handleChange} />
            <InputField label="In KM" name="in_km" type="number" value={formData.in_km} onChange={handleChange} />
          </Card>

          <Card title="Personnel" icon="👥">
            <InputField label="Driver Name" name="driver_name" value={formData.driver_name} onChange={handleChange} />
            <InputField label="Mobile Number" name="mobile_number" value={formData.mobile_number} onChange={handleChange} />
            <InputField label="Helper Name" name="helper_name" value={formData.helper_name} onChange={handleChange} />
          </Card>

          <Card title="Expenses (INR)" icon="💳">
            <InputField label="Toll Money" name="toll_money" type="number" value={formData.toll_money} onChange={handleChange} />
            <InputField label="Fuel Litres" name="fuel_litres" type="number" value={formData.fuel_litres} onChange={handleChange} />
            <InputField label="Fuel Price / L" name="fuel_price" type="number" value={formData.fuel_price} onChange={handleChange} />
            <InputField label="Police Fines" name="police_fines" type="number" value={formData.police_fines} onChange={handleChange} />
          </Card>
        </div>

        <div className="mt-8">
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/30 rounded-xl px-5 py-4 font-bold tracking-wide transform hover:-translate-y-0.5 transition-all duration-200 text-lg">
            {isSubmitting ? 'Syncing to Database...' : 'Submit Journey Report 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- ADMIN PANEL ---
function AdminPanel() {
  const [trips, setTrips] = useState([]);
  const [expandedTrip, setExpandedTrip] = useState(null); // Controls the details dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [billingData, setBillingData] = useState({ driver_cost: '', vehicle_charged: '', billing_amount: '' });

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = () => {
    API.get('/trips/').then(res => setTrips(res.data)).catch(err => console.error(err));
  };

  const toggleExpand = (id) => {
    setExpandedTrip(expandedTrip === id ? null : id);
  };

  const openBillingModal = (trip) => {
    setSelectedTrip(trip);
    setBillingData({ driver_cost: '', vehicle_charged: '', billing_amount: '' });
    setIsModalOpen(true);
  };

  const handleProcessBilling = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/trips/${selectedTrip.id}/billing`, {
        driver_cost: Number(billingData.driver_cost),
        vehicle_charged: Number(billingData.vehicle_charged),
        billing_amount: Number(billingData.billing_amount)
      });
      setIsModalOpen(false);
      fetchTrips();
    } catch (err) {
      alert("Failed to process billing.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Financial Overview</h2>
        <p className="text-slate-500 mt-2 text-lg">Review trips, calculate costs, and finalize billing.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Trip ID</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Driver Details</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Distance</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Total Cost</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Billed Amount</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Net Profit</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trips.map(trip => (
                <React.Fragment key={trip.id}>
                  {/* MAIN SUMMARY ROW */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">#{trip.id}</span>
                      <div className="text-slate-400 text-xs mt-1.5 font-medium">{trip.date}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{trip.driver_name}</span>
                      <span className="text-slate-500 text-xs">{trip.vehicle_number}</span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{trip.in_km - trip.out_km} km</td>
                    <td className="p-4 font-bold text-rose-600 text-right text-base">₹{trip.total_cost.toLocaleString()}</td>
                    <td className="p-4 font-bold text-indigo-600 text-right text-base">₹{trip.billing_amount.toLocaleString()}</td>
                    <td className="p-4 font-bold text-emerald-600 text-right text-base">₹{trip.profit.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => toggleExpand(trip.id)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-colors shadow-sm">
                          {expandedTrip === trip.id ? 'Close Details' : 'View Details'}
                        </button>
                        {!trip.is_billed ? (
                          <button onClick={() => openBillingModal(trip)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition-colors shadow-md">
                            Process
                          </button>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold">✓ Billed</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED DETAILS ROW (Shows all Driver Fields) */}
                  {expandedTrip === trip.id && (
                    <tr>
                      <td colSpan="7" className="bg-slate-50 border-b-2 border-indigo-100 p-6 shadow-inner">
                        <h4 className="text-indigo-800 font-bold mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Full Driver Log Details
                        </h4>
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
                          
                          {/* Show admin inputs if it has been billed */}
                          {trip.is_billed && (
                            <>
                              <DetailItem label="Admin: Driver Cost" value={`₹${trip.driver_cost}`} />
                              <DetailItem label="Admin: Vehicle Chrg." value={`₹${trip.vehicle_charged}`} />
                            </>
                          )}
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

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-extrabold text-slate-900">Finalize Billing</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-2">✕</button>
            </div>
            <form onSubmit={handleProcessBilling} className="space-y-5">
              <InputField label="Driver Cost (Wage/Contract) ₹" type="number" name="driver_cost" value={billingData.driver_cost} onChange={e => setBillingData({...billingData, driver_cost: e.target.value})} />
              <InputField label="Vehicle Charged (Transport) ₹" type="number" name="vehicle_charged" value={billingData.vehicle_charged} onChange={e => setBillingData({...billingData, vehicle_charged: e.target.value})} />
              <InputField label="Final Client Invoice Amount ₹" type="number" name="billing_amount" value={billingData.billing_amount} onChange={e => setBillingData({...billingData, billing_amount: e.target.value})} />
              <div className="mt-8 pt-4">
                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl py-4 font-bold shadow-lg transition-all text-lg">
                  Calculate Profit & Save
                </button>
              </div>
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
    <nav className="bg-slate-900 px-6 py-4 sticky top-0 z-40 border-b border-slate-800 shadow-xl shadow-slate-900/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-500 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="font-black text-2xl text-white tracking-wide">TMS<span className="text-indigo-500">.</span></h1>
        </div>
        <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50">
          <Link to="/" className={navItemClass('/')}>Driver Log</Link>
          <Link to="/admin" className={navItemClass('/admin')}>Admin</Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
        <TopNav />
        <main className="pb-12">
          <Routes>
            <Route path="/" element={<DriverPanel />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}