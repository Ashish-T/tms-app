import React from 'react';

export const blockInvalidChars = (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); };

export const InputField = ({ label, name, type = "text", value, onChange, placeholder, uppercase, pattern, title, disabled }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-semibold text-gray-800">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={value} 
      onChange={onChange} 
      required 
      placeholder={placeholder} 
      pattern={pattern} 
      title={title} 
      disabled={disabled} 
      min={type === "number" ? "0" : undefined} 
      step={type === "number" ? "any" : undefined} /* <--- THIS FIXES THE DECIMAL ISSUE */
      onKeyDown={type === "number" ? blockInvalidChars : undefined} 
      className={`bg-gray-300 border border-gray-400 text-gray-900 rounded-xl focus:ring-4 focus:ring-sky-500/20 block w-full p-3 outline-none ${uppercase ? 'uppercase' : ''} ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-400' : ''}`} 
    />
  </div>
);

export const SelectField = ({ label, name, value, onChange, options, optionObjects, disabled }) => (
  <div className="flex flex-col space-y-1.5">
    <label className="text-sm font-semibold text-gray-800">{label}</label>
    <select name={name} value={value} onChange={onChange} required disabled={disabled} className={`bg-gray-300 border border-gray-400 text-gray-900 rounded-xl focus:ring-4 focus:ring-sky-500/20 block w-full p-3 outline-none ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-400' : ''}`}>
      <option value="">-- Select --</option>
      {options && options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      {optionObjects && optionObjects.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
    </select>
  </div>
);

export const DetailItem = ({ label, value }) => (
  <div className="bg-gray-300 p-3 rounded-lg border border-gray-400"><span className="block text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span><span className="block text-sm font-semibold text-gray-900 mt-1 break-words">{value || '-'}</span></div>
);

export const getCurrentTime = () => new Date().toTimeString().slice(0, 5);
export const getCurrentDate = () => new Date().toISOString().split('T')[0];

export const StatusBadge = ({ status }) => {
  const colors = { 
    'Pending Approval': 'bg-orange-200 text-orange-800', 
    'Waiting for Driver': 'bg-sky-200 text-sky-800', 
    'Reported': 'bg-amber-200 text-amber-800', 
    'Trip Started': 'bg-blue-200 text-blue-800', 
    'Submitted for Review': 'bg-purple-200 text-purple-800',
    'Completed': 'bg-indigo-200 text-indigo-800', 
    'Pending for Admin Final Review': 'bg-orange-300 text-orange-900',
    'Billed / Completed': 'bg-emerald-200 text-emerald-800' 
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-300 text-gray-800'}`}>{status}</span>;
};