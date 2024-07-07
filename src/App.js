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
  // const [hrv, setHrv] = useState(null);

  const [heartRateData, setHeartRateData] = useState([]);
  const [hrvData, setHrvData] = useState([]); 

  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [tags, setTags] = useState([]);


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
    let interval = null;
    
    if (connected && !isPaused) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [connected, isPaused]);

  useEffect(() => {
    let interval = null;
  
    if (connected && !isPaused) {
      interval = setInterval(() => {
        fetchHeartRate();
        fetchRrPeaks();
        fetchHrv();
      }, 1000);
    } else {
      clearInterval(interval);
    }
  
    return () => clearInterval(interval);
  }, [connected, isPaused]);


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
    try {
      const response = await axios.get('/hrv');
      if (response.data.hrv !== undefined) {
        setHrvData(prevData => [...prevData, response.data.hrv]);
      }
    } catch (error) {
      console.error('Failed to fetch HRV:', error);
    }
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


  // Tags Functions
  const addTag = (color, type) => {
    const newTag = {
      time: formatTime(timer),
      heartRate: heartRate,
      hrv: hrvData.length ? hrvData[hrvData.length - 1] : null,
      index: heartRateData.length - 1,
      color: color,
      type: type,
      comments: ''
    };
    setTags(prevTags => [...prevTags, newTag]);
  };

  const handleCommentChange = (event, index) => {
    const newTags = tags.map((tag, i) => {
      if (i === index) {
        return { ...tag, comments: event.target.value };
      }
      return tag;
    });
    setTags(newTags);
  };

  // Timer functions
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  const togglePause = async () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      try {
        const response = await axios.get('/stop_notifications');
        console.log("Notifications paused.");
      } catch (error) {
        console.error('Error pausing notifications:', error);
      }
    } else {
      try {
        const response = await axios.get('/start_notifications');
        console.log("Notifications resumed.");
      } catch (error) {
        console.error('Error resuming notifications:', error);
      }
    }
  };

  const stopAndDisconnect = async () => {
    try {
      if (!isPaused) {
        await axios.get('/stop_notifications');
      }
  
      const response = await axios.get('/disconnect');
      if (response.status === 200) {
        console.log("Disconnected from device.");
        setConnected(false);
        setIsPaused(false); 
        setTimer(0);
        setHeartRateData([]);
        setHrvData([]);
        setTags([]);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  return (
    <div>
      <h1>Biosense</h1>
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
            <h2>Time Elapsed: {formatTime(timer)}</h2>
            <div>
              <button onClick={togglePause}>
                {isPaused ? "Continue" : "Pause"}
              </button>
              <button onClick={stopAndDisconnect}>Stop and Disconnect</button>
              <button onClick={() => addTag('red', 'Conflicto')}>Add Red Tag</button>
              <button onClick={() => addTag('blue', 'Realización')}>Add Blue Tag</button>
            </div>
          </div>
          <div>
            <p>Heart Rate: {heartRate}</p>
            <p>RR Peaks: {rrPeaks}</p>
            <p>HRV: {hrvData.length ? hrvData[hrvData.length - 1] : 'No data'}</p>
            <HRVSculpture hrv={hrvData.length ? hrvData[hrvData.length - 1] : null} />
            <HeartRateChart heartRateData={heartRateData} hrvData={hrvData} tags={tags} />
          </div>
          <div>
            <h2>Tags</h2>
            <table>
              <thead>
                <tr>
                  <th>Time Elapsed</th>
                  <th>Heart Rate (BPM)</th>
                  <th>HRV</th>
                  <th>Type</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag, index) => (
                  <tr key={index}>
                    <td>{tag.time}</td>
                    <td>{tag.heartRate}</td>
                    <td>{tag.hrv}</td>
                    <td style={{color: tag.color}}>{tag.type}</td>
                    <td>
                      <input
                        type="text"
                        value={tag.comments}
                        onChange={(e) => handleCommentChange(e, index)}
                        placeholder="Add a comment"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;