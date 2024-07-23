import React, { useState, useEffect, useContext } from 'react';
import {
    AppBar, Toolbar, IconButton, Button, Typography, Box, CircularProgress,
    Grid, Card, CardContent, Modal, Backdrop, Fade, TextField, Alert, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Switch, TablePagination
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import Brightness2Icon from '@mui/icons-material/Brightness2';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/Visibility';
import HeartIcon from '@mui/icons-material/Favorite';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import Tooltip from '@mui/material/Tooltip';
import HRVSculpture from './HRVSculpture';
import HeartRateChart from './HeartRateChart';
import SummaryView from './SummaryView';
import { ThemeContext } from './ThemeContext';
import { connectToDevice, togglePause, stopAndDisconnect, handleCharacteristicValueChanged } from './sensorService';
import { database } from './firebaseConfig';
import { ref, set, onValue, update } from 'firebase/database';


const App = () => {
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);
	const [isDeviceConnector, setIsDeviceConnector] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
	const [deviceName, setDeviceName] = useState(null);
    const [heartRate, setHeartRate] = useState(null);
    const [rrPeaks, setRrPeaks] = useState([]);
    const [heartRateData, setHeartRateData] = useState([]);
    const [hrvData, setHrvData] = useState([]);
    const [timer, setTimer] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [tags, setTags] = useState([]);
    const [chartVisible, setChartVisible] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState({
        heartRateData: [],
        hrvData: [],
        tags: [],
    });
	const [joinedUserSummary, setJoinedUserSummary] = useState(false);
    const [sessionCode, setSessionCode] = useState('');
    const [openModal, setOpenModal] = useState(false);

    // useEffect(() => {
    //     let interval = null;
    //     if (connected && !isPaused) {
    //         interval = setInterval(() => {
    //             setTimer((prevTimer) => {
    //                 const newTimer = prevTimer + 1;
    //                 if (sessionCode) {
    //                     const sessionRef = ref(database, `sessions/${sessionCode}`);
    //                     update(sessionRef, { timer: newTimer });
    //                 }
    //                 return newTimer;
    //             });
    //         }, 1000);
    //     } else {
    //         clearInterval(interval);
    //     }
    //     return () => clearInterval(interval);
    // }, [connected, isPaused, sessionCode]);

	useEffect(() => {
		let interval = null;
		let syncInterval = null;
	
		if (connected && !isPaused) {
			interval = setInterval(() => {
				setTimer((prevTimer) => prevTimer + 1);
			}, 1000);
	
			syncInterval = setInterval(() => {
				const sessionRef = ref(database, `sessions/${sessionCode}`);
				update(sessionRef, { timer: timer });
			}, 5000);
		} else {
			clearInterval(interval);
			clearInterval(syncInterval);
		}
	
		return () => {
			clearInterval(interval);
			clearInterval(syncInterval);
		};
	}, [connected, isPaused, sessionCode, timer]);

	useEffect(() => {
		if (sessionCode) {
			const sessionRef = ref(database, `sessions/${sessionCode}`);
	
			onValue(sessionRef, (snapshot) => {
				const data = snapshot.val();
				if (data) {
					if (typeof data.isPaused !== 'undefined') {
						setIsPaused(data.isPaused);
					}
					if (typeof data.timer !== 'undefined') {
						setTimer(data.timer);
					}
				}
			});
	
			return () => sessionRef.off();
		}
	}, [sessionCode]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const toggleChartVisibility = () => {
        setChartVisible(!chartVisible);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleConnectToDevice = async () => {
        setIsConnecting(true);
        try {
            const device = await connectToDevice((event) => handleCharacteristicValueChanged(event, setHeartRate, setRrPeaks, setHeartRateData, setHrvData));
			setConnected(true);
			setDeviceName(device.device.name)
			setIsDeviceConnector(true);
            const generatedCode = Math.random().toString(36).substr(2, 6).toUpperCase();
            setSessionCode(generatedCode);
            const sessionRef = ref(database, `sessions/${generatedCode}`);
            set(sessionRef, { heartRateData: [], hrvData: [], tags: [], timer: 0, rrPeaks: [], heartRate: 0 });
        } catch (error) {
            console.error('Error connecting to device:', error);
        }
        setIsConnecting(false);
    };

    const handleTogglePause = async () => {
		try {
			await togglePause(isPaused, (event) => handleCharacteristicValueChanged(event, setHeartRate, setRrPeaks, setHeartRateData, setHrvData));
			setIsPaused(!isPaused);
	
			const sessionRef = ref(database, `sessions/${sessionCode}`);
			update(sessionRef, { isPaused: !isPaused });
		} catch (error) {
			console.error('Error toggling pause:', error);
		}
	};

    const handleStopAndDisconnect = async () => {
		if (isDeviceConnector) {
			try {
				await stopAndDisconnect((event) => handleCharacteristicValueChanged(event, setHeartRate, setRrPeaks, setHeartRateData, setHrvData, setTags));
				setConnected(false);
				setIsPaused(false);
				setTimer(0);
				setSummaryData({
					heartRateData: heartRateData,
					hrvData: hrvData,
					tags: tags,
				});
				setHeartRateData([]);
				setHrvData([]);
				setTags([]);
				setShowSummary(true);
				setJoinedUserSummary(false);
			} catch (error) {
				console.error('Error stopping and disconnecting:', error);
			}
		} else {
			// If a user joins a session, generate summary without disconnecting device
			setSummaryData({
				heartRateData: heartRateData,
				hrvData: hrvData,
				tags: tags,
			});
			setShowSummary(true);
			setJoinedUserSummary(true);
		}
	};

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
        setTags((prevTags) => [...prevTags, newTag]);
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

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const sec = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const handleConnectNewDevice = () => {
        setShowSummary(false);
        handleConnectToDevice();
    };

    const handleJoinSession = () => {
        setOpenModal(true);
    };

    const handleModalClose = () => {
        setOpenModal(false);
    };

    const handleJoinSessionSubmit = (event) => {
        event.preventDefault();
        if (sessionCode) {
            const sessionRef = ref(database, `sessions/${sessionCode}`);
            onValue(sessionRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setHeartRateData(data.heartRateData || []);
                    setHrvData(data.hrvData || []);
                    setTags(data.tags || []);
                    setTimer(data.timer || 0);
                    setRrPeaks(data.rrPeaks || []);
                    setHeartRate(data.heartRate || 0);
                    setConnected(true);
                } else {
                    alert('Invalid session code');
                }
            });
            setOpenModal(false);
        }
		setIsDeviceConnector(false);
    };

    useEffect(() => {
        if (connected && sessionCode) {
            const sessionRef = ref(database, `sessions/${sessionCode}`);
            const data = {
                heartRateData,
                hrvData,
                tags,
                timer,
                rrPeaks,
                heartRate,
            };
            update(sessionRef, data);
        }
    }, [heartRateData, hrvData, tags, timer, rrPeaks, heartRate, connected, sessionCode]);

    useEffect(() => {
        if (connected && sessionCode) {
            const sessionRef = ref(database, `sessions/${sessionCode}`);
            onValue(sessionRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setHeartRateData(data.heartRateData || []);
                    setHrvData(data.hrvData || []);
                    setTags(data.tags || []);
                    setTimer(data.timer || 0);
                    setRrPeaks(data.rrPeaks || []);
                    setHeartRate(data.heartRate || 0);
                }
            });
        }
    }, [connected, sessionCode]);

    return (
		<Box sx={{ width: '100%', overflowX: 'hidden' }}>
			<AppBar position="static" sx={{ width: '100%' }}>
				<Toolbar>
					<IconButton edge="start" color="inherit" aria-label="menu">
					</IconButton>
					<Typography variant="h6" sx={{ flexGrow: 1 }}>
						Biosense
					</Typography>
					<Box sx={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
						<WbSunnyIcon sx={{ marginRight: 0.5 }} />
						<Switch checked={darkMode} onChange={toggleDarkMode} sx={{ mx: 0.5 }} />
						<Brightness2Icon sx={{ transform: 'rotate(180deg)', marginLeft: 0.5 }} />
					</Box>
					{connected && !showSummary && (
						<>
							<Typography variant="h6" sx={{ marginRight: 4 }}>
								{formatTime(timer)}
							</Typography>
							<IconButton
								color="inherit"
								onClick={handleTogglePause}
								sx={{ borderRadius: '50%', backgroundColor: 'white', marginRight: 1 }}
							>
								{isPaused ? <PlayArrowIcon sx={{ color: 'black' }} /> : <PauseIcon sx={{ color: 'black' }} />}
							</IconButton>
							<IconButton
								color="inherit"
								onClick={handleStopAndDisconnect}
								sx={{ borderRadius: '50%', backgroundColor: 'white' }}
							>
								<StopIcon sx={{ color: 'black' }} />
							</IconButton>
						</>
					)}
				</Toolbar>
			</AppBar>
			<Box sx={{ width: '100%', padding: '16px', boxSizing: 'border-box' }}>
				{connected && sessionCode && (
					<Grid container spacing={2} sx={{ marginBottom: 2 }}>
						<Grid item xs={12}>
							<Card sx={{ width: '100%' }}>
								<CardContent>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<Box sx={{ display: 'flex', alignItems: 'center' }}>
											<Typography variant="body1">
												Session Code: <strong>{sessionCode}</strong>
											</Typography>
											<IconButton
												color="primary"
												onClick={() => navigator.clipboard.writeText(sessionCode)}
												sx={{ marginLeft: 1 }}
											>
												<ContentCopyIcon />
											</IconButton>
										</Box>
										<Typography variant="body2" sx={{ marginTop: 1 }}>
											Device Name: <strong>{deviceName}</strong>
										</Typography>
									</Box>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				)}
				{!showSummary && !connected && !navigator.bluetooth && (
					<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
						<Card sx={{ width: '80%', maxWidth: '600px' }}>
							<CardContent>
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
									<Alert severity="error">
										Bluetooth API is not available in your browser. Please use a compatible browser.
									</Alert>
								</Box>
							</CardContent>
						</Card>
					</Box>
				)}
				{!showSummary && !connected && navigator.bluetooth && (
					<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
						<Card sx={{ width: '80%', maxWidth: '600px' }}>
							<CardContent>
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
									<Button onClick={handleConnectToDevice} disabled={isConnecting} fullWidth variant="contained" color="primary">
										{isConnecting ? 'Connecting...' : 'Connect to Device'}
									</Button>
									<Button onClick={handleJoinSession} fullWidth variant="contained" color="secondary" sx={{ mt: 2 }}>
										Join Session
									</Button>
									{isConnecting && <CircularProgress sx={{ marginTop: 2 }} />}
								</Box>
							</CardContent>
						</Card>
					</Box>
				)}
				{showSummary ? (
					<SummaryView
						heartRateData={summaryData.heartRateData}
						hrvData={summaryData.hrvData}
						tags={summaryData.tags}
						onConnectNewDevice={handleConnectNewDevice}
						showControls={!joinedUserSummary} // Solo muestra los controles si no es un usuario unido
					/>
				) : (
					connected && (
						<Box sx={{ width: '100%' }}>
							<Grid container spacing={2} sx={{ marginTop: 2, width: '100%', paddingX: '16px', boxSizing: 'border-box' }}>
								<Grid item xs={12} md={6}>
									<Card sx={{ height: '100%' }}>
										<CardContent>
											<Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
												<Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
													Heart Rate (BPM)
													<HeartIcon color="error" sx={{ marginLeft: 1 }} />
												</Typography>
												<Typography variant="h4">{heartRate}</Typography>
											</Box>
											<Box sx={{ display: 'flex', flexDirection: 'column', marginTop: 2 }}>
												<Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
													RR-Peaks
													<Tooltip title="RR-Peaks represent the time intervals between heartbeats. Healthy values vary, but generally shorter intervals indicate higher heart rates." placement="right">
														<IconButton sx={{ marginLeft: 1 }}>
															<InfoOutlinedIcon fontSize="small" />
														</IconButton>
													</Tooltip>
												</Typography>
												<Typography variant="h4">{rrPeaks.length > 0 ? rrPeaks[rrPeaks.length - 1][0].toFixed(2) : 'No data'}</Typography>
											</Box>
											<Box sx={{ display: 'flex', flexDirection: 'column', marginTop: 2 }}>
												<Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
													HRV (RMSSD)
													<Tooltip title="HRV (Heart Rate Variability) is the variation in time between heartbeats. Higher HRV is generally associated with better cardiovascular fitness and lower stress." placement="right">
														<IconButton sx={{ marginLeft: 1 }}>
															<InfoOutlinedIcon fontSize="small" />
														</IconButton>
													</Tooltip>
												</Typography>
												<Typography variant="h4">{hrvData.length > 0 ? hrvData[hrvData.length - 1].toFixed(2) : 'No data'}</Typography>
											</Box>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={12} md={6}>
									<Card sx={{ height: '100%' }}>
										<CardContent>
										<HRVSculpture hrv={hrvData.length ? hrvData[hrvData.length - 1].toFixed(2) : null} />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h6">Heart Rate and HRV Chart</Typography>
                                            <IconButton onClick={toggleChartVisibility}>
                                                {chartVisible ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                            <Box>
                                                <Button onClick={() => addTag('orange', 'Tag A')} sx={{ marginRight: 1 }}>Add Orange Tag</Button>
                                                <Button onClick={() => addTag('#8267EF', 'Tag B')}>Add Purple Tag</Button>
                                            </Box>
                                        </Box>
                                        {chartVisible ? (
                                            (heartRateData.length > 0 && hrvData.length > 0) ? (
                                                <HeartRateChart
                                                    heartRateData={heartRateData}
                                                    hrvData={hrvData}
                                                    tags={tags}
                                                    isSummary={false}
                                                />
                                            ) : (
                                                <Typography variant="subtitle1" sx={{ textAlign: 'center', marginTop: 2 }}>
                                                    Waiting for both Heart Rate and HRV data...
                                                </Typography>
                                            )
                                        ) : (
                                            <Typography variant="subtitle1" sx={{ textAlign: 'center', marginTop: 2 }}>Chart Hidden</Typography>
                                        )}
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
                                                                <TableCell>{tag.hrv ? tag.hrv.toFixed(2) : 'No data'}</TableCell>
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
                )
            )}
        </Box>

        <Modal
            aria-labelledby="join-session-modal"
            aria-describedby="join-session-modal-description"
            open={openModal}
            onClose={handleModalClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500,
            }}
        >
            <Fade in={openModal}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="join-session-modal" variant="h6" component="h2">
                        Join Session
                    </Typography>
                    <Typography id="join-session-modal-description" sx={{ mt: 2 }}>
                        Enter the session code to join:
                    </Typography>
                    <form onSubmit={handleJoinSessionSubmit}>
                        <TextField
                            label="Session Code"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={sessionCode}
                            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                        />
                        <Button type="submit" variant="contained" color="primary" fullWidth>
                            Join
                        </Button>
                    </form>
                </Box>
            </Fade>
        </Modal>
    </Box>
);
};

export default App;