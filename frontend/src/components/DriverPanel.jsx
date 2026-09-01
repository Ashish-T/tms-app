import React, { useState, useEffect } from 'react';
import API from '../api';
import { InputField, StatusBadge, getCurrentTime } from './SharedUI';

export default function DriverPanel({ userName }) {
  const [trips, setTrips] = useState([]);
  const [actionTrip, setActiveTrip] = useState(null);
  const [startData, setStartData] = useState({ out_km: '' });
  const [endData, setEndData] = useState({ in_km: '' });

  useEffect(() => { fetchTrips(); }, []);
  const fetchTrips = () => API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);
  
  const hasActiveTrip = trips.some(t => ['Reported', 'Trip Started', 'Submitted for Review'].includes(t.status));

  const handleReport = async (id) => { try { await API.patch(`/trips/${id}/report`, { reporting_time: getCurrentTime() }); fetchTrips(); } catch (err) { alert(err.response?.data?.detail || "Error."); } };
  const handleStart = async (e, id) => { e.preventDefault(); try { await API.patch(`/trips/${id}/start`, { out_time: getCurrentTime(), out_km: Number(startData.out_km) }); setActiveTrip(null); setStartData({out_km:''}); fetchTrips(); } catch (err) { alert("Error."); } };
  const handleEnd = async (e, trip) => { e.preventDefault(); if (Number(endData.in_km) <= trip.out_km) { alert(`Stop KM must be higher than Starting KM (${trip.out_km}).`); return; } try { await API.patch(`/trips/${trip.id}/end`, { in_time: getCurrentTime(), in_km: Number(endData.in_km) }); setActiveTrip(null); setEndData({in_km:''}); fetchTrips(); } catch (err) { alert("Error."); } };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6 text-sky-900">Welcome, {userName} 🚛</h2>
      
      <h3 className="text-xl font-bold mb-4 text-sky-800">Your Dispatched Trips</h3>
      <div className="grid gap-4 mb-12">
        {trips.filter(t => ['Waiting for Driver', 'Reported', 'Trip Started', 'Submitted for Review'].includes(t.status)).map(trip => (
          <div key={trip.id} className={`bg-white p-6 rounded-3xl shadow-md border ${trip.status === 'Reported' || trip.status === 'Trip Started' ? 'border-sky-400 shadow-sky-200' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6"><div><span className="font-bold text-2xl text-slate-900">{trip.vehicle_number}</span><span className="text-slate-500 ml-2 font-medium">({trip.date})</span></div><StatusBadge status={trip.status} /></div>
            
            {trip.status === 'Waiting for Driver' && (
              <button onClick={() => handleReport(trip.id)} disabled={hasActiveTrip} className={`px-6 py-4 rounded-xl font-bold w-full transition-all ${hasActiveTrip ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:bg-sky-700'}`}>
                {hasActiveTrip ? 'Another trip is active' : 'Report for Duty'}
              </button>
            )}
            
            {trip.status === 'Reported' && (
              <div className="bg-sky-50 p-5 rounded-2xl border border-sky-200">
                <div className="text-sm font-bold text-sky-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Reported at: {trip.reporting_time}
                </div>
                {actionTrip === trip.id ? (
                  <form onSubmit={(e) => handleStart(e, trip.id)} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full"><InputField label="Starting KM" type="number" name="out_km" value={startData.out_km} onChange={e=>setStartData({out_km: e.target.value})} /></div>
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md">Start Journey</button>
                    <button type="button" onClick={() => setActiveTrip(null)} className="text-slate-500 px-4 font-semibold hover:bg-slate-200 py-3 rounded-xl">Cancel</button>
                  </form>
                ) : (<button onClick={() => setActiveTrip(trip.id)} className="w-full bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-700">Enter Starting KM</button>)}
              </div>
            )}
            
            {['Trip Started', 'Submitted for Review'].includes(trip.status) && (
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
                <div className="flex flex-wrap gap-4 text-sm font-bold text-emerald-800 mb-4">
                   <div className="flex items-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Reported: {trip.reporting_time}</div>
                   <div className="flex items-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg> Started: {trip.out_time} ({trip.out_km} KM)</div>
                </div>
                {actionTrip === trip.id ? (
                  <form onSubmit={(e) => handleEnd(e, trip)} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full"><InputField label="Stop KM" type="number" name="in_km" value={endData.in_km} onChange={e=>setEndData({in_km: e.target.value})} /></div>
                    <button type="submit" className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold shadow-md">Close Trip</button>
                    <button type="button" onClick={() => setActiveTrip(null)} className="text-slate-500 px-4 font-semibold hover:bg-slate-200 py-3 rounded-xl">Cancel</button>
                  </form>
                ) : (<button onClick={() => setActiveTrip(trip.id)} className="w-full bg-rose-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-colors">Log Arrival (Stop KM)</button>)}
              </div>
            )}
          </div>
        ))}
        {trips.filter(t => ['Waiting for Driver', 'Reported', 'Trip Started', 'Submitted for Review'].includes(t.status)).length === 0 && <div className="text-sky-800 font-semibold italic bg-white p-6 rounded-2xl border border-sky-200">No active trips dispatched to you right now.</div>}
      </div>

      <h3 className="text-xl font-bold mb-4 text-sky-800">Your Past Journeys</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.filter(t => ['Completed', 'Pending for Admin Final Review', 'Billed / Completed'].includes(t.status)).map(trip => (
          <div key={trip.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-800">{trip.vehicle_number}</span><span className="text-xs font-semibold text-slate-500">{trip.date}</span></div>
            <div className="text-sm font-bold text-slate-700 mb-3 bg-slate-50 p-2 rounded inline-block">Distance Driven: {trip.in_km - trip.out_km} KM</div>
            <div><StatusBadge status={trip.status} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}