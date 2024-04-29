// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [connected, setConnected] = useState(false);
  const [heartRate, setHeartRate] = useState(null);
  const [rrPeaks, setRrPeaks] = useState(null);
  const [hrv, setHrv] = useState(null);

  const connectToDevice = async () => {
    try {
      const connectResponse = await axios.get('/connect');
      if (connectResponse.status === 200) {
        setConnected(true);
        await axios.get('/start_notifications'); // Inicia notificaciones al conectarse
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
    }
  };

  useEffect(() => {
    if (connected) {
      const intervalId = setInterval(() => {
        fetchHeartRate();
        fetchRrPeaks();
        fetchHrv();
      }, 1000); // Actualiza los datos cada segundo

      return () => clearInterval(intervalId); // Limpia el intervalo al desmontar el componente
    }
  }, [connected]);

  const fetchHeartRate = async () => {
    try {
      const response = await axios.get('/heart_rate');
      if (response.data.heart_rate !== undefined) {
        setHeartRate(response.data.heart_rate);
      }
    } catch (error) {
      console.error('Failed to fetch heart rate:', error);
    }
  };

  const fetchRrPeaks = async () => {
    try {
      const response = await axios.get('/rr_peaks');
      if (response.data.rr_peaks !== undefined) {
        setRrPeaks(response.data.rr_peaks);
      }
    } catch (error) {
      console.error('Failed to fetch RR peaks:', error);
    }
  };

  const fetchHrv = async () => {
    try {
      const response = await axios.get('/hrv');
      if (response.data.hrv !== undefined) {
        setHrv(response.data.hrv);
      }
    } catch (error) {
      console.error('Failed to fetch HRV:', error);
    }
  };

  return (
    <div>
      <h1>Polar HR Monitor</h1>
      <button onClick={connectToDevice} disabled={connected}>
        {connected ? "Connected" : "Connect to Polar Device"}
      </button>
      <div>
        <p>Heart Rate: {heartRate}</p>
        <p>RR Peaks: {rrPeaks}</p>
        <p>HRV: {hrv}</p>
      </div>
    </div>
  );
};

export default App;
