import axios from 'axios';

const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000' 
    baseURL: process.env.REACT_APP_API_URL || 'https://00b9-93-42-193-170.ngrok-free.app',
    headers: {
        'ngrok-skip-browser-warning': true
    }
});

export default api;
