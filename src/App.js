import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from './api';

import { AppBar, Toolbar, IconButton, Button, Typography, Box, LinearProgress, CircularProgress, ListItemButton, ListItemText, ListItemIcon, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Switch, TablePagination } from '@mui/material';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import MenuIcon from '@mui/icons-material/Menu';
import HeartIcon from '@mui/icons-material/Favorite';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import Brightness2Icon from '@mui/icons-material/Brightness2';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

import HRVSculpture from './HRVSculpture';
import HeartRateChart from './HeartRateChart';
import SummaryView from './SummaryView';
import { ThemeContext } from './ThemeContext'; 


const App = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [isScanning, setIsScanning] = useState(false);
  const [connectingDevice, setConnectingDevice] = useState(null);
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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [showSummary, setShowSummary] = useState(false);

  const [summaryData, setSummaryData] = useState({
	heartRateData: [],
	hrvData: [],
	tags: [],
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  const scanDevices = async () => {
    setIsScanning(true);
    try {
      const response = await api.get('/scan');
      setDevices(response.data);
      setIsScanning(false);
    } catch (error) {
      console.error('Error scanning devices:', error);
      setIsScanning(false);
    }
  };
  
  const connectToDevice = async (address) => {
	setConnectingDevice(address);
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
	  setConnectingDevice(null);
	} catch (error) {
	  console.error('Error connecting to device:', error);
	  setIsConnecting(false);
	  setConnectingDevice(null);
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
  
		const summary = {
		  heartRateData: [...heartRateData],
		  hrvData: [...hrvData],
		  tags: [...tags],
		};
		setSummaryData(summary);
		
		setConnected(false);
		setIsPaused(false);
		setTimer(0);
		setHeartRateData([]);
		setHrvData([]);
		setTags([]);
		setShowSummary(true);
	  }
	} catch (error) {
	  console.error('Error disconnecting:', error);
	}
  };

  const handleConnectNewDevice = () => {
    setShowSummary(false);
    scanDevices();
  };

  return (
	<Box sx={{ width: '100%', overflowX: 'hidden' }}>
	  <AppBar position="static" sx={{ width: '100%' }}>
		<Toolbar>
		  <IconButton edge="start" color="inherit" aria-label="menu">
			<MenuIcon />
		  </IconButton>
		  <Typography variant="h6" sx={{ flexGrow: 1 }}>
			Biosense
		  </Typography>
		  <Box sx={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
			<WbSunnyIcon sx={{ marginRight: 0.5 }} />
			<Switch checked={darkMode} onChange={toggleDarkMode} sx={{ mx: 0.5 }} />
			<Brightness2Icon sx={{ transform: 'rotate(180deg)', marginLeft: 0.5 }} />
		  </Box>
		  {connected && (
			<>
			  <Typography variant="h6" sx={{ marginRight: 4 }}>
				{formatTime(timer)}
			  </Typography>
			  <IconButton
				color="inherit"
				onClick={togglePause}
				sx={{ borderRadius: '50%', backgroundColor: 'white', marginRight: 1 }}
			  >
				{isPaused ? <PlayArrowIcon sx={{ color: 'black' }} /> : <PauseIcon sx={{ color: 'black' }} />}
			  </IconButton>
			  <IconButton
				color="inherit"
				onClick={stopAndDisconnect}
				sx={{ borderRadius: '50%', backgroundColor: 'white' }}
			  >
				<StopIcon sx={{ color: 'black' }} />
			  </IconButton>
			</>
		  )}
		</Toolbar>
	  </AppBar>
	  <Box sx={{ width: '100%', padding: '16px', boxSizing: 'border-box' }}>
		{showSummary ? (
		  <SummaryView
			heartRateData={summaryData.heartRateData}
			hrvData={summaryData.hrvData}
			tags={summaryData.tags}
			onConnectNewDevice={handleConnectNewDevice}
		  />
		) : !connected ? (
		  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
			<Card sx={{ width: '80%', maxWidth: '600px' }}>
			  <CardContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				  <Button onClick={scanDevices} disabled={isScanning} fullWidth variant="contained" color="primary">
					{isScanning ? 'Scanning...' : 'Scan for Devices'}
				  </Button>
				  {isScanning ? (
					<LinearProgress sx={{ marginTop: 2, width: '100%' }} />
				  ) : (
					<Box sx={{ width: '100%' }}>
					  <ul style={{ paddingLeft: '0px', width: '100%' }}>
						{devices.map(device => (
						  <ListItemButton key={device.address} onClick={() => connectToDevice(device.address)} disabled={isConnecting} sx={{ width: '100%' }}>
							<ListItemIcon>
							  <BluetoothIcon />
							</ListItemIcon>
							<ListItemText primary={device.name} />
							{connectingDevice === device.address && <CircularProgress size={24} />}
						  </ListItemButton>
						))}
					  </ul>
					</Box>
				  )}
				</Box>
			  </CardContent>
			</Card>
		  </Box>
		) : (
		  <Box sx={{ width: '100%' }}>
			<Grid container spacing={2} sx={{ marginTop: 2, width: '100%', paddingX: '16px', boxSizing: 'border-box' }}>
			  <Grid item xs={12} md={6}>
				<Card sx={{ height: '100%' }}>
				  <CardContent>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
					  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
						<Typography variant="body1">Heart Rate (BPM)</Typography>
						<Typography variant="h4">{heartRate}</Typography>
					  </Box>
					  <HeartIcon color="error" sx={{ width: '80px' }} />
					</Box>
					<Box sx={{ display: 'flex', flexDirection: 'column', marginTop: 2 }}>
					  <Typography variant="body1">RR-Peaks</Typography>
					  <Typography variant="h4">{rrPeaks}</Typography>
					</Box>
					<Box sx={{ display: 'flex', flexDirection: 'column', marginTop: 2 }}>
					  <Typography variant="body1">HRV (RMSSD)</Typography>
					  <Typography variant="h4">{hrvData.length ? hrvData[hrvData.length - 1] : 'No data'}</Typography>
					</Box>
				  </CardContent>
				</Card>
			  </Grid>
			  <Grid item xs={12} md={6}>
				<Card sx={{ height: '100%' }}>
				  <CardContent>
					<HRVSculpture hrv={hrvData.length ? hrvData[hrvData.length - 1] : null} />
				  </CardContent>
				</Card>
			  </Grid>
			  <Grid item xs={12} md={6}>
				<Card sx={{ height: '100%' }}>
				  <CardContent>
					<Box display="flex" justifyContent="space-between" alignItems="center">
					  <Typography variant="h6">Heart Rate and HRV Chart</Typography>
					  <Box>
						<Button onClick={() => addTag('red', 'Conflicto')} sx={{ marginRight: 1 }}>Add Red Tag</Button>
						<Button onClick={() => addTag('blue', 'Realización')}>Add Blue Tag</Button>
					  </Box>
					</Box>
					<HeartRateChart heartRateData={heartRateData} hrvData={hrvData} tags={tags} />
				  </CardContent>
				</Card>
			  </Grid>
			  <Grid item xs={12} md={6}>
				<Card sx={{ height: '100%' }}>
				  <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
					<Box sx={{ flex: '1 1 auto', overflow: 'auto' }}>
					  <Typography variant="h6">Tags</Typography>
					  <TableContainer component={Paper} sx={{ boxShadow: 'none', maxHeight: 400 }}>
						<Table>
						  <TableHead>
							<TableRow>
							  <TableCell>Time Elapsed</TableCell>
							  <TableCell>Heart Rate (BPM)</TableCell>
							  <TableCell>HRV</TableCell>
							  <TableCell>Type</TableCell>
							  <TableCell>Comments</TableCell>
							</TableRow>
						  </TableHead>
						  <TableBody>
							{tags.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((tag, index) => (
							  <TableRow key={index}>
								<TableCell>{tag.time}</TableCell>
								<TableCell>{tag.heartRate}</TableCell>
								<TableCell>{tag.hrv}</TableCell>
								<TableCell sx={{ color: tag.color }}>{tag.type}</TableCell>
								<TableCell>
								  <TextField
									variant="outlined"
									fullWidth
									value={tag.comments}
									onChange={(e) => handleCommentChange(e, index)}
									placeholder="Add a comment"
								  />
								</TableCell>
							  </TableRow>
							))}
						  </TableBody>
						</Table>
					  </TableContainer>
					</Box>
					<TablePagination
					  rowsPerPageOptions={[5, 10, 25]}
					  component="div"
					  count={tags.length}
					  rowsPerPage={rowsPerPage}
					  page={page}
					  onPageChange={handleChangePage}
					  onRowsPerPageChange={handleChangeRowsPerPage}
					/>
				  </CardContent>
				</Card>
			  </Grid>
			</Grid>
		  </Box>
		)}
	  </Box>
	</Box>
  );
};

export default App;