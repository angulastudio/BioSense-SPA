import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(...registerables, annotationPlugin);

const HeartRateChart = ({ heartRateData, hrvData, tags }) => {
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
      duration: 0,
    },
    hover: {
      animationDuration: 0,
    },
    responsiveAnimationDuration: 0,
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
    plugins: {
      annotation: {
        annotations: tags.map(tag => ({
          type: 'line',
          xMin: tag.index,
          xMax: tag.index,
          // borderColor: 'red',
          borderColor: tag.color,
          borderWidth: 2,
          label: {
            enabled: true,
            content: 'Tag',
            position: 'start'
          }
        }))
      }
    },
  };

  return <Line data={chartData} options={options} />;
};

export default HeartRateChart;