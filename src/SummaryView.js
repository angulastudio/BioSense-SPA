import React from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Grid } from '@mui/material';
import HeartRateChart from './HeartRateChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SummaryView = ({ heartRateData, hrvData, runningAverageHRV, tags, sessionName, totalTime, onConnectNewDevice }) => {
	const averageHeartRate = (heartRateData.reduce((acc, curr) => acc + curr, 0) / heartRateData.length).toFixed(2);
	const averageHrv = (hrvData.reduce((acc, curr) => acc + curr, 0) / hrvData.length).toFixed(2);

	const fiveMinutes = 5 * 60;
	const averageFirst5MinutesHRV = hrvData.slice(0, fiveMinutes).reduce((acc, curr) => acc + curr, 0) / Math.min(fiveMinutes, hrvData.length);
	const averageLast5MinutesHRV = hrvData.slice(-fiveMinutes).reduce((acc, curr) => acc + curr, 0) / Math.min(fiveMinutes, hrvData.length);

	const calculateMaxMinData = (data) => {
		const maxValue = Math.max(...data);
		const minValue = Math.min(...data);
		const maxIndex = data.indexOf(maxValue);
		const minIndex = data.indexOf(minValue);
		return { max: maxValue, min: minValue, maxIndex: maxIndex, minIndex: minIndex };
	};

	const calculateMinHrvData = (data) => {
		const filteredData = data.filter(value => value > 0);
		if (filteredData.length === 0) return { min: 0, minIndex: -1 };
		const minValue = Math.min(...filteredData);
		const minIndex = data.indexOf(minValue);
		return { min: minValue, minIndex: minIndex };
	};

	const heartRateStats = calculateMaxMinData(heartRateData);
	const hrvStats = calculateMaxMinData(hrvData);
	const minHrvStats = calculateMinHrvData(hrvData);

	const maxMinData = {
		maxHR: heartRateStats.max,
		minHR: heartRateStats.min,
		maxHRIndex: heartRateStats.maxIndex,
		minHRIndex: heartRateStats.minIndex,
		maxHRV: hrvStats.max,
		minHRV: minHrvStats.min,
		maxHRVIndex: hrvStats.maxIndex,
		minHRVIndex: minHrvStats.minIndex,
		averageHR: averageHeartRate,
		averageHRV: averageHrv
	};

	const downloadPDF = () => {
		const input = document.getElementById('summary-content');
		html2canvas(input).then((canvas) => {
			const imgData = canvas.toDataURL('image/png');
			const pdf = new jsPDF('p', 'mm', 'a4');
			const imgProps = pdf.getImageProperties(imgData);
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
			pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
			pdf.save('session_summary.pdf');
		});
	};

	return (
		<Box sx={{ width: '100%', padding: '16px', boxSizing: 'border-box' }}>
			<Grid container spacing={2} sx={{ marginTop: 2, width: '100%', paddingX: '16px', boxSizing: 'border-box' }} id="summary-content">
				<Typography variant="h4" gutterBottom>Session Summary</Typography>
				<Grid item xs={12}>
					<Card>
						<CardContent>
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
									<Typography variant="h5" gutterBottom>Session name: {sessionName}</Typography>
								</Grid>
							
								<Grid item xs={12} sm={6}>
									<Typography variant="h5" gutterBottom>Total time: {totalTime}</Typography>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12}>
					<Card>
						<CardContent>
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6} md={3} textAlign="center">
									<Typography variant="body1">Average Heart Rate (BPM)</Typography>
									<Typography variant="h4" mb={2}>{averageHeartRate}</Typography>
									<Typography variant="body1">Average HRV (RMSSD)</Typography>
									<Typography variant="h4">{averageHrv}</Typography>
								</Grid>
								<Grid item xs={12} sm={6} md={3} textAlign="center">
									<Typography variant="body1">First 5 Minutes HRV</Typography>
									<Typography variant="h4" mb={2}>{averageFirst5MinutesHRV.toFixed(2)}</Typography>
									<Typography variant="body1">Last 5 Minutes HRV</Typography>
									<Typography variant="h4">{averageLast5MinutesHRV.toFixed(2)}</Typography>
								</Grid>
								<Grid item xs={12} sm={6} md={3} textAlign="center">
									<Typography variant="body1">Max Heart Rate</Typography>
									<Typography variant="h4" mb={2}>{maxMinData.maxHR}</Typography>
									<Typography variant="body1">Min Heart Rate</Typography>
									<Typography variant="h4">{maxMinData.minHR}</Typography>
								</Grid>
								<Grid item xs={12} sm={6} md={3} textAlign="center">
									<Typography variant="body1">Max HRV</Typography>
									<Typography variant="h4" mb={2}>{maxMinData.maxHRV}</Typography>
									<Typography variant="body1">Min HRV</Typography>
									<Typography variant="h4">{maxMinData.minHRV}</Typography>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12}>
					<Card>
						<CardContent>
							<HeartRateChart 
									heartRateData={heartRateData} 
									hrvData={hrvData}
									runningAverageHRV={runningAverageHRV} 
									tags={tags} 
									maxMinData={maxMinData} 
									isSummary={true} 
							/>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12}>
					<Card>
						<CardContent>
							<Box>
								<Typography variant="h6">Tags</Typography>
								<TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
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
											{tags.map((tag, index) => (
												<TableRow key={index}>
													<TableCell>{tag.time}</TableCell>
													<TableCell>{tag.heartRate}</TableCell>
													<TableCell>{tag.hrv}</TableCell>
													<TableCell sx={{ color: tag.color }}>{tag.type}</TableCell>
													<TableCell>{tag.comments}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</Box>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
				<Button variant="contained" color="primary" onClick={downloadPDF} sx={{ marginRight: 2 }}>Download</Button>
				<Button variant="contained" color="primary" onClick={onConnectNewDevice}>Connect New Device</Button>
			</Box>
		</Box>
	);
};

export default SummaryView;