import React, { useState, useEffect } from 'react';
import API from '../api';
import { InputField, SelectField, DetailItem, getCurrentTime, getCurrentDate, StatusBadge } from './SharedUI';

export default function SupervisorPanel() {
  const [me, setMe] = useState(null);
  const [activeTab, setActiveTab] = useState('availability'); 
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  // Wallet State
  const [wallet, setWallet] = useState({ total_funded: 0, total_trip_expenses: 0, total_misc_expenses: 0, current_balance: 0 });
  const [miscExpenses, setMiscExpenses] = useState([]);
  const [newMisc, setNewMisc] = useState({ amount: '', description: '', date: getCurrentDate() });

  const [dispatchData, setDispatchData] = useState({ driver_id: '', vehicle_number: '', date: getCurrentDate() });
  const [shuffleTrip, setShuffleTrip] = useState(null);
  const [shuffleVehicle, setShuffleVehicle] = useState('');
  
  const [reviewTrip, setReviewTrip] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
  const [reviewData, setReviewData] = useState({ vehicle_type: '', vehicle_mode: '', body_type: '', vendor_name: '', helper_name: '', client_name: '', source: '', destination: '', vehicle_sourced_from: '' });
  
  const [expenseTrip, setExpenseTrip] = useState(null);
  const [expTab, setExpTab] = useState('expenses');
  const [expData, setExpData] = useState({ fuel_litres: '', fuel_price: '', toll_charges: '', other_expenses: '', driver_cost: '', trip_days: 1, overtime_allowance: '', vehicle_cost_type: '', vehicle_cost: '', b2c_billing: '', client_name: '' });

  const [endingTrip, setEndingTrip] = useState(null);
  const [endData, setEndData] = useState({ in_km: '' });

  const [driverForm, setDriverForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [vehicleForm, setVehicleForm] = useState({ vehicle_number: '', ownership_type: 'Third Party', emi: '' });

  const vehicleTypes = ["Tata Ace", "Intra", "Bolero Pickup", "Verro", "Bara Dast", "10' FT", "14' FT", "17' FT", "20' FT", "22' FT", "32' FT SXL", "32' FT MXL"];
  const activeStatuses = ['Waiting for Driver', 'Reported', 'Trip Started', 'Submitted for Review'];
  
  useEffect(() => { 
      fetchAllData(); 
      API.get('/users/me').then(res => {
          setMe(res.data);
          fetchWallet(res.data.id);
      }).catch(console.error);
  }, []);

  const fetchAllData = () => {
    API.get('/trips/').then(res => setTrips(res.data)).catch(console.error);
    API.get('/users/all').then(res => setUsers(res.data)).catch(console.error);
    API.get('/vendors_list/').then(res => setVendors(res.data.map(v => v.name))).catch(console.error);
    API.get('/clients_list/').then(res => setClients(res.data.map(c => c.name))).catch(console.error);
    API.get('/vehicles_list/').then(res => setVehicles(res.data)).catch(console.error);
  };

  const fetchWallet = (supId) => {
      API.get(`/wallet/${supId}`).then(res => setWallet(res.data)).catch(console.error);
      API.get(`/misc_expenses/${supId}`).then(res => setMiscExpenses(res.data)).catch(console.error);
  }

  const handleMiscSubmit = async (e) => {
      e.preventDefault();
      try {
          await API.post('/misc_expenses/', { amount: Number(newMisc.amount), description: newMisc.description, date: newMisc.date });
          setNewMisc({ amount: '', description: '', date: getCurrentDate() });
          fetchWallet(me.id); alert("Misc Expense Submitted for Approval!");
      } catch (err) { alert("Failed to submit."); }
  }

  const openExpenses = (trip) => {
    setExpenseTrip(trip); setExpTab('expenses');
    const assignedVehicle = vehicles.find(v => v.vehicle_number === trip.vehicle_number);
    let autoCostType = trip.vehicle_cost_type || '';
    let autoCost = trip.vehicle_cost || '';

    if (!trip.vehicle_cost_type && assignedVehicle) {
        if (assignedVehicle.ownership_type === 'Own Company') { autoCostType = 'Own Company'; autoCost = (assignedVehicle.emi / 30).toFixed(2); } 
        else { autoCostType = 'Third Party'; }
    }
    setExpData({ 
        fuel_litres: trip.fuel_litres || '', fuel_price: trip.fuel_price || '', toll_charges: trip.toll_charges || '', 
        other_expenses: trip.other_expenses || '', driver_cost: trip.driver_cost || '', trip_days: trip.trip_days || 1, 
        overtime_allowance: trip.overtime_allowance || '', vehicle_cost_type: autoCostType || 'Third Party', 
        vehicle_cost: autoCost, b2c_billing: trip.b2c_billing || '', client_name: trip.client_name || ''
    });
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try { 
      const payload = {}; 
      Object.keys(expData).forEach(k => {
          if (['vehicle_cost_type', 'client_name'].includes(k)) { payload[k] = expData[k] || (k === 'vehicle_cost_type' ? "Third Party" : ""); }
          else { payload[k] = Number(expData[k]) || 0; }
      });
      await API.patch(`/trips/${expenseTrip.id}/supervisor_expenses`, payload); 
      setExpenseTrip(null); fetchAllData(); fetchWallet(me.id);
    } catch (err) { alert("Failed to save. Ensure numbers are valid."); }
  };

  const liveCost = (Number(expData.fuel_litres)||0) * (Number(expData.fuel_price)||0) + (Number(expData.toll_charges)||0) + (Number(expData.other_expenses)||0) + (Number(expData.driver_cost)||0) + (Number(expData.overtime_allowance)||0) + (Number(expData.vehicle_cost)||0);
  const liveProfit = (Number(expData.b2c_billing)||0) - liveCost;

  const handleDispatch = async (e) => { e.preventDefault(); try { await API.post('/trips/', dispatchData); setDispatchData({ driver_id: '', vehicle_number: '', date: getCurrentDate() }); fetchAllData(); alert("Trip Dispatched!"); setActiveTab('trips'); } catch (err) { alert("Failed."); } };
  const handleShuffle = async (e) => { e.preventDefault(); try { await API.patch(`/trips/${shuffleTrip.id}/shuffle_vehicle`, { vehicle_number: shuffleVehicle }); setShuffleTrip(null); fetchAllData(); alert("Vehicle changed! Sent for Admin Approval."); } catch (err) { alert("Failed."); } };
  const handleReviewSubmit = async (e) => { e.preventDefault(); try { await API.patch(`/trips/${reviewTrip.id}/review`, reviewData); setReviewTrip(null); fetchAllData(); } catch (err) { alert("Error."); } };
  const handleEndTrip = async (e) => { e.preventDefault(); if (Number(endData.in_km) <= endingTrip.out_km) { alert(`Stop KM must be higher than Starting KM (${endingTrip.out_km}).`); return; } try { await API.patch(`/trips/${endingTrip.id}/end`, { in_time: getCurrentTime(), in_km: Number(endData.in_km) }); setEndingTrip(null); fetchAllData(); } catch (err) { alert("Error."); } };
  const handleCreateDriver = async (e) => { e.preventDefault(); try { await API.post('/users/driver', { ...driverForm, role: 'driver' }); alert("Created!"); setDriverForm({ username: '', password: '', name: '', phone: '' }); fetchAllData(); } catch (err) { alert("Error."); } };
  const handleAddVehicle = async (e) => { e.preventDefault(); try { await API.post('/vehicles_list/', { vehicle_number: vehicleForm.vehicle_number.replace(/\s+/g, '').toUpperCase(), ownership_type: vehicleForm.ownership_type, emi: Number(vehicleForm.emi) || 0 }); setVehicleForm({ vehicle_number: '', ownership_type: 'Third Party', emi: '' }); fetchAllData(); alert("Vehicle Added!"); } catch (err) { alert("Error."); } };
  const handleDeleteVehicle = async (id) => { if (window.confirm("Delete vehicle?")) { try { await API.delete(`/vehicles_list/${id}`); fetchAllData(); } catch(err) { alert("Failed."); } } };

  const getDriverName = (driverId) => { const driver = users.find(u => u.id === driverId); return driver ? driver.name : 'Unknown'; };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6">Supervisor Dispatch Center</h2>
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl inline-flex">
        <button onClick={() => setActiveTab('availability')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'availability' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Availability Board</button>
        <button onClick={() => setActiveTab('dispatch')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'dispatch' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Dispatch New Trip</button>
        <button onClick={() => setActiveTab('trips')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'trips' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Manage Trips</button>
        <button onClick={() => setActiveTab('wallet')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'wallet' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>My Wallet</button>
        <button onClick={() => setActiveTab('drivers')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'drivers' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Add Driver</button>
        <button onClick={() => setActiveTab('vehicles')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vehicles' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`}>Manage Vehicles</button>
      </div>

      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <h3 className="text-2xl font-black text-emerald-800 mb-6">Current Balance: ₹{wallet.current_balance}</h3>
                <div className="space-y-4 text-sm font-bold text-slate-600">
                    <div className="flex justify-between bg-slate-50 p-3 rounded-lg border"><span>Total Funded by Admin:</span><span className="text-indigo-600">₹{wallet.total_funded}</span></div>
                    <div className="flex justify-between bg-slate-50 p-3 rounded-lg border"><span>Spent on Trip Expenses:</span><span className="text-rose-600">₹{wallet.total_trip_expenses}</span></div>
                    <div className="flex justify-between bg-slate-50 p-3 rounded-lg border"><span>Spent on Misc Expenses:</span><span className="text-rose-600">₹{wallet.total_misc_expenses}</span></div>
                </div>

                <form onSubmit={handleMiscSubmit} className="mt-8 border-t pt-6 space-y-4">
                    <h4 className="text-lg font-bold text-slate-800">Raise Misc Expense</h4>
                    <InputField label="Amount (₹)" type="number" value={newMisc.amount} onChange={e=>setNewMisc({...newMisc, amount: e.target.value})} />
                    <InputField label="Description" value={newMisc.description} onChange={e=>setNewMisc({...newMisc, description: e.target.value})} placeholder="E.g., Vehicle Repair" />
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700">Submit for Approval</button>
                </form>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <h3 className="text-xl font-bold mb-4">Misc Expenses History</h3>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {miscExpenses.map(exp => (
                        <div key={exp.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-slate-800 text-lg">₹{exp.amount}</div>
                                <div className="text-xs text-slate-500">{exp.description} ({exp.date})</div>
                            </div>
                            <StatusBadge status={exp.status === 'Approved' ? 'Billed / Completed' : exp.status === 'Rejected' ? 'Pending Approval' : 'Waiting for Driver'} />
                        </div>
                    ))}
                    {miscExpenses.length === 0 && <div className="text-slate-500 italic">No misc expenses raised.</div>}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
            <h3 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-800">🧑‍✈️ My Drivers</h3>
            <div className="space-y-3">
              {users.filter(u=>u.role==='driver').map(d => {
                const activeTrip = trips.find(t => t.driver_id === d.id && activeStatuses.includes(t.status));
                return (
                  <div key={d.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">{d.name}</div>
                    {activeTrip ? <div className="text-xs font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-full">Busy (#{activeTrip.id})</div> : <div className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Available</div>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
            <h3 className="text-xl font-bold border-b pb-2 mb-4 text-sky-800">🚛 System Vehicles</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {vehicles.map(v => {
                const activeTrip = trips.find(t => t.vehicle_number === v.vehicle_number && activeStatuses.includes(t.status));
                return (
                  <div key={v.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800">{v.vehicle_number} <span className="text-xs font-normal text-slate-500 block">{v.ownership_type}</span></div>
                    {activeTrip ? <div className="text-xs font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-full">Busy (#{activeTrip.id})</div> : <div className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Available</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
            <button type="submit" className="w-full bg-sky-600 text-white py-4 rounded-xl font-bold mt-4 shadow-lg shadow-sky-600/30">Dispatch to Driver</button>
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
                    <div className="flex gap-2 flex-wrap">
                      {['Waiting for Driver'].includes(trip.status) && (<button onClick={() => { setShuffleTrip(trip); setShuffleVehicle(''); }} className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 text-xs shadow-sm">Shuffle Vehicle</button>)}
                      
                      {/* NEW: Expenses unlocked immediately! */}
                      {['Waiting for Driver', 'Reported', 'Trip Started', 'Completed', 'Submitted for Review'].includes(trip.status) && (
                         <button onClick={() => openExpenses(trip)} className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-200 text-xs shadow-sm">Expenses</button>
                      )}

                      {!['Pending Approval', 'Pending for Admin Final Review', 'Billed / Completed'].includes(trip.status) && (
                         <button onClick={() => { setReviewTrip(trip); setReviewData({ vehicle_type: trip.vehicle_type || '', vehicle_mode: trip.vehicle_mode || '', body_type: trip.body_type || '', vendor_name: trip.vendor_name || '', helper_name: trip.helper_name || '', client_name: trip.client_name || '', source: trip.source || '', destination: trip.destination || '', vehicle_sourced_from: trip.vehicle_sourced_from || '' }); }} className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg font-bold hover:bg-sky-200 text-xs shadow-sm">Review Details</button>
                      )}
                      
                      {['Pending for Admin Final Review', 'Billed / Completed'].includes(trip.status) && (<button onClick={() => setViewingTrip(trip)} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 text-xs shadow-sm">Details</button>)}
                      {['Trip Started', 'Submitted for Review'].includes(trip.status) && (<button onClick={() => { setEndingTrip(trip); setEndData({ in_km: '' }); }} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 text-xs shadow-sm">Log Arrival</button>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ALL MODALS (Review, Expenses, Log Arrival, etc.) GO HERE EXACTLY AS THEY WERE PREVIOUSLY */}
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
                    <InputField label="Driver Base Cost" type="number" value={expData.driver_cost} onChange={e => setExpData({...expData, driver_cost: e.target.value})} />
                    <InputField label="Trip Days" type="number" value={expData.trip_days} onChange={e => setExpData({...expData, trip_days: e.target.value})} />
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
                  <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 space-y-4">
                    <SelectField label="Select Target Client" value={expData.client_name} onChange={e => setExpData({...expData, client_name: e.target.value})} options={clients} />
                    <InputField label="B2C (Bill to Company) Revenue" type="number" value={expData.b2c_billing} onChange={e => setExpData({...expData, b2c_billing: e.target.value})} />
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 border-t pt-6">
                    <div className="flex-1 bg-slate-100 p-4 rounded-xl text-center"><div className="text-xs font-bold text-slate-500">TOTAL EXPENSES</div><div className="text-2xl font-black text-rose-600">₹{liveCost}</div></div>
                    <div className="flex-1 bg-slate-100 p-4 rounded-xl text-center"><div className="text-xs font-bold text-slate-500">B2C BILLING</div><div className="text-2xl font-black text-indigo-600">₹{Number(expData.b2c_billing) || 0}</div></div>
                    <div className={`flex-1 p-4 rounded-xl text-center ${liveProfit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}><div className={`text-xs font-bold ${liveProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>PROFIT</div><div className={`text-2xl font-black ${liveProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{liveProfit}</div></div>
                  </div>
                </div>
              )}
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setExpenseTrip(null)} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-sky-600 text-white py-4 rounded-xl font-bold">
                  {['Completed', 'Submitted for Review'].includes(expenseTrip.status) ? "Submit to Admin for Billing" : "Save Expenses (Trip Running)"}
                </button>
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
              <InputField label="Vehicle Sourced From" value={reviewData.vehicle_sourced_from} onChange={e => setReviewData({...reviewData, vehicle_sourced_from: e.target.value})} placeholder="E.g., Name/Company" />
              
              <div className="col-span-1 md:col-span-2 mt-2 font-bold text-sky-800 border-b pb-2">Client Details</div>
              <SelectField label="Select Client" value={reviewData.client_name} onChange={e => setReviewData({...reviewData, client_name: e.target.value})} options={clients} />
              <InputField label="Source (From)" value={reviewData.source} onChange={e => setReviewData({...reviewData, source: e.target.value})} />
              <InputField label="Destination (To)" value={reviewData.destination} onChange={e => setReviewData({...reviewData, destination: e.target.value})} />
              <InputField label="Helper Name" value={reviewData.helper_name} onChange={e => setReviewData({...reviewData, helper_name: e.target.value})} />
              
              <div className="col-span-1 md:col-span-2 flex gap-4 mt-6">
                <button type="button" onClick={() => setReviewTrip(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 bg-sky-600 text-white py-3 rounded-xl font-bold">
                  {['Completed'].includes(reviewTrip.status) ? "Submit Details for Review" : "Save Details (Trip Running)"}
                </button>
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

      {viewingTrip && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold">Details (#{viewingTrip.id})</h3><button onClick={() => setViewingTrip(null)} className="text-slate-400 font-bold bg-slate-100 p-2 rounded-full">✕</button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailItem label="Vehicle" value={viewingTrip.vehicle_number} />
              <DetailItem label="Vehicle Type" value={viewingTrip.vehicle_type} />
              <DetailItem label="Mode" value={viewingTrip.vehicle_mode} />
              <DetailItem label="Vendor" value={viewingTrip.vendor_name} />
              <DetailItem label="Sourced From" value={viewingTrip.vehicle_sourced_from} />
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
        </div>
      )}
    </div>
  );
}