import axios from 'axios';

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const API = axios.create({
    baseURL: baseURL,
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