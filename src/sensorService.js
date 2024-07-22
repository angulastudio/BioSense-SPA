const UUID_HEART_RATE_SERVICE = 'heart_rate';
const UUID_HEART_RATE_MEASUREMENT = 'heart_rate_measurement';

export let device, server, service, characteristic;

/**
 * Cleans RR intervals to remove artifacts.
 * @param {Array} rrIntervals - Array of RR intervals.
 * @returns {Array} - Cleaned RR intervals.
 */
const cleanRrIntervals = (rrIntervals) => {
	if (rrIntervals.length < 3) {
		return rrIntervals;
	}
	rrIntervals = rrIntervals.filter((val, i, arr) => {
		return i === 0 || (val > arr[i - 1] * 0.8 && val < arr[i - 1] * 1.2);
	});
	return rrIntervals;
};

/**
 * Calculates RMSSD (Root Mean Square of Successive Differences) from RR intervals.
 * @param {Array} rrIntervals - Array of RR intervals.
 * @returns {number|null} - RMSSD value or null if not enough intervals.
 */
const calculateRmssd = (rrIntervals) => {
	if (rrIntervals.length < 2) {
		return null;
	}
	const differences = rrIntervals.slice(1).map((val, i) => val - rrIntervals[i]);
	const squaredDifferences = differences.map(val => val ** 2);
	const meanSquaredDifference = squaredDifferences.reduce((acc, curr) => acc + curr, 0) / squaredDifferences.length;
	return Math.sqrt(meanSquaredDifference);
};

/**
 * Scales ln(RMSSD) to a 0-100 range.
 * @param {number} lnRmssd - Natural logarithm of RMSSD.
 * @returns {number} - Scaled HRV value.
 */
const scaleHrvTo100 = (lnRmssd) => {
	const minLnRmssd = 0;
	const maxLnRmssd = 6.5;
	return Math.min(100, Math.max(0, ((lnRmssd - minLnRmssd) / (maxLnRmssd - minLnRmssd)) * 100));
};

/**
 * Parses heart rate data from the Bluetooth characteristic value.
 * @param {DataView} value - Bluetooth characteristic value.
 * @returns {number} - Heart rate value.
 */
const parseHeartRateData = (value) => {
	const flags = value.getUint8(0);
	let heartRate;

	if (flags & 0x1) {
		heartRate = value.getUint16(1, true);
	} else {
		heartRate = value.getUint8(1);
	}
	return heartRate;
};

/**
 * Parses RR peaks data from the Bluetooth characteristic value.
 * @param {DataView} value - Bluetooth characteristic value.
 * @returns {Array} - Array of RR intervals in milliseconds.
 */
const parseRrPeaksData = (value) => {
	const flags = value.getUint8(0);
	const rrPresent = (flags & 0x10) >> 4;
	let rrValues = [];

	if (rrPresent) {
		let index = 2;
		while (index < value.byteLength) {
			const rrInterval = value.getUint16(index, true);
			rrValues.push(rrInterval / 1024.0 * 1000); // Convert to ms
			index += 2;
		}
	}
	return rrValues;
};

/**
 * Scans for Bluetooth devices supporting the Heart Rate service.
 * @param {function} onDeviceFound - Callback function to handle found devices.
 */
export const scanForDevices = async (onDeviceFound) => {
    try {
        console.log('Requesting Bluetooth Device Scan...');
        const options = {
            filters: [{ services: [UUID_HEART_RATE_SERVICE] }],
            acceptAllAdvertisements: true
        };

        const scan = await navigator.bluetooth.requestLEScan(options);

        navigator.bluetooth.addEventListener('advertisementreceived', (event) => {
            const device = event.device;
            console.log('Device found:', device);
            onDeviceFound(device);
        });

        return scan;
    } catch (error) {
        console.error('Error scanning for devices:', error);
        throw error;
    }
};

/**
 * Connects to the Bluetooth device and sets up notifications for heart rate measurements.
 * @param {function} handleCharacteristicValueChanged - Callback function to handle characteristic value changes.
 * @returns {Promise<object>} - Object containing the device, server, service, and characteristic.
 */
