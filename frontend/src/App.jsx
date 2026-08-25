import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import API from './api';

// --- DRIVER PANEL ---
function DriverPanel() {
  const [formData, setFormData] = useState({
    date: '', vehicle_number: '', vehicle_type: '', reporting_time: '', out_time: '',
    out_km: '', in_time: '', in_km: '', driver_name: '', mobile_number: '', vendor_name: '',
    helper_name: '', toll_money: '', fuel_litres: '', fuel_price: '', police_fines: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/trips/', formData);
      alert("✅ Journey Logged Successfully!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("❌ Error saving journey data. Check the console.");
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === 'number' ? Number(value) : value });
  };

  const InputField = ({ label, name, type = "text" }) => (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-semibold text-gray-600">{label}</label>
      <input
        type={type} name={name} value={formData[name]} onChange={handleChange} required
        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
      />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">Driver Journey Log</h2>
        <p className="text-gray-500 mt-1">Please fill out all trip details accurately at the end of your shift.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Trip Details */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">🚛 Trip Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Date" name="date" type="date" />
              <InputField label="Vehicle Number" name="vehicle_number" />
              <InputField label="Vehicle Type" name="vehicle_type" />
              <InputField label="Vendor Name" name="vendor_name" />
            </div>
          </div>

          {/* Card 2: Time & Distance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">🕒 Time & Odometer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Reporting Time" name="reporting_time" type="time" />
              <InputField label="Out Time" name="out_time" type="time" />
              <InputField label="In Time" name="in_time" type="time" />
              <InputField label="Out KM" name="out_km" type="number" />
              <InputField label="In KM" name="in_km" type="number" />
            </div>
          </div>

          {/* Card 3: Personnel */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">👤 Personnel</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Driver Name" name="driver_name" />
              <InputField label="Mobile Number" name="mobile_number" />
              <InputField label="Helper Name" name="helper_name" />
            </div>
          </div>

          {/* Card 4: Expenses */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-blue-800 mb-4 border-b pb-2">💰 Expenses (INR)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Toll Money" name="toll_money" type="number" />
              <InputField label="Fuel Litres" name="fuel_litres" type="number" />
              <InputField label="Fuel Price / L" name="fuel_price" type="number" />
              <InputField label="Police Fines" name="police_fines" type="number" />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-md transition-all">
          Submit Journey to Admin
        </button>
      </form>
    </div>
  );
}

// --- ADMIN PANEL ---
function AdminPanel() {
  const [trips, setTrips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [billingData, setBillingData] = useState({ driver_cost: '', vehicle_charged: '', billing_amount: '' });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = () => {
    API.get('/trips/')
      .then(res => setTrips(res.data))
      .catch(err => console.error("Error fetching trips:", err));
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
      fetchTrips(); // Refresh table
    } catch (err) {
      alert("Failed to process billing.");
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Financial Dashboard</h2>
          <p className="text-gray-500 mt-1">Review trips and process billing</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="p-4 font-semibold">ID & Date</th>
              <th className="p-4 font-semibold">Driver / Vehicle</th>
              <th className="p-4 font-semibold">Route KMs</th>
              <th className="p-4 font-semibold">Toll + Fines</th>
              <th className="p-4 font-semibold">Fuel Cost</th>
              <th className="p-4 font-semibold">Total Cost</th>
              <th className="p-4 font-semibold">Billing</th>
              <th className="p-4 font-semibold">Profit</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trips.length === 0 && <tr><td colSpan="9" className="p-6 text-center text-gray-500">No trips logged yet.</td></tr>}
            {trips.map(trip => (
              <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-gray-900">#{trip.id}</span>
                  <div className="text-gray-500 text-xs mt-1">{trip.date}</div>
                </td>
                <td className="p-4">
                  <span className="font-medium text-gray-900">{trip.driver_name}</span>
                  <div className="text-gray-500 text-xs mt-1">{trip.vehicle_number}</div>
                </td>
                <td className="p-4 text-gray-600">{trip.in_km - trip.out_km} km</td>
                <td className="p-4 text-gray-600">₹{trip.toll_money + trip.police_fines}</td>
                <td className="p-4 text-gray-600">₹{trip.fuel_litres * trip.fuel_price}</td>
                
                <td className="p-4 font-bold text-red-600">₹{trip.total_cost}</td>
                <td className="p-4 font-bold text-blue-600">₹{trip.billing_amount}</td>
                <td className="p-4 font-bold text-emerald-600">₹{trip.profit}</td>
                
                <td className="p-4">
                  {!trip.is_billed ? (
                    <button onClick={() => openBillingModal(trip)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition-colors">
                      Process
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                      ✓ Billed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BILLING MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-2">Process Billing</h3>
            <p className="text-gray-500 mb-6 text-sm">Trip #{selectedTrip?.id} • {selectedTrip?.driver_name}</p>
            
            <form onSubmit={handleProcessBilling} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Driver Cost (₹)</label>
                <input type="number" required value={billingData.driver_cost} onChange={e => setBillingData({...billingData, driver_cost: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Charged for Transport (₹)</label>
                <input type="number" required value={billingData.vehicle_charged} onChange={e => setBillingData({...billingData, vehicle_charged: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Final Billing Amount to Client (₹)</label>
                <input type="number" required value={billingData.billing_amount} onChange={e => setBillingData({...billingData, billing_amount: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Calculate & Save</button>
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
  const navItemClass = (path) => `px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === path ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white'}`;

  return (
    <nav className="bg-slate-900 px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-8">
        <h1 className="font-black text-2xl text-white tracking-wider">TMS<span className="text-blue-500">.</span></h1>
        <div className="flex gap-2">
          <Link to="/" className={navItemClass('/')}>Driver Panel</Link>
          <Link to="/admin" className={navItemClass('/admin')}>Admin Dashboard</Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans">
        <TopNav />
        <main>
          <Routes>
            <Route path="/" element={<DriverPanel />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}