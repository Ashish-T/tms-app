import axios from 'axios';

const API = axios.create({
    baseURL: 'https://tms-v2-svc.onrender.com', 
});

// Automatically attach the secure token to every request
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('tms_token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;