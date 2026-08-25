import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import API from './api';

// --- DRIVER PANEL ---
function DriverPanel() {
  const [formData, setFormData] = useState({
    date: '', vehicle_number: '', vehicle_type: '', reporting_time: '', out_time: '',
    out_km: 0, in_time: '', in_km: 0, driver_name: '', mobile_number: '', vendor_name: '',
    helper_name: '', toll_money: 0, fuel_litres: 0, fuel_price: 0, police_fines: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/trips/', formData);
      alert("Journey Logged Successfully!");
      window.location.reload();
    } catch (error) {
      alert("Error saving journey data.");
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === 'number' ? Number(value) : value });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-blue-700">Driver Journey Log</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 bg-white p-6 rounded shadow">
        {/* Render 16 Inputs Dynamically to save space */}
        {Object.keys(formData).map((key) => (
          <div key={key} className="flex flex-col">
            <label className="mb-1 font-semibold text-gray-700 capitalize">{key.replace('_', ' ')}</label>
            <input 
              type={key.includes('km') || key.includes('money') || key.includes('price') || key.includes('litres') || key.includes('fines') ? 'number' : key === 'date' ? 'date' : 'text'}
              name={key}
              value={formData[key]}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
          </div>
        ))}
        <button type="submit" className="col-span-2 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">Submit Journey</button>
      </form>
    </div>
  );
}

// --- ADMIN PANEL ---
function AdminPanel() {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    API.get('/trips/').then(res => setTrips(res.data));
  }, []);

  const handleProcessBilling = async (tripId) => {
    const driverCost = prompt("Enter Driver Cost (INR):");
    const vehicleCharged = prompt("Enter Vehicle Charged for Transportation (INR):");
    const billingAmount = prompt("Enter Final Billing Amount (INR):");

    if (driverCost && vehicleCharged && billingAmount) {
      try {
        await API.patch(`/trips/${tripId}/billing`, {
          driver_cost: Number(driverCost),
          vehicle_charged: Number(vehicleCharged),
          billing_amount: Number(billingAmount)
        });
        alert("Billing Processed and Profit Calculated!");
        window.location.reload();
      } catch (err) {
        alert("Failed to process billing.");
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-red-700">Admin Financial Dashboard</h2>
      <div className="overflow-x-auto bg-white rounded shadow p-4">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Date</th>
              <th className="p-3">Driver / Vehicle</th>
              <th className="p-3">Toll + Fines</th>
              <th className="p-3">Fuel (L × Price)</th>
              <th className="p-3">Total Cost</th>
              <th className="p-3">Billing</th>
              <th className="p-3">Profit</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(trip => (
              <tr key={trip.id} className="border-b">
                <td className="p-3">{trip.id}</td>
                <td className="p-3">{trip.date}</td>
                <td className="p-3">{trip.driver_name}<br/><span className="text-gray-500">{trip.vehicle_number}</span></td>
                <td className="p-3">₹{trip.toll_money + trip.police_fines}</td>
                <td className="p-3">₹{trip.fuel_litres * trip.fuel_price}</td>
                <td className="p-3 font-bold text-red-600">₹{trip.total_cost}</td>
                <td className="p-3 font-bold text-blue-600">₹{trip.billing_amount}</td>
                <td className="p-3 font-bold text-green-600">₹{trip.profit}</td>
                <td className="p-3">
                  {!trip.is_billed ? (
                    <button onClick={() => handleProcessBilling(trip.id)} className="bg-green-500 text-white px-3 py-1 rounded">Process Billing</button>
                  ) : (
                    <span className="text-gray-500">Billed ✔️</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MAIN ROUTER ---
export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-slate-900 text-white p-4 flex gap-6 shadow">
          <h1 className="font-bold text-xl mr-10">TMS</h1>
          <Link to="/" className="hover:text-blue-300">Driver Entry Panel</Link>
          <Link to="/admin" className="hover:text-blue-300">Admin Dashboard</Link>
        </nav>

        {/* Dynamic Page Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DriverPanel />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}