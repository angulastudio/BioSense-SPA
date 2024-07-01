import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const HeartRateChart = ({ heartRateData, hrvData }) => {
  const chartData = {
    labels: heartRateData.map((_, index) => index),
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: heartRateData,
        fill: false,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'HRV',
        data: hrvData,
        fill: false,
        backgroundColor: 'rgb(54, 162, 235)',
        borderColor: 'rgba(54, 162, 235, 0.5)',
        yAxisID: 'y1',
      }
    ],
  };

  const options = {
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      }
    },
    animation: false,
  };

  return <Line data={chartData} options={options} />;
};

export default HeartRateChart;