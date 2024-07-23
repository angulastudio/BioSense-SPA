import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(...registerables, annotationPlugin);

const HeartRateChart = ({ heartRateData, hrvData, tags, maxMinData, isSummary = false }) => {
  const MAX_TIME_WINDOW = 60; // 60 seconds
  const dataLength = heartRateData.length;

  let filteredHeartRateData = heartRateData;
  let filteredHrvData = hrvData;
  let filteredTags = tags;

  if (!isSummary && dataLength > MAX_TIME_WINDOW) {
    filteredHeartRateData = heartRateData.slice(dataLength - MAX_TIME_WINDOW);
    filteredHrvData = hrvData.slice(dataLength - MAX_TIME_WINDOW);
    filteredTags = tags.filter(tag => tag.index >= dataLength - MAX_TIME_WINDOW);
  }

  const chartData = {
    labels: filteredHeartRateData.map((_, index) => dataLength > MAX_TIME_WINDOW && !isSummary ? dataLength - MAX_TIME_WINDOW + index + 1 : index + 1),
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: filteredHeartRateData,
        fill: false,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: 'HRV (RMSSD)',
        data: filteredHrvData,
        fill: false,
        backgroundColor: 'rgb(54, 162, 235)',
        borderColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y1',
      }
    ],
  };

  const annotations = filteredTags.map(tag => ({
    type: 'line',
    xMin: dataLength > MAX_TIME_WINDOW && !isSummary ? tag.index - (dataLength - MAX_TIME_WINDOW) + 1 : tag.index + 1,
    xMax: dataLength > MAX_TIME_WINDOW && !isSummary ? tag.index - (dataLength - MAX_TIME_WINDOW) + 1 : tag.index + 1,
    borderColor: tag.color,
    borderWidth: 2,
    label: {
      enabled: true,
      content: tag.type,
      position: 'start'
    }
  }));

  if (maxMinData) {
    const { maxHR, minHR, maxHRIndex, minHRIndex, maxHRV, minHRV, maxHRVIndex, minHRVIndex, averageHR, averageHRV } = maxMinData;
    annotations.push(
      {
        type: 'point',
        xValue: dataLength > MAX_TIME_WINDOW && !isSummary ? maxHRIndex - (dataLength - MAX_TIME_WINDOW) + 1 : maxHRIndex + 1,
        yValue: maxHR,
        backgroundColor: 'red',
        radius: 5,
        label: {
          enabled: true,
          content: `Max HR: ${maxHR}`,
          position: 'top'
        },
        yScaleID: 'y'
      },
      {
        type: 'point',
        xValue: dataLength > MAX_TIME_WINDOW && !isSummary ? minHRIndex - (dataLength - MAX_TIME_WINDOW) + 1 : minHRIndex + 1,
        yValue: minHR,
        backgroundColor: 'red',
        radius: 5,
        label: {
          enabled: true,
          content: `Min HR: ${minHR}`,
          position: 'bottom'
        },
        yScaleID: 'y'
      },
      {
        type: 'point',
        xValue: dataLength > MAX_TIME_WINDOW && !isSummary ? maxHRVIndex - (dataLength - MAX_TIME_WINDOW) + 1 : maxHRVIndex + 1,
        yValue: maxHRV,
        backgroundColor: 'blue',
        radius: 5,
        label: {
          enabled: true,
          content: `Max HRV: ${maxHRV}`,
          position: 'top'
        },
        yScaleID: 'y1'
      },
      {
        type: 'point',
        xValue: dataLength > MAX_TIME_WINDOW && !isSummary ? minHRVIndex - (dataLength - MAX_TIME_WINDOW) + 1 : minHRVIndex + 1,
        yValue: minHRV,
        backgroundColor: 'blue',
        radius: 5,
        label: {
          enabled: true,
          content: `Min HRV: ${minHRV}`,
          position: 'bottom'
        },
        yScaleID: 'y1'
      },
      {
        type: 'line',
        yMin: averageHR,
        yMax: averageHR,
        borderWidth: 3,
        borderColor: 'orange',
        label: {
          display: true,
          content: `Avg HR: ${averageHR}`,
          position: 'left',
          backgroundColor: 'orange',
          padding: 10
        }
      },
      {
        type: 'line',
        yMin: averageHRV,
        yMax: averageHRV,
        yScaleID: 'y1',
        borderWidth: 3,
        borderColor: '#8267EF',
        label: {
          display: true,
          content: `Avg HRV: ${averageHRV}`,
          position: 'left',
          backgroundColor: '#8267EF',
          padding: 10
        }
      }
    );
  }

  const options = {
    animation: {
      duration: 0,
    },
    hover: {
      animationDuration: 0,
    },
    responsiveAnimationDuration: 0,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (s)'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Heart Rate'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'HRV'
        }
      }
    },
    plugins: {
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      },
      annotation: {
        annotations: annotations
      },
      legend: {
        onClick: (e, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          const chart = legend.chart;
          chart.getDatasetMeta(index).hidden = !chart.getDatasetMeta(index).hidden;
          chart.update();
        }
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default HeartRateChart;