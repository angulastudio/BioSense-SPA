// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import HRVSculpture from './HRVSculpture';


// const App = () => {
//   const [connected, setConnected] = useState(false);
//   const [heartRate, setHeartRate] = useState(null);
//   const [rrPeaks, setRrPeaks] = useState(null);
//   const [hrv, setHrv] = useState(null);

//   const connectToDevice = async () => {
//     try {
//       const connectResponse = await axios.get('/connect');
//       if (connectResponse.status === 200) {
//         setConnected(true);
//         await axios.get('/start_notifications'); // Inicia notificaciones al conectarse
//       }
//     } catch (error) {
//       console.error('Error connecting to device:', error);
//     }
//   };

//   useEffect(() => {
//     if (connected) {
//       const intervalId = setInterval(() => {
//         fetchHeartRate();
//         fetchRrPeaks();
//         fetchHrv();
//       }, 1000); // Actualiza los datos cada segundo

//       return () => clearInterval(intervalId); // Limpia el intervalo al desmontar el componente
//     }
//   }, [connected]);

//   const fetchHeartRate = async () => {
//     try {
//       const response = await axios.get('/heart_rate');
//       if (response.data.heart_rate !== undefined) {
//         setHeartRate(response.data.heart_rate);
//       }
//     } catch (error) {
//       console.error('Failed to fetch heart rate:', error);
//     }
//   };

//   const fetchRrPeaks = async () => {
//     try {
//       const response = await axios.get('/rr_peaks');
//       if (response.data.rr_peaks !== undefined) {
//         setRrPeaks(response.data.rr_peaks);
//       }
//     } catch (error) {
//       console.error('Failed to fetch RR peaks:', error);
//     }
//   };

//   const fetchHrv = async () => {
//     try {
//       const response = await axios.get('/hrv');
//       if (response.data.hrv !== undefined) {
//         setHrv(response.data.hrv);
//       }
//     } catch (error) {
//       console.error('Failed to fetch HRV:', error);
//     }
//   };

//   return (
//     <div>
//       <div>
//         <h1>Polar HR Monitor</h1>
//         <button onClick={connectToDevice} disabled={connected}>
//           {connected ? "Connected" : "Connect to Polar Device"}
//         </button>
//         <div>
//           <p>Heart Rate: {heartRate}</p>
//           <p>RR Peaks: {rrPeaks}</p>
//           <p>HRV: {hrv}</p>
//           <HRVSculpture hrv={hrv} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default App;



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HRVSculpture from './HRVSculpture';
import HeartRateChart from './HeartRateChart';

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [heartRate, setHeartRate] = useState(null);
  const [rrPeaks, setRrPeaks] = useState(null);
  const [hrv, setHrv] = useState(null);

  const [heartRateData, setHeartRateData] = useState([]);

  const scanDevices = async () => {
    setIsScanning(true);
    try {
      const response = await axios.get('/scan');
      setDevices(response.data);
      setIsScanning(false);
    } catch (error) {
      console.error('Error scanning devices:', error);
      setIsScanning(false);
    }
  };
  
  const connectToDevice = async (address) => {
    setIsConnecting(true);
    try {
      await axios.post('/set_address', { address });
      const connectResponse = await axios.get('/connect');
      if (connectResponse.status === 200) {
        setConnected(true);
        setSelectedDevice(devices.find(device => device.address === address));
        await axios.get('/start_notifications');
      }
      setIsConnecting(false);
    } catch (error) {
      console.error('Error connecting to device:', error);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (connected) {
      const intervalId = setInterval(() => {
        fetchHeartRate();
        fetchRrPeaks();
        fetchHrv();
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [connected]);

  const fetchHeartRate = async () => {
    const response = await axios.get('/heart_rate');
    setHeartRate(response.data.heart_rate);
    setHeartRateData(prevData => [...prevData, response.data.heart_rate]);
    // setHeartRateData(prevData => [...prevData.slice(-50), response.data.heart_rate]);
  };

  const fetchRrPeaks = async () => {
    const response = await axios.get('/rr_peaks');
    setRrPeaks(response.data.rr_peaks);
  };

  const fetchHrv = async () => {
    const response = await axios.get('/hrv');
    setHrv(response.data.hrv);
  };

  const stopNotifications = async () => {
    try {
      const response = await axios.get('/stop_notifications');
      if (response.status === 200) {
        console.log(response.data.message);
        setConnected(false);
      }
    } catch (error) {
      console.error('Error stopping notifications:', error);
    }
  };

  return (
    <div>
      <h1>Polar HR Monitor</h1>
      {!connected && (
      <div>
        <button onClick={scanDevices} disabled={isScanning}>
          {isScanning ? 'Scanning...' : 'Scan for Devices'}
        </button>
        {isScanning ? <p>Scanning for devices, please wait...</p> : (
          <ul>
            {devices.map(device => (
              <li key={device.address}>
                {device.name}
                <button onClick={() => connectToDevice(device.address)} disabled={isConnecting}>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )}
      {connected && (
        <div>
          <button onClick={() => {}}>Connected to {selectedDevice?.name}</button>
          <button onClick={stopNotifications}>Stop Notifications</button>
          <div>
            <p>Heart Rate: {heartRate}</p>
            <p>RR Peaks: {rrPeaks}</p>
            <p>HRV: {hrv}</p>
            <HRVSculpture hrv={hrv} />
            <HeartRateChart data={heartRateData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;