export const connectToDevice = async (handleCharacteristicValueChanged) => {
	try {
		console.log('Requesting Bluetooth Device...');
		device = await navigator.bluetooth.requestDevice({
			filters: [{ services: [UUID_HEART_RATE_SERVICE] }],
			optionalServices: [UUID_HEART_RATE_SERVICE]
		});

		console.log('Connecting to GATT Server...');
		server = await device.gatt.connect();

		console.log('Getting Heart Rate Service...');
		service = await server.getPrimaryService(UUID_HEART_RATE_SERVICE);

		console.log('Getting Heart Rate Characteristic...');
		characteristic = await service.getCharacteristic(UUID_HEART_RATE_MEASUREMENT);

		await characteristic.startNotifications();
		characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

		return { device, server, service, characteristic };
	} catch (error) {
		console.error('Error connecting to device:', error);
		throw error;
	}
};

/**
 * Toggles the pause state of the heart rate notifications.
 * @param {boolean} isPaused - Current pause state.
 * @param {function} handleCharacteristicValueChanged - Callback function to handle characteristic value changes.
 */
export const togglePause = async (isPaused, handleCharacteristicValueChanged) => {
	if (isPaused) {
		await characteristic.startNotifications();
		characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
	} else {
		await characteristic.stopNotifications();
		characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
	}
};

/**
 * Stops notifications and disconnects from the Bluetooth device.
 * @param {function} handleCharacteristicValueChanged - Callback function to handle characteristic value changes.
 */
export const stopAndDisconnect = async (handleCharacteristicValueChanged) => {
	try {
		await characteristic.stopNotifications();
		characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
		await server.disconnect();
	} catch (error) {
		console.error('Error disconnecting:', error);
		throw error;
	}
};

/**
 * Handles characteristic value changes for heart rate measurements.
 * @param {Event} event - The event triggered by a characteristic value change.
 * @param {function} setHeartRate - Function to set heart rate state.
 * @param {function} setRrPeaks - Function to set RR peaks state.
 * @param {function} setHeartRateData - Function to set heart rate data state.
 * @param {function} setHrvData - Function to set HRV data state.
 */
export const handleCharacteristicValueChanged = (event, setHeartRate, setRrPeaks, setHeartRateData, setHrvData) => {
	const value = event.target.value;
	const heartRateValue = parseHeartRateData(value);
	let rrPeakValues = parseRrPeaksData(value);

	// Round RR peaks to 2 decimal places
	rrPeakValues = rrPeakValues.map(rr => Math.round(rr * 100) / 100);

	setHeartRate(heartRateValue);
	setHeartRateData((prevData) => [...prevData, heartRateValue]);
	setRrPeaks((prevData) => [
		...prevData,
		...rrPeakValues.map(interval => [interval, Date.now()])
	]);

	calculateHrv(rrPeakValues, setRrPeaks, setHrvData);
};

/**
 * Calculates HRV (Heart Rate Variability) based on RR intervals.
 * @param {Array} rrIntervals - Array of RR intervals.
 * @param {function} setRrPeaks - Function to set RR peaks state.
 * @param {function} setHrvData - Function to set HRV data state.
 */
export const calculateHrv = (rrIntervals, setRrPeaks, setHrvData) => {
	setRrPeaks((prevRrPeaks) => {
		// Ensure rrIntervals is an array
		if (!Array.isArray(rrIntervals)) {
			rrIntervals = [rrIntervals];
		}

		// Add timestamp to each RR interval
		const currentTime = Date.now();
		const newRrPeaks = [
			...prevRrPeaks, 
			...rrIntervals.map(interval => [interval, currentTime])
		];

		// Filter out old intervals
		const recentRrPeaks = newRrPeaks.filter(([, timestamp]) => currentTime - timestamp <= 15000);

		// Extract only the intervals for HRV calculation
		const rrValues = recentRrPeaks.map(([interval]) => interval);
		const cleanedRrValues = cleanRrIntervals(rrValues);
		const rmssd = calculateRmssd(cleanedRrValues);

		if (rmssd !== null) {
			const lnRmssd = Math.log(rmssd);
			const scaledHrv = scaleHrvTo100(lnRmssd);
			const roundedHrv = Math.round(scaledHrv * 100) / 100; // Round to 2 decimal places
			setHrvData((prevHrvData) => [...prevHrvData, roundedHrv]);
		}

		return recentRrPeaks;
	});
};