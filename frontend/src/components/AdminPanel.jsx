import React, { useState, useEffect } from 'react';
import API from '../api';
import { InputField, SelectField, DetailItem, StatusBadge, getCurrentDate } from './SharedUI';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [billingTrip, setBillingTrip] = useState(null);
  const [editDetailsTrip, setEditDetailsTrip] = useState(null);
  const [editDetailsData, setEditDetailsData] = useState({ vehicle_type: '', vehicle_mode: '', body_type: '', vendor_name: '', helper_name: '', client_name: '', source: '', destination: '', vehicle_sourced_from: '', pod_link: '' });
  const [viewingTrip, setViewingTrip] = useState(null);
  const [viewDriverDetails, setViewDriverDetails] = useState(null); 

  const [walletSup, setWalletSup] = useState(null);
  const [walletData, setWalletData] = useState({ total_funded: 0, total_trip_expenses: 0, total_misc_expenses: 0, current_balance: 0 });
  const [miscExpenses, setMiscExpenses] = useState([]);
  const [walletFunds, setWalletFunds] = useState([]); 
  const [newFund, setNewFund] = useState({ amount: '', medium: 'Cash' });

  const vehicleTypes = ["Tata Ace", "Intra", "Bolero Pickup", "Verro", "Bara Dast", "10' FT", "14' FT", "17' FT", "20' FT", "22' FT", "32' FT SXL", "32' FT MXL"];
  const activeStatuses = ['Waiting for Driver', 'Reported', 'Trip Started', 'Submitted for Review'];

  const [billData, setBillData] = useState({ fuel_litres: '', fuel_price: '', toll_charges: '', other_expenses: '', driver_cost: '', trip_days: 1, overtime_allowance: '', advance_paid: '', vehicle_cost_type: '', vehicle_cost: '', b2c_billing: '', client_name: '' });
  
  const [supForm, setSupForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [vendorName, setVendorName] = useState('');
  const [clientName, setClientName] = useState('');
  const [vehicleForm, setVehicleForm] = useState({ vehicle_number: '', ownership_type: 'Third Party', emi: '' });

  useEffect(() => { fetchAllData(); }, [startDate, endDate]);
  
  const fetchAllData = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    API.get(`/trips/?${params.toString()}`).then(res => setTrips(res.data)).catch(console.error);
    API.get('/users/all').then(res => setUsers(res.data)).catch(console.error);
    API.get('/vendors_list/').then(res => setVendors(res.data)).catch(console.error);
    API.get('/clients_list/').then(res => setClients(res.data)).catch(console.error);
    API.get('/vehicles_list/').then(res => setVehicles(res.data)).catch(console.error);
  };

  const handleApprove = async (id) => { try { await API.patch(`/trips/${id}/approve`); fetchAllData(); } catch (err) { alert("Error."); } };

  const openWalletModal = (sup) => {
      setWalletSup(sup);
      API.get(`/wallet/${sup.id}`).then(res => setWalletData(res.data)).catch(console.error);
      API.get(`/misc_expenses/${sup.id}`).then(res => setMiscExpenses(res.data)).catch(console.error);
      API.get(`/funds/${sup.id}`).then(res => setWalletFunds(res.data)).catch(console.error);
  };

  const handleFundSubmit = async (e) => {
      e.preventDefault();
      try {
          await API.post('/funds/', { supervisor_id: walletSup.id, amount: Number(newFund.amount), date: new Date().toISOString(), medium: newFund.medium });
          setNewFund({ amount: '', medium: 'Cash' });
          openWalletModal(walletSup); 
      } catch (err) { alert("Error adding funds."); }
  }

  const handleMiscStatus = async (expId, status) => {
      try { await API.patch(`/misc_expenses/${expId}/status`, { status }); openWalletModal(walletSup); } catch (err) { alert("Error updating status"); }
  }

  const openBillingModal = (trip) => {
    setBillingTrip(trip);
    setBillData({
      fuel_litres: trip.fuel_litres || '', fuel_price: trip.fuel_price || '', toll_charges: trip.toll_charges || '', other_expenses: trip.other_expenses || '', driver_cost: trip.driver_cost || '', trip_days: trip.trip_days || 1, overtime_allowance: trip.overtime_allowance || '', advance_paid: trip.advance_paid || '', vehicle_cost_type: trip.vehicle_cost_type || 'Third Party', vehicle_cost: trip.vehicle_cost || '', b2c_billing: trip.b2c_billing || '', client_name: trip.client_name || ''
    });
  };

  const handleBillSubmit = async (e) => { 
    e.preventDefault(); 
    try { 
      const payload = {}; 
      Object.keys(billData).forEach(k => { 
        if (['vehicle_cost_type', 'client_name'].includes(k)) { 
          payload[k] = billData[k] || (k === 'vehicle_cost_type' ? "Third Party" : ""); 
        } else { 
          payload[k] = Number(billData[k]) || 0; 
        } 
      }); 
      await API.patch(`/trips/${billingTrip.id}/finalize`, payload); 
      setBillingTrip(null); 
      fetchAllData(); 
    } catch (err) { alert("Failed to finalize. Ensure all numbers are valid."); } 
  };
  
  const handleEditDetailsSubmit = async (e) => { e.preventDefault(); try { await API.patch(`/trips/${editDetailsTrip.id}/admin_edit`, editDetailsData); setEditDetailsTrip(null); fetchAllData(); } catch (err) { alert("Failed."); } };
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

  const clientStats = {};
  const vendorStats = {};
  trips.filter(t => t.status === 'Billed / Completed' || t.status === 'Pending for Admin Final Review').forEach(t => {
      const cName = t.client_name || 'Unassigned';
      if(!clientStats[cName]) clientStats[cName] = { rev: 0, cost: 0, profit: 0, trips: 0 };
      clientStats[cName].rev += t.b2c_billing; clientStats[cName].cost += t.total_running_cost; clientStats[cName].profit += t.profit; clientStats[cName].trips += 1;

      const vName = t.vendor_name || 'Unassigned';
      if(!vendorStats[vName]) vendorStats[vName] = { rev: 0, cost: 0, profit: 0, trips: 0 };
      vendorStats[vName].rev += t.b2c_billing; vendorStats[vName].cost += t.total_running_cost; vendorStats[vName].profit += t.profit; vendorStats[vName].trips += 1;
  });

  const handleGeneratePDF = (trip) => {
    const driverName = getDriverName(trip.driver_id);
    const supervisorName = getSupervisorName(trip.supervisor_id);
    const fuelCost = (trip.fuel_litres * trip.fuel_price).toFixed(2);
    
    const invoiceHTML = `
      <html>
        <head>
          <title>Invoice - Trip #${trip.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #0284c7; font-size: 32px; font-weight: 900; letter-spacing: 1px; }
            .header p { color: #64748b; margin-top: 5px; font-weight: bold; }
            .section-title { font-size: 18px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; }
            .details-table, .financial-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
            .details-table th, .details-table td, .financial-table th, .financial-table td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            .details-table th { background-color: #f8fafc; color: #475569; width: 25%; }
            .financial-table th { background-color: #f0f9ff; color: #0369a1; }
            .total-row td { font-weight: bold; background-color: #f1f5f9; font-size: 16px; }
            .profit-row td { font-weight: bold; background-color: #ecfdf5; color: #047857; font-size: 18px; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TMS ENTERPRISE</h1>
            <p>Official Trip Invoice & Logistics Manifest</p>
          </div>
          <h3 class="section-title">Trip Overview (ID: #${trip.id})</h3>
          <table class="details-table">
            <tr><th>Date</th><td>${trip.date}</td><th>Client</th><td>${trip.client_name || 'N/A'}</td></tr>
            <tr><th>Vehicle</th><td>${trip.vehicle_number} (${trip.vehicle_type || 'N/A'})</td><th>Mode</th><td>${trip.vehicle_mode || 'N/A'}</td></tr>
            <tr><th>Source</th><td>${trip.source || 'N/A'}</td><th>Destination</th><td>${trip.destination || 'N/A'}</td></tr>
            <tr><th>Driver</th><td>${driverName}</td><th>Supervisor</th><td>${supervisorName}</td></tr>
            <tr><th>Distance Details</th><td colspan="3">${trip.in_km - trip.out_km} KM Total (Start: ${trip.out_km} KM | End: ${trip.in_km} KM)</td></tr>
          </table>
          <h3 class="section-title">Financial Breakdown</h3>
          <table class="financial-table">
            <tr><th>Expense Category</th><th>Amount (INR)</th></tr>
            <tr><td>Fuel Cost (${trip.fuel_litres}L @ ₹${trip.fuel_price})</td><td>₹${fuelCost}</td></tr>
            <tr><td>Toll Charges</td><td>₹${trip.toll_charges}</td></tr>
            <tr><td>Driver Cost (${trip.trip_days} Days)</td><td>₹${trip.driver_cost}</td></tr>
            <tr><td>Overtime Paid</td><td>₹${trip.overtime_allowance}</td></tr>
            <tr><td>Advance Paid (Kharcha Deducted)</td><td>₹${trip.advance_paid}</td></tr>
            <tr><td>Vehicle Cost (${trip.vehicle_cost_type || 'Third Party'})</td><td>₹${trip.vehicle_cost}</td></tr>
            <tr><td>Other Misc. Expenses</td><td>₹${trip.other_expenses}</td></tr>
            <tr class="total-row"><td>Total Running Cost</td><td>₹${trip.total_running_cost}</td></tr>
          </table>
          <h3 class="section-title">Final Billing Summary</h3>
          <table class="financial-table">
            <tr><th>B2C Revenue (Billed to Client)</th><td>₹${trip.b2c_billing}</td></tr>
            <tr class="profit-row"><td>Net Profit Contribution</td><td>₹${trip.profit}</td></tr>
          </table>
          <div class="footer"><p>Generated by TMS Enterprise System on ${new Date().toLocaleString()}</p></div>
        </body>
      </html>
    `;
    const pdfWindow = window.open('', '_blank');
    pdfWindow.document.write(invoiceHTML);
    pdfWindow.document.close();
    setTimeout(() => { pdfWindow.print(); }, 250); 
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto backdrop-blur-sm bg-gray-200/90 rounded-3xl shadow-2xl border border-gray-300">
      <h2 className="text-3xl font-extrabold mb-6 text-white drop-shadow-md">Master Admin Dashboard</h2>
      <div className="flex flex-wrap gap-2 mb-6 bg-gray-300/80 p-1.5 rounded-xl inline-flex border border-gray-400/50 shadow-inner">
        <button onClick={() => setActiveTab('attendance')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'attendance' ? 'bg-gray-200 text-indigo-700 shadow-sm border border-gray-300' : 'text-gray-600 hover:bg-gray-300'}`}>Attendance & Payroll</button>
        <button onClick={() => setActiveTab('availability')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'availability' ? 'bg-gray-200 text-indigo-700 shadow-sm border border-gray-300' : 'text-gray-600 hover:bg-gray-300'}`}>Availability & Fleet</button>
        <button onClick={() => setActiveTab('approvals')} className={`px-5 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-gray-200 text-orange-600 shadow-sm border border-gray-300' : 'text-gray-600 hover:bg-gray-300'}`}>Approvals {pendingCount > 0 && <span className="bg-orange-500 text-gray-200 rounded-full px-2 py-0.5 text-xs">{pendingCount}</span>}</button>
        <button onClick={() => setActiveTab('trips')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'trips' ? 'bg-gray-200 text-sky-700 shadow-sm border border-gray-300' : 'text-gray-600 hover:bg-gray-300'}`}>Financial Billing</button>
        <button onClick={() => setActiveTab('reports')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'reports' ? 'bg-gray-200 text-emerald-700 shadow-sm border border-gray-300' : 'text-gray-600 hover:bg-gray-300'}`}>Profit Reports</button>
        <button onClick={() => setActiveTab('supervisors')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'supervisors' ? 'bg-gray-200 text-sky-700 shadow-sm border border-gray-300' : 'text-gray-600 hover:bg-gray-300'}`}>Supervisors & Wallets</button>
        <button onClick={() => setActiveTab('clients')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'clients' ? 'bg-gray-200 text-sky-700 shadow-sm border border-gray-300' : 'text-gray-600 hover:bg-gray-300'}`}>Clients</button>
        <button onClick={() => setActiveTab('vendors')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vendors' ? 'bg-gray-200 text-sky-700 shadow-sm border border-gray-300' : 'text-gray-600 hover:bg-gray-300'}`}>Vendors</button>
        <button onClick={() => setActiveTab('vehicles')} className={`px-5 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'vehicles' ? 'bg-gray-200 text-sky-700 shadow-sm border border-gray-300' : 'text-gray-600 hover:bg-gray-300'}`}>Vehicles</button>
      </div>

      {activeTab === 'attendance' && (
        <div className="bg-gray-200/95 p-6 rounded-2xl shadow-xl border border-gray-400">
          <h3 className="text-xl font-bold mb-6 border-b border-gray-400 pb-2 text-gray-900">Driver Attendance & Payroll</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-300 border-b border-gray-400">
                <tr><th className="p-4 text-gray-800">Driver Details</th><th className="p-4 text-gray-800">Total Trips</th><th className="p-4 text-gray-800">Unique Days</th><th className="p-4 text-gray-800">Base Cost</th><th className="p-4 text-gray-800">Overtime</th><th className="p-4 text-orange-700">Advance Given</th><th className="p-4 text-emerald-700 text-lg">Net Payable</th><th className="p-4">Action</th></tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === 'driver').map(driver => {
                  const driverTrips = trips.filter(t => t.driver_id === driver.id && t.status !== 'Pending Approval');
                  const uniqueDates = new Set(driverTrips.map(t => t.date));
                  const totalTrips = driverTrips.length;
                  const totalDriverCost = driverTrips.reduce((sum, t) => sum + (t.driver_cost || 0), 0);
                  const totalOvertime = driverTrips.reduce((sum, t) => sum + (t.overtime_allowance || 0), 0);
                  const totalAdvance = driverTrips.reduce((sum, t) => sum + (t.advance_paid || 0), 0);
                  const netPayable = totalDriverCost + totalOvertime - totalAdvance;
                  
                  return (
                    <tr key={driver.id} className="border-b border-gray-400 hover:bg-gray-300/50 transition-colors">
                      <td className="p-4 font-bold text-indigo-700">{driver.name} <span className="text-xs text-gray-600 block font-semibold mt-1">📞 {driver.phone || 'No Phone'}</span></td>
                      <td className="p-4 font-bold text-gray-900">{totalTrips}</td>
                      <td className="p-4 font-bold text-sky-700">{uniqueDates.size} Days</td>
                      <td className="p-4 font-semibold text-gray-700">₹{totalDriverCost}</td>
                      <td className="p-4 text-amber-600 font-bold">₹{totalOvertime}</td>
                      <td className="p-4 text-orange-600 font-bold">₹{totalAdvance}</td>
                      <td className="p-4 text-emerald-700 font-black text-lg">₹{netPayable}</td>
                      <td className="p-4"><button onClick={() => setViewDriverDetails(driver)} className="bg-sky-200 text-sky-800 px-3 py-1.5 rounded-lg font-bold hover:bg-sky-300 text-xs shadow-sm">Ledger</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewDriverDetails && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex overflow-y-auto p-4 sm:p-8">
          <div className="bg-gray-200 p-8 rounded-3xl w-full max-w-6xl m-auto shadow-2xl border border-gray-400 relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Payroll Ledger for {viewDriverDetails.name}</h3>
                <button onClick={() => setViewDriverDetails(null)} className="text-gray-500 font-bold bg-gray-300 p-2 rounded-full hover:bg-gray-400">✕</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-300 border-b border-gray-400"><tr><th className="p-3">Date</th><th className="p-3">Vehicle</th><th className="p-3">Route (KM)</th><th className="p-3">Base Cost</th><th className="p-3">Overtime</th><th className="p-3 text-orange-700">Advance</th><th className="p-3 text-emerald-700">Net Added</th><th className="p-3">Status</th></tr></thead>
                    <tbody>
                        {trips.filter(t => t.driver_id === viewDriverDetails.id && t.status !== 'Pending Approval').map(t => {
                            const tripNet = (t.driver_cost || 0) + (t.overtime_allowance || 0) - (t.advance_paid || 0);
                            return (
                                <tr key={t.id} className="border-b border-gray-400">
                                    <td className="p-3 font-semibold text-gray-700">{t.date}</td>
                                    <td className="p-3 font-bold text-gray-900">{t.vehicle_number}</td>
                                    <td className="p-3 text-gray-800">{t.in_km - t.out_km} km</td>
                                    <td className="p-3 font-bold text-sky-600">₹{t.driver_cost || 0}</td>
                                    <td className="p-3 font-bold text-amber-600">₹{t.overtime_allowance || 0}</td>
                                    <td className="p-3 font-bold text-orange-600">₹{t.advance_paid || 0}</td>
                                    <td className="p-3 font-bold text-emerald-600">₹{tripNet}</td>
                                    <td className="p-3"><StatusBadge status={t.status} /></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-200/95 p-6 rounded-2xl shadow-xl border border-gray-400">
            <h3 className="text-xl font-bold border-b border-gray-400 pb-2 mb-4 text-emerald-800">🏢 Client Profitability Analytics</h3>
            <div className="space-y-4">
              {Object.keys(clientStats).map(c => {
                  const maxRev = Math.max(...Object.values(clientStats).map(st => st.rev), 1);
                  const stat = clientStats[c];
                  const margin = stat.rev > 0 ? ((stat.profit / stat.rev) * 100).toFixed(1) : 0;
                  return (
                      <div key={c} className="bg-gray-300 p-4 rounded-xl border border-gray-400 shadow-sm">
                          <div className="font-bold text-lg text-gray-900 mb-2">{c} <span className="text-sm font-normal text-gray-600">({stat.trips} Trips)</span></div>
                          <div className="flex justify-between text-sm font-bold mb-1">
                              <span className="text-indigo-600">Rev: ₹{stat.rev}</span>
                              <span className="text-orange-600">Cost: ₹{stat.cost}</span>
                              <span className="text-emerald-600">Profit: ₹{stat.profit}</span>
                          </div>
                          <div className="w-full bg-gray-400 rounded-full h-2 mt-2 overflow-hidden">
                              <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.max((stat.rev / maxRev) * 100, 5)}%` }}></div>
                          </div>
                          <div className="text-xs text-gray-700 mt-1.5 font-semibold tracking-wide">Profit Margin: {margin}%</div>
                      </div>
                  )
              })}
              {Object.keys(clientStats).length === 0 && <div className="text-gray-600 italic">No billed trips yet.</div>}
            </div>
          </div>
          
          <div className="bg-gray-200/95 p-6 rounded-2xl shadow-xl border border-gray-400">
            <h3 className="text-xl font-bold border-b border-gray-400 pb-2 mb-4 text-amber-800">🤝 Vendor Logistics</h3>
            <div className="space-y-4">
              {Object.keys(vendorStats).map(v => (
                  <div key={v} className="bg-gray-300 p-4 rounded-xl border border-gray-400 shadow-sm">
                      <div className="font-bold text-lg text-gray-900 mb-2">{v} <span className="text-sm font-normal text-gray-600">({vendorStats[v].trips} Trips)</span></div>
                      <div className="flex justify-between text-sm font-bold">
                          <span className="text-indigo-600">Rev: ₹{vendorStats[v].rev}</span>
                          <span className="text-orange-600">Cost: ₹{vendorStats[v].cost}</span>
                          <span className="text-emerald-600">Profit: ₹{vendorStats[v].profit}</span>
                      </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-200/95 p-6 rounded-2xl shadow-xl border border-gray-400">
            <h3 className="text-xl font-bold border-b border-gray-400 pb-2 mb-4 text-indigo-800">🧑‍✈️ Driver Status</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {users.filter(u=>u.role==='driver').map(d => {
                const activeTrip = trips.find(t => t.driver_id === d.id && activeStatuses.includes(t.status));
                return (
                  <div key={d.id} className="flex justify-between items-center bg-gray-300 p-3 rounded-lg border border-gray-400 shadow-sm">
                    <div className="font-bold text-gray-900">{d.name} <span className="text-xs font-normal block text-gray-600">Under: {getSupervisorName(d.supervisor_id)}</span></div>
                    {activeTrip ? <div className="text-xs font-bold text-orange-600 bg-orange-200 px-3 py-1 rounded-full">Busy (#{activeTrip.id})</div> : <div className="text-xs font-bold text-emerald-600 bg-emerald-200 px-3 py-1 rounded-full">Available</div>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-gray-200/95 p-6 rounded-2xl shadow-xl border border-gray-400">
            <h3 className="text-xl font-bold border-b border-gray-400 pb-2 mb-4 text-sky-800">🚛 Vehicle Status & EMI</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {vehicles.map(v => {
                const activeTrip = trips.find(t => t.vehicle_number === v.vehicle_number && activeStatuses.includes(t.status));
                const recovered = trips.filter(t => t.vehicle_number === v.vehicle_number && t.vehicle_cost_type === 'Own Company').reduce((s, t) => s + (t.vehicle_cost || 0), 0);
                const left = Math.max(0, v.emi - recovered);
                return (
                  <div key={v.id} className="flex flex-col bg-gray-300 p-3 rounded-lg border border-gray-400 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-gray-900">{v.vehicle_number} <span className="text-xs font-normal text-gray-600 block">{v.ownership_type}</span></div>
                        {activeTrip ? <div className="text-xs font-bold text-orange-600 bg-orange-200 px-3 py-1 rounded-full">Busy (#{activeTrip.id})</div> : <div className="text-xs font-bold text-emerald-600 bg-emerald-200 px-3 py-1 rounded-full">Available</div>}
                    </div>
                    {v.ownership_type === 'Own Company' && (
                        <div className="flex justify-between text-xs font-bold bg-gray-200 p-2 border border-gray-400 rounded mt-1">
                            <span className="text-gray-600">EMI: ₹{v.emi}</span>
                            <span className="text-emerald-600">Recovered: ₹{recovered.toFixed(0)}</span>
                            <span className="text-orange-600">Left: ₹{left.toFixed(0)}</span>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-gray-200/95 rounded-2xl shadow-xl border border-gray-400 overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-300 border-b border-gray-400"><tr><th className="p-4 text-gray-800">ID</th><th className="p-4 text-gray-800">Personnel</th><th className="p-4 text-gray-800">Assigned Vehicle</th><th className="p-4 text-gray-800">Status</th><th className="p-4 text-gray-800">Action</th></tr></thead>
            <tbody>
              {trips.filter(t => t.status === 'Pending Approval').map(trip => (
                <tr key={trip.id} className="border-b border-gray-400 hover:bg-gray-300/50">
                  <td className="p-4 font-bold text-gray-900">#{trip.id}</td>
                  <td className="p-4"><span className="font-bold text-gray-900 block">D: {getDriverName(trip.driver_id)}</span><span className="text-gray-600 text-xs">S: {getSupervisorName(trip.supervisor_id)}</span></td>
                  <td className="p-4 font-bold text-sky-600">{trip.vehicle_number}</td>
                  <td className="p-4"><StatusBadge status={trip.status} /></td>
                  <td className="p-4"><button onClick={() => handleApprove(trip.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-600">Approve Trip</button></td>
                </tr>
              ))}
              {pendingCount === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-600 italic">No trips waiting for approval.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="bg-gray-200/95 p-6 rounded-2xl shadow-xl border border-gray-400 overflow-x-auto">
          <div className="flex flex-wrap gap-4 mb-4 bg-gray-300 p-4 rounded-xl border border-gray-400 items-end shadow-inner">
             <div className="flex-1 min-w-[200px]"><InputField type="date" label="Filter Start Date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></div>
             <div className="flex-1 min-w-[200px]"><InputField type="date" label="Filter End Date" value={endDate} onChange={e=>setEndDate(e.target.value)} /></div>
             <button onClick={() => {setStartDate(''); setEndDate('');}} className="bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-500 shadow-sm">Clear Filter</button>
          </div>

          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-300 border-b border-gray-400">
              <tr><th className="p-4">ID</th><th className="p-4">Date</th><th className="p-4">Personnel</th><th className="p-4">Vehicle & Vendor</th><th className="p-4">POD</th><th className="p-4">Status</th><th className="p-4">Profit</th><th className="p-4">Action</th></tr>
            </thead>
            <tbody>
              {trips.filter(t => t.status !== 'Pending Approval').map(trip => (
                <tr key={trip.id} className="border-b border-gray-400 hover:bg-gray-300/50">
                  <td className="p-4 font-bold text-gray-900">#{trip.id}</td>
                  <td className="p-4 font-semibold text-gray-700">{trip.date}</td>
                  <td className="p-4">
                    <span className="font-bold text-gray-900 block">D: {getDriverName(trip.driver_id)}</span>
                    <span className="text-gray-600 text-xs">S: {getSupervisorName(trip.supervisor_id)}</span>
                  </td>
                  <td className="p-4 text-gray-800">{trip.vehicle_number} <span className="block text-gray-600 text-xs">{trip.vendor_name || 'Unassigned'}</span></td>
                  <td className="p-4">
                      {trip.pod_link ? <a href={trip.pod_link} target="_blank" className="text-sky-600 hover:underline font-bold">View Document</a> : <span className="text-gray-500 text-xs">Missing</span>}
                  </td>
                  <td className="p-4"><StatusBadge status={trip.status} /></td>
                  <td className="p-4 font-black text-emerald-600">₹{trip.profit || 0}</td>
                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setViewingTrip(trip)} className="bg-gray-400 text-gray-900 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-500 text-xs shadow-sm">View Log</button>
                      
                      {(['Pending for Admin Final Review', 'Billed / Completed'].includes(trip.status)) && (
                         <>
                           <button onClick={() => { setEditDetailsTrip(trip); setEditDetailsData({ vehicle_type: trip.vehicle_type || '', vehicle_mode: trip.vehicle_mode || '', body_type: trip.body_type || '', vendor_name: trip.vendor_name || '', helper_name: trip.helper_name || '', client_name: trip.client_name || '', source: trip.source || '', destination: trip.destination || '', vehicle_sourced_from: trip.vehicle_sourced_from || '', pod_link: trip.pod_link || '' }); }} className="bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-300 text-xs shadow-sm">Edit Details</button>
                           <button onClick={() => openBillingModal(trip)} className="bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-300 text-xs shadow-sm">{trip.status === 'Billed / Completed' ? 'Edit Finances' : 'Finalize Bill'}</button>
                         </>
                      )}
                      
                      {trip.status === 'Billed / Completed' && (
                        <button onClick={() => handleGeneratePDF(trip)} className="bg-orange-200 text-orange-800 px-3 py-1.5 rounded-lg font-bold hover:bg-orange-300 text-xs shadow-sm flex items-center gap-1">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Download PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {billingTrip && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex overflow-y-auto p-4 sm:p-8">
          <div className="bg-gray-200 p-8 rounded-3xl w-full max-w-5xl m-auto shadow-2xl border border-gray-400 relative">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Financial Reconciliation (#{billingTrip.id})</h3>
            
            <div className="bg-gray-300 p-5 rounded-2xl border border-gray-400 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm shadow-inner">
                <div className="col-span-2 md:col-span-4 border-b border-gray-400 pb-2 mb-2 font-black text-gray-800 uppercase tracking-wider">Trip Summary (Provided by Supervisor)</div>
                <DetailItem label="Driver" value={getDriverName(billingTrip.driver_id)} />
                <DetailItem label="Vehicle & Type" value={`${billingTrip.vehicle_number} (${billingTrip.vehicle_type || 'N/A'})`} />
                <DetailItem label="Vendor" value={billingTrip.vendor_name} />
                <DetailItem label="Sourced From" value={billingTrip.vehicle_sourced_from} />
                <DetailItem label="Client" value={billingTrip.client_name} />
                <DetailItem label="Route" value={`${billingTrip.source || 'N/A'} -> ${billingTrip.destination || 'N/A'}`} />
                <DetailItem label="Total Distance" value={`${billingTrip.in_km - billingTrip.out_km} km`} />
                <DetailItem label="Advance Given" value={`₹${billingTrip.advance_paid}`} />
            </div>

            <form onSubmit={handleBillSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Fuel Litres" type="number" value={billData.fuel_litres} onChange={e => setBillData({...billData, fuel_litres: e.target.value})} />
                <InputField label="Fuel Price / L" type="number" value={billData.fuel_price} onChange={e => setBillData({...billData, fuel_price: e.target.value})} />
                <InputField label="Toll Charges" type="number" value={billData.toll_charges} onChange={e => setBillData({...billData, toll_charges: e.target.value})} />
                <InputField label="Other Expenses" type="number" value={billData.other_expenses} onChange={e => setBillData({...billData, other_expenses: e.target.value})} />
                
                <div className="col-span-2 border-t border-gray-400 pt-4 mt-2 grid grid-cols-4 gap-4">
                  <InputField label="Driver Base Cost" type="number" value={billData.driver_cost} onChange={e => setBillData({...billData, driver_cost: e.target.value})} />
                  <InputField label="Trip Days" type="number" value={billData.trip_days} onChange={e => setBillData({...billData, trip_days: e.target.value})} />
                  <InputField label="Overtime Allowance" type="number" value={billData.overtime_allowance} onChange={e => setBillData({...billData, overtime_allowance: e.target.value})} />
                  <InputField label="Advance (Kharcha)" type="number" value={billData.advance_paid} onChange={e => setBillData({...billData, advance_paid: e.target.value})} />
                </div>
                
                <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-gray-400 pt-4 mt-2">
                  <SelectField label="Vehicle Cost Type" value={billData.vehicle_cost_type} onChange={e => setBillData({...billData, vehicle_cost_type: e.target.value, vehicle_cost: ''})} options={['Own Company', 'Third Party']} />
                  <InputField label="Vehicle Cost" type="number" value={billData.vehicle_cost} disabled={billData.vehicle_cost_type === 'Own Company'} onChange={e => setBillData({...billData, vehicle_cost: e.target.value})} />
                </div>
                <div className="col-span-2 border-t border-gray-400 pt-4 mt-2 bg-indigo-100 p-4 rounded-xl border border-indigo-200 space-y-4">
                  <SelectField label="Client Billed" value={billData.client_name} onChange={e => setBillData({...billData, client_name: e.target.value})} options={clients.map(c=>c.name)} />
                  <InputField label="B2C (Bill to Company) Revenue" type="number" value={billData.b2c_billing} onChange={e => setBillData({...billData, b2c_billing: e.target.value})} />
                </div>
              </div>

              {(() => {
                 const currentLiveCost = (Number(billData.fuel_litres)||0) * (Number(billData.fuel_price)||0) + (Number(billData.toll_charges)||0) + (Number(billData.other_expenses)||0) + (Number(billData.driver_cost)||0) + (Number(billData.overtime_allowance)||0) + (Number(billData.vehicle_cost)||0);
                 const currentLiveProfit = (Number(billData.b2c_billing)||0) - currentLiveCost;
                 return (
                    <div className="flex flex-col md:flex-row gap-4 border-t border-gray-400 pt-6 mt-6">
                      <div className="flex-1 bg-gray-300 p-4 rounded-xl text-center shadow-inner"><div className="text-xs font-bold text-gray-700">TOTAL EXPENSES</div><div className="text-2xl font-black text-orange-600">₹{currentLiveCost}</div></div>
                      <div className="flex-1 bg-gray-300 p-4 rounded-xl text-center shadow-inner"><div className="text-xs font-bold text-gray-700">B2C REVENUE</div><div className="text-2xl font-black text-indigo-600">₹{Number(billData.b2c_billing) || 0}</div></div>
                      <div className={`flex-1 p-4 rounded-xl text-center shadow-sm border ${currentLiveProfit >= 0 ? 'bg-emerald-200 border-emerald-300' : 'bg-orange-200 border-orange-300'}`}><div className={`text-xs font-bold ${currentLiveProfit >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>PROFIT</div><div className={`text-2xl font-black ${currentLiveProfit >= 0 ? 'text-emerald-800' : 'text-orange-800'}`}>₹{currentLiveProfit}</div></div>
                    </div>
                 );
              })()}
              
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setBillingTrip(null)} className="flex-1 bg-gray-300 py-4 rounded-xl font-bold text-gray-800 hover:bg-gray-400 shadow-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 text-gray-200 py-4 rounded-xl font-bold hover:bg-emerald-700 shadow-md">Finalize Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingTrip && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex overflow-y-auto p-4 sm:p-8">
          <div className="bg-gray-200 p-8 rounded-3xl w-full max-w-4xl m-auto shadow-2xl border border-gray-400 relative">
            <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-gray-900">Complete Trip Log (#{viewingTrip.id})</h3><button onClick={() => setViewingTrip(null)} className="text-gray-500 font-bold bg-gray-300 p-2 rounded-full hover:bg-gray-400">✕</button></div>
            <h4 className="font-bold border-b border-gray-400 pb-1 mb-4 text-gray-700">Supervisor & Driver Inputs</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <DetailItem label="Driver" value={getDriverName(viewingTrip.driver_id)} />
              <DetailItem label="Supervisor" value={getSupervisorName(viewingTrip.supervisor_id)} />
              <DetailItem label="Vehicle" value={viewingTrip.vehicle_number} />
              <DetailItem label="Vehicle Mode" value={viewingTrip.vehicle_mode} />
              <DetailItem label="Client Name" value={viewingTrip.client_name} />
              <DetailItem label="Source (From)" value={viewingTrip.source} />
              <DetailItem label="Destination (To)" value={viewingTrip.destination} />
              <DetailItem label="Vendor" value={viewingTrip.vendor_name} />
              <DetailItem label="Sourced From" value={viewingTrip.vehicle_sourced_from} />
              <DetailItem label="Starting KM / Time" value={`${viewingTrip.out_km} km / ${viewingTrip.out_time}`} />
              <DetailItem label="Stop KM / Time" value={`${viewingTrip.in_km} km / ${viewingTrip.in_time}`} />
              <DetailItem label="Total Distance" value={`${viewingTrip.in_km - viewingTrip.out_km} km`} />
              <DetailItem label="Status" value={viewingTrip.status} />
              <DetailItem label="POD Link" value={viewingTrip.pod_link ? "Document Uploaded" : "Missing"} />
            </div>

            {(['Pending for Admin Final Review', 'Billed / Completed'].includes(viewingTrip.status)) && (
              <>
                <h4 className="font-bold border-b border-gray-400 pb-1 mb-4 text-gray-700">Financial Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DetailItem label="Tolls" value={`₹${viewingTrip.toll_charges}`} />
                  <DetailItem label="Driver Cost" value={`₹${viewingTrip.driver_cost}`} />
                  <DetailItem label="Trip Days" value={`${viewingTrip.trip_days} Days`} />
                  <DetailItem label="Overtime Paid" value={`₹${viewingTrip.overtime_allowance}`} />
                  <DetailItem label="Advance Given" value={`₹${viewingTrip.advance_paid}`} />
                  <DetailItem label="Other Exp." value={`₹${viewingTrip.other_expenses}`} />
                  <DetailItem label="Fuel Total" value={`₹${viewingTrip.fuel_litres * viewingTrip.fuel_price}`} />
                  <DetailItem label="Vehicle Cost" value={`₹${viewingTrip.vehicle_cost} (${viewingTrip.vehicle_cost_type})`} />
                </div>
              </>
            )}
            
            {viewingTrip.status === 'Billed / Completed' && (
                <div className="mt-6 flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-gray-300 p-4 rounded-xl border border-gray-400 text-center shadow-inner"><div className="text-sm font-bold text-gray-700">TOTAL EXPENSES</div><div className="text-3xl font-black text-orange-600">₹{viewingTrip.total_running_cost}</div></div>
                  <div className="flex-1 bg-indigo-100 p-4 rounded-xl border border-indigo-200 text-center shadow-inner"><div className="text-sm font-bold text-indigo-700">B2C REVENUE</div><div className="text-3xl font-black text-indigo-800">₹{viewingTrip.b2c_billing}</div></div>
                  <div className="flex-1 bg-emerald-100 p-4 rounded-xl border border-emerald-200 text-center shadow-inner"><div className="text-sm font-bold text-emerald-700">NET PROFIT</div><div className="text-3xl font-black text-emerald-800">₹{viewingTrip.profit}</div></div>
                </div>
            )}
          </div>
        </div>
      )}

      {editDetailsTrip && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex overflow-y-auto p-4 sm:p-8">
          <div className="bg-gray-200 p-8 rounded-3xl w-full max-w-2xl m-auto shadow-2xl border border-gray-400 relative">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Admin Override: Trip #{editDetailsTrip.id}</h3>
            <form onSubmit={handleEditDetailsSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Vehicle Type" value={editDetailsData.vehicle_type} onChange={e => setEditDetailsData({...editDetailsData, vehicle_type: e.target.value})} options={vehicleTypes} />
              <SelectField label="Vehicle Mode" value={editDetailsData.vehicle_mode} onChange={e => setEditDetailsData({...editDetailsData, vehicle_mode: e.target.value})} options={['Adhoc', 'Dedicated']} />
              <SelectField label="Body Type" value={editDetailsData.body_type} onChange={e => setEditDetailsData({...editDetailsData, body_type: e.target.value})} options={['Open', 'Closed']} />
              <SelectField label="Vendor Name" value={editDetailsData.vendor_name} onChange={e => setEditDetailsData({...editDetailsData, vendor_name: e.target.value})} options={vendors.map(v=>v.name)} />
              <InputField label="Vehicle Sourced From" value={editDetailsData.vehicle_sourced_from} onChange={e => setEditDetailsData({...editDetailsData, vehicle_sourced_from: e.target.value})} placeholder="E.g., Name/Company" />
              
              <div className="col-span-1 md:col-span-2 mt-2 font-bold text-sky-800 border-b border-gray-400 pb-2">Client Details & Docs</div>
              <SelectField label="Select Client" value={editDetailsData.client_name} onChange={e => setEditDetailsData({...editDetailsData, client_name: e.target.value})} options={clients.map(c=>c.name)} />
              <InputField label="Source (From)" value={editDetailsData.source} onChange={e => setEditDetailsData({...editDetailsData, source: e.target.value})} />
              <InputField label="Destination (To)" value={editDetailsData.destination} onChange={e => setEditDetailsData({...editDetailsData, destination: e.target.value})} />
              <InputField label="Helper Name" value={editDetailsData.helper_name} onChange={e => setEditDetailsData({...editDetailsData, helper_name: e.target.value})} />
              <InputField label="POD Link" value={editDetailsData.pod_link} onChange={e => setEditDetailsData({...editDetailsData, pod_link: e.target.value})} placeholder="https://..." />
              
              <div className="col-span-1 md:col-span-2 flex gap-4 mt-6">
                <button type="button" onClick={() => setEditDetailsTrip(null)} className="flex-1 bg-gray-300 py-3 rounded-xl font-bold text-gray-800 hover:bg-gray-400 shadow-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-500 text-gray-200 py-3 rounded-xl font-bold hover:bg-amber-600 shadow-md">Override Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'supervisors' && (
        <div className="bg-gray-200/95 p-8 rounded-2xl shadow-xl border border-gray-400">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Supervisors & Wallets</h3>
              <form onSubmit={handleCreateSupervisor} className="flex gap-2">
                <input type="text" placeholder="Name" value={supForm.name} onChange={e=>setSupForm({...supForm,name:e.target.value})} className="border border-gray-400 bg-gray-300 p-2 rounded" />
                <input type="text" placeholder="Username" value={supForm.username} onChange={e=>setSupForm({...supForm,username:e.target.value})} className="border border-gray-400 bg-gray-300 p-2 rounded" />
                <input type="password" placeholder="Password" value={supForm.password} onChange={e=>setSupForm({...supForm,password:e.target.value})} className="border border-gray-400 bg-gray-300 p-2 rounded" />
                <button type="submit" className="bg-sky-600 text-gray-200 px-4 rounded font-bold hover:bg-sky-700">Add</button>
              </form>
          </div>
          
          <div className="grid gap-4">
            {users.filter(u=>u.role==='supervisor').map(sup => (
              <div key={sup.id} className="bg-gray-300 p-4 rounded-xl border border-gray-400 flex justify-between items-center shadow-sm">
                  <div>
                      <div className="font-bold text-gray-900 text-lg">{sup.name} <span className="text-sm font-normal text-gray-600">(@{sup.username})</span></div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => openWalletModal(sup)} className="bg-emerald-200 text-emerald-800 px-4 py-2 rounded-lg font-bold hover:bg-emerald-300">Manage Wallet & Expenses</button>
                      <button onClick={() => handleDeleteUser(sup.id)} className="text-orange-600 px-4 font-bold hover:text-orange-800">Delete</button>
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {walletSup && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex overflow-y-auto p-4 sm:p-8">
          <div className="bg-gray-200 p-8 rounded-3xl w-full max-w-4xl m-auto shadow-2xl border border-gray-400 relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Wallet: {walletSup.name}</h3>
                <button onClick={() => setWalletSup(null)} className="text-gray-500 font-bold bg-gray-300 p-2 rounded-full hover:bg-gray-400">✕</button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-indigo-100 p-4 rounded-xl border border-indigo-200 text-center"><div className="text-xs font-bold text-indigo-700">TOTAL FUNDED</div><div className="text-2xl font-black text-indigo-800">₹{walletData.total_funded}</div></div>
                <div className="bg-orange-100 p-4 rounded-xl border border-orange-200 text-center"><div className="text-xs font-bold text-orange-700">TRIP EXPENSES</div><div className="text-2xl font-black text-orange-800">₹{walletData.total_trip_expenses}</div></div>
                <div className="bg-orange-100 p-4 rounded-xl border border-orange-200 text-center"><div className="text-xs font-bold text-orange-700">MISC EXPENSES</div><div className="text-2xl font-black text-orange-800">₹{walletData.total_misc_expenses}</div></div>
                <div className="bg-emerald-100 p-4 rounded-xl border border-emerald-200 text-center"><div className="text-xs font-bold text-emerald-700">CURRENT BALANCE</div><div className="text-2xl font-black text-emerald-800">₹{walletData.current_balance}</div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-bold mb-3 border-b border-gray-400 pb-2 text-gray-900">Send Funds to Supervisor</h4>
                    <form onSubmit={handleFundSubmit} className="flex gap-2">
                        <InputField type="number" label="Amount" value={newFund.amount} onChange={e=>setNewFund({...newFund, amount: e.target.value})} />
                        <SelectField label="Medium" value={newFund.medium} onChange={e=>setNewFund({...newFund, medium: e.target.value})} options={['Cash', 'UPI', 'Bank Transfer']} />
                        <div className="mt-5"><button type="submit" className="bg-emerald-600 text-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-emerald-700">Send</button></div>
                    </form>
                    
                    <h4 className="font-bold mb-3 border-b border-gray-400 pb-2 mt-8 text-gray-900">Funding History</h4>
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
                        {walletFunds.map(f => (
                            <div key={f.id} className="bg-indigo-100 p-3 rounded-lg border border-indigo-200 flex justify-between items-center">
                                <div><div className="font-bold text-indigo-800 text-lg">₹{f.amount}</div><div className="text-xs font-semibold text-indigo-600">Medium: {f.medium}</div></div>
                                <div className="text-xs font-bold text-gray-600">{new Date(f.date).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-3 border-b border-gray-400 pb-2 text-gray-900">Approve Misc Expenses</h4>
                    {miscExpenses.filter(m => m.status === 'Pending').map(exp => (
                        <div key={exp.id} className="bg-amber-100 p-3 rounded-lg border border-amber-200 mb-2 flex justify-between items-center">
                            <div><div className="font-bold text-gray-900">₹{exp.amount}</div><div className="text-xs text-gray-700">{exp.description}</div></div>
                            <div className="flex gap-2">
                                <button onClick={() => handleMiscStatus(exp.id, 'Approved')} className="bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-emerald-600">Approve</button>
                                <button onClick={() => handleMiscStatus(exp.id, 'Rejected')} className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-orange-600">Reject</button>
                            </div>
                        </div>
                    ))}
                    {miscExpenses.filter(m => m.status === 'Pending').length === 0 && <div className="text-sm italic text-gray-600">No pending expenses.</div>}
                    
                    <h4 className="font-bold mb-3 border-b border-gray-400 pb-2 mt-8 text-gray-900">Misc Expense History</h4>
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
                        {miscExpenses.filter(m => m.status !== 'Pending').map(exp => (
                            <div key={exp.id} className="bg-gray-300 p-3 rounded-lg border border-gray-400 flex justify-between items-center">
                                <div><div className="font-bold text-gray-900 text-lg">₹{exp.amount}</div><div className="text-xs text-gray-600">{exp.description}</div></div>
                                <StatusBadge status={exp.status === 'Approved' ? 'Billed / Completed' : 'Pending Approval'} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="bg-gray-200/95 p-8 rounded-2xl shadow-xl max-w-lg border border-gray-400">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Manage Clients</h3>
          <form onSubmit={handleAddClient} className="flex gap-4 mb-6">
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} required placeholder="Add Client Name..." className="flex-1 bg-gray-300 border border-gray-400 text-gray-900 rounded-xl p-3 outline-none" />
            <button type="submit" className="bg-sky-600 text-gray-200 px-6 rounded-xl font-bold hover:bg-sky-700">Add</button>
          </form>
          <div className="grid grid-cols-2 gap-2">
            {clients.map(c => (
              <div key={c.id} className="bg-gray-300 p-2 rounded-lg border border-gray-400 text-sm font-semibold flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>{c.name}</div><button onClick={() => handleDeleteClient(c.id)} className="text-orange-600 hover:text-orange-800 font-bold px-2 bg-orange-200 rounded">✕</button></div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="bg-gray-200/95 p-8 rounded-2xl shadow-xl max-w-lg border border-gray-400">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Manage Vendors</h3>
          <form onSubmit={handleAddVendor} className="flex gap-4 mb-6">
            <input type="text" value={vendorName} onChange={e => setVendorName(e.target.value)} required placeholder="Add Vendor Name..." className="flex-1 bg-gray-300 border border-gray-400 text-gray-900 rounded-xl p-3 outline-none" />
            <button type="submit" className="bg-sky-600 text-gray-200 px-6 rounded-xl font-bold hover:bg-sky-700">Add</button>
          </form>
          <div className="grid grid-cols-2 gap-2">
            {vendors.map(v => (
              <div key={v.id} className="bg-gray-300 p-2 rounded-lg border border-gray-400 text-sm font-semibold flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{v.name}</div><button onClick={() => handleDeleteVendor(v.id)} className="text-orange-600 hover:text-orange-800 font-bold px-2 bg-orange-200 rounded">✕</button></div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-gray-200/95 p-8 rounded-2xl shadow-xl max-w-lg border border-gray-400">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Register New Vehicle</h3>
          <form onSubmit={handleAddVehicle} className="flex flex-col gap-4 mb-6">
            <InputField label="Vehicle Number (No Spaces)" value={vehicleForm.vehicle_number} onChange={e => setVehicleForm({...vehicleForm, vehicle_number: e.target.value.replace(/\s+/g, '').toUpperCase()})} uppercase />
            <SelectField label="Ownership Type" value={vehicleForm.ownership_type} onChange={e => setVehicleForm({...vehicleForm, ownership_type: e.target.value})} options={['Own Company', 'Third Party']} />
            {vehicleForm.ownership_type === 'Own Company' && (
              <InputField label="Monthly EMI (₹)" type="number" value={vehicleForm.emi} onChange={e => setVehicleForm({...vehicleForm, emi: e.target.value})} />
            )}
            <button type="submit" className="bg-sky-600 text-gray-200 py-3 rounded-xl font-bold hover:bg-sky-700 shadow-md">Add Vehicle</button>
          </form>
          <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider border-b border-gray-400 pb-2 mb-4">Approved Vehicles</h4>
          <div className="grid grid-cols-1 gap-2">
            {vehicles.map(v => (
              <div key={v.id} className="bg-gray-300 p-3 rounded-lg border border-gray-400 text-sm flex items-center justify-between shadow-sm">
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{v.vehicle_number}</div>
                  <div className="text-xs text-gray-600 mt-1">{v.ownership_type} {v.ownership_type === 'Own Company' ? `(EMI: ₹${v.emi})` : ''}</div>
                </div>
                <button onClick={() => handleDeleteVehicle(v.id)} className="text-orange-600 hover:text-orange-800 font-bold px-2 py-1 bg-orange-200 rounded text-xs border border-orange-300">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}