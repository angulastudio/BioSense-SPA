import React from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Grid } from '@mui/material';
import HeartRateChart from './HeartRateChart';
import HeartIcon from '@mui/icons-material/Favorite';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SummaryView = ({ heartRateData, hrvData, tags, onConnectNewDevice }) => {
  const averageHeartRate = (heartRateData.reduce((acc, curr) => acc + curr, 0) / heartRateData.length).toFixed(2);
  const averageHrv = (hrvData.reduce((acc, curr) => acc + curr, 0) / hrvData.length).toFixed(2);

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
      <Typography variant="h4" gutterBottom>Session Summary</Typography>
      <Grid container spacing={2} sx={{ marginTop: 2, width: '100%', paddingX: '16px', boxSizing: 'border-box' }} id="summary-content">
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body1">Average Heart Rate (BPM)</Typography>
                <Typography variant="h4">{averageHeartRate}</Typography>
                <HeartIcon color="error" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 2 }}>
                <Typography variant="body1">Average HRV (RMSSD)</Typography>
                <Typography variant="h4">{averageHrv}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <HeartRateChart heartRateData={heartRateData} hrvData={hrvData} tags={tags} />
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