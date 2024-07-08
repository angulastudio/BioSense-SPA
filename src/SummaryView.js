import React from 'react';
import HeartRateChart from './HeartRateChart';

const SummaryView = ({ heartRateData, hrvData, tags, onConnectNewDevice }) => {
  const calculateAverage = (data) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((a, b) => a + b, 0);
    return (sum / data.length).toFixed(2);
  };

  const averageHeartRate = calculateAverage(heartRateData);
  const averageHrv = calculateAverage(hrvData);

  return (
    <div>
      <h1>Resumen</h1>
      <HeartRateChart heartRateData={heartRateData} hrvData={hrvData} tags={tags} />
      <div>
        <p>Promedio de Heart Rate: {averageHeartRate} BPM</p>
        <p>Promedio de HRV: {averageHrv} RMSSD</p>
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
                <td style={{ color: tag.color }}>{tag.type}</td>
                <td>{tag.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={onConnectNewDevice}>Conectar nuevo dispositivo</button>
    </div>
  );
};

export default SummaryView;