import axios from 'axios';

const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000' 
    baseURL: process.env.REACT_APP_API_URL || 'https://c2eb-88-30-88-206.ngrok-free.app',
    headers: {
        'ngrok-skip-browser-warning': true
    }
});

export default api;
