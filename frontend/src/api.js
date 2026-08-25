import axios from 'axios';

// This points to your live backend on Render
const API = axios.create({
    baseURL: 'https://tms-app-svc.onrender.com',
});

export default API;
