import React, { useState, useEffect } from 'react';
import API from '../api';
import { InputField, StatusBadge, getCurrentTime } from './SharedUI';

export default function DriverPanel({ userName }) {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [actionTrip, setActiveTrip] = useState(null);
  const [startData, setStartData] = useState({ out_km: '' });
  const [endData, setEndData] = useState({ in_km: '' });

  useEffect(() => { fetchTrips(); API.get('/vehicles_list/').then(res => setVehicles(res.data.map(v => v.vehicle_number))).catch(console.error); }, []);
  const fetchTrips = () => API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);
  
  const hasActiveTrip = trips.some(t => ['Reported', 'Trip Started', 'Submitted for Review'].includes(t.status));

  const handleReport = async (id) => { try { await API.patch(`/trips/${id}/report`, { reporting_time: getCurrentTime() }); fetchTrips(); } catch (err) { alert(err.response?.data?.detail || "Error."); } };
  const handleStart = async (e, id) => { e.preventDefault(); try { await API.patch(`/trips/${id}/start`, { out_time: getCurrentTime(), out_km: Number(startData.out_km) }); setActiveTrip(null); setStartData({out_km:''}); fetchTrips(); } catch (err) { alert("Error."); } };
  const handleEnd = async (e, trip) => { e.preventDefault(); if (Number(endData.in_km) <= trip.out_km) { alert(`Stop KM must be higher than Starting KM (${trip.out_km}).`); return; } try { await API.patch(`/trips/${trip.id}/end`, { in_time: getCurrentTime(), in_km: Number(endData.in_km) }); setActiveTrip(null); setEndData({in_km:''}); fetchTrips(); } catch (err) { alert("Error."); } };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Welcome, {userName} 🚛</h2>
      <h3 className="text-xl font-bold mb-4">Your Dispatched Trips</h3>
      <div className="grid gap-4 mb-12">
        {trips.filter(t => ['Waiting for Driver', 'Reported', 'Trip Started', 'Submitted for Review'].includes(t.status)).map(trip => (
          <div key={trip.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${trip.status === 'Reported' || trip.status === 'Trip Started' ? 'border-sky-400 shadow-sky-100' : 'border-slate-100'}`}>
            <div className="flex justify-between items-center mb-4"><div><span className="font-bold text-xl">{trip.vehicle_number}</span><span className="text-slate-500 ml-2 font-medium">({trip.date})</span></div><StatusBadge status={trip.status} /></div>
            
            {trip.status === 'Waiting for Driver' && (
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
            {['Trip Started', 'Submitted for Review'].includes(trip.status) && (
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
        {trips.filter(t => ['Waiting for Driver', 'Reported', 'Trip Started', 'Submitted for Review'].includes(t.status)).length === 0 && <div className="text-slate-500 italic">No dispatched trips waiting for you.</div>}
      </div>

      <h3 className="text-xl font-bold mb-4">Your Past Journeys</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.filter(t => ['Completed', 'Pending for Admin Final Review', 'Billed / Completed'].includes(t.status)).map(trip => (
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