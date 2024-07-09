import React from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Grid } from '@mui/material';
import HeartRateChart from './HeartRateChart';
import HeartIcon from '@mui/icons-material/Favorite';

const SummaryView = ({ heartRateData, hrvData, tags, onConnectNewDevice }) => {
  const averageHeartRate = (heartRateData.reduce((acc, curr) => acc + curr, 0) / heartRateData.length).toFixed(2);
  const averageHrv = (hrvData.reduce((acc, curr) => acc + curr, 0) / hrvData.length).toFixed(2);

  return (
    <Box sx={{ width: '100%', padding: '16px', boxSizing: 'border-box' }}>
      <Typography variant="h4" gutterBottom sx={{ marginLeft: 2 }}>Session Summary</Typography>
      <Grid container spacing={2} sx={{ marginTop: 2, width: '100%', paddingX: '16px', boxSizing: 'border-box' }}>
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
        <Button variant="contained" color="primary" onClick={onConnectNewDevice}>Connect New Device</Button>
      </Box>
    </Box>
  );
};

export default SummaryView;