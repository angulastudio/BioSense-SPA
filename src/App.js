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


import React, { useState } from 'react';
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

  const fetchHeartRate = async () => {
    const response = await axios.get('/heart_rate');
    setHeartRate(response.data.heart_rate);
  };

  const fetchRrPeaks = async () => {
    const response = await axios.get('/rr_peaks');
    setRrPeaks(response.data.rr_peaks);
  };

  const fetchHrv = async () => {
    const response = await axios.get('/hrv');
    setHrv(response.data.hrv);
  };

  return (
    <div>
      <h1>Polar HR Monitor</h1>
      <button onClick={connectToDevice} disabled={connected}>
        {connected ? "Connected" : "Connect to Polar Device"}
      </button>
      <div>
        <button onClick={fetchHeartRate}>Fetch Heart Rate</button>
        <p>Heart Rate: {heartRate}</p>
        <button onClick={fetchRrPeaks}>Fetch RR Peaks</button>
        <p>RR Peaks: {rrPeaks}</p>
        <button onClick={fetchHrv}>Fetch HRV</button>
        <p>HRV: {hrv}</p>
      </div>
    </div>
  );
};

export default App;
