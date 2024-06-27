import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const HeartRateChart = ({ data }) => {
  const chartData = {
    labels: data.map((_, index) => index), // Genera etiquetas basadas en el índice
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: data,
        fill: false,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: false
      }
    },
    animation: false,
  };

  return <Line data={chartData} options={options} />;
};

export default HeartRateChart;