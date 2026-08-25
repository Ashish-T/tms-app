import React, { useState } from 'react';
import API from './api';

function App() {
  const [name, setName] = useState('');
  const [license, setLicense] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setStatusMessage('Saving...');
    
    try {
      // Sending a POST request to your FastAPI backend
      const response = await API.post('/drivers/', {
        name: name,
        license_number: license
      });
      
      setStatusMessage(`Success! Added Driver ID: ${response.data.id}`);
      setName('');
      setLicense('');
    } catch (error) {
      console.error("API Error:", error);
      setStatusMessage('Error adding driver. Make sure the API is awake!');
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Transport Management System</h1>
      
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '8px', 
        backgroundColor: '#f9f9f9' 
      }}>
        <h2>Add a New Driver</h2>
        
        <form onSubmit={handleAddDriver} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Driver Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>License Number</label>
            <input 
              type="text" 
              value={license} 
              onChange={(e) => setLicense(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          
          <button 
            type="submit" 
            style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Save Driver
          </button>
        </form>

        {statusMessage && (
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e2e3e5', borderRadius: '4px' }}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
