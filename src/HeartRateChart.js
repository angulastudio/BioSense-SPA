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
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: 'HRV (RMSSD)',
        data: hrvData,
        fill: false,
        backgroundColor: 'rgb(54, 162, 235)',
        borderColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y1',
      }
    ],
  };

  const options = {
    animation: {
      duration: 0, // general animation time
    },
    hover: {
      animationDuration: 0, // duration of animations when hovering an item
    },
    responsiveAnimationDuration: 0, // animation duration after a resize
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
  };

  return <Line data={chartData} options={options} />;
};

export default HeartRateChart;