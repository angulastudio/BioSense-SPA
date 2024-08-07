import { BleClient, numbersToDataView } from '@capacitor-community/bluetooth-le';

const UUID_HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb'; 
const UUID_HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb'; 

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
    return rrIntervals.filter((val, i, arr) => {
        return i === 0 || (val > arr[i - 1] * 0.8 && val < arr[i - 1] * 1.2);
    });
};

/**
 * Calculates RMSSD (Root Mean Square of Successive Differences) of RR intervals.
 * @param {Array} rrIntervals - Array of RR intervals.
 * @returns {number|null} - RMSSD value or null if there are not enough intervals.
 */
const calculateRmssd = (rrIntervals) => {
    if (rrIntervals.length < 2) {
        return null;
    }
    const differences = rrIntervals.slice(1).map((val, i) => val - rrIntervals[i]);
    const squaredDifferences = differences.map((val) => val ** 2);
    const meanSquaredDifference = squaredDifferences.reduce((acc, curr) => acc + curr, 0) / squaredDifferences.length;
    return Math.sqrt(meanSquaredDifference);
};

/**
 * Scales ln(RMSSD) to a range of 0-100.
 * @param {number} lnRmssd - Natural logarithm of RMSSD.
 * @returns {number} - Scaled HRV value.
 */
const scaleHrvTo100 = (lnRmssd) => {
    const minLnRmssd = 0;
    const maxLnRmssd = 6.5;
    return Math.min(
        100,
        Math.max(0, ((lnRmssd - minLnRmssd) / (maxLnRmssd - minLnRmssd)) * 100)
    );
};

/**
 * Parses heart rate data from the Bluetooth characteristic value.
 * @param {DataView} dataView - Bluetooth characteristic value.
 * @returns {number|null} - Heart rate value or null if invalid.
 */
const parseHeartRateDataWeb = (dataView) => {
    if (!dataView || dataView.byteLength < 2) {
        return null;
    }

    const flags = dataView.getUint8(0);
    let heartRate;

    if (flags & 0x1) {
        if (dataView.byteLength >= 3) { 
            heartRate = dataView.getUint16(1, true);
        } else { 
            return null;
        }
    } else {
        heartRate = dataView.getUint8(1);
    }
    return heartRate;
};

/**
 * Parses RR peaks data from the Bluetooth characteristic value.
 * @param {DataView} dataView - Bluetooth characteristic value.
 * @returns {Array} - Array of RR intervals in milliseconds.
 */
const parseRrPeaksDataWeb = (dataView) => {
    if (!dataView || dataView.byteLength < 3) {
        return [];
    }

    const flags = dataView.getUint8(0);
    const rrPresent = (flags & 0x10) >> 4; // Bit 4 indicates if there is RR data
    let rrValues = [];

    if (rrPresent) {
        let index = 2;
        while (index + 2 <= dataView.byteLength) {
            const rrInterval = dataView.getUint16(index, true);
            rrValues.push(rrInterval / 1024.0 * 1000);
            index += 2;
        }
    }
    return rrValues;
};

/**
 * Parses RR peaks data for mobile.
 * @param {DataView} dataView - Bluetooth characteristic value.
 * @returns {Array} - Array of RR intervals in milliseconds.
 */
const parseHeartRateDataMobile = (dataView) => {
    const length = dataView.byteLength;
    if (length < 2) { 
        return null;
    }

    const flags = dataView.getUint8(0);
    let heartRate;

    if (flags & 0x1) {
        if (length >= 3) {
            heartRate = dataView.getUint16(1, true);
        } else {
            return null;
        }
    } else {
        heartRate = dataView.getUint8(1);
    }

    return heartRate;
};

/**
 * Parses RR peaks data for mobile.
 * @param {DataView} dataView - Bluetooth characteristic value.
 * @returns {Array} - Array of RR intervals in milliseconds.
 */
const parseRrPeaksDataMobile = (dataView) => {
    if (!dataView || dataView.byteLength < 3) {
        return [];
    }

    const flags = dataView.getUint8(0);
    const rrPresent = (flags & 0x10) >> 4;
    let rrValues = [];

    if (rrPresent) {
        let index = 2;
        while (index + 2 <= dataView.byteLength) {
            const rrInterval = dataView.getUint16(index, true);
            rrValues.push((rrInterval / 1024.0) * 1000);
            index += 2;
        }
    }

    return rrValues;
};

/**
 * Detects if the environment is mobile using Capacitor.
 * @returns {boolean} - True if it is a mobile environment.
 */
const isMobilePlatform = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

/**
 * Connects to the Bluetooth device in web environments.
 * @param {function} handleCharacteristicValueChanged - Callback to handle characteristic value changes.
 * @returns {Promise<object>} - Object containing the device, server, service, and characteristic.
 */
const connectToDeviceWeb = async (handleCharacteristicValueChanged) => {
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [UUID_HEART_RATE_SERVICE] }],
            optionalServices: [UUID_HEART_RATE_SERVICE]
        });

        server = await device.gatt.connect();
        service = await server.getPrimaryService(UUID_HEART_RATE_SERVICE);
        characteristic = await service.getCharacteristic(UUID_HEART_RATE_MEASUREMENT);

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

        return { device, server, service, characteristic };
    } catch (error) {
        console.error('Error connecting device:', error);
        throw error;
    }
};

/**
 * Connects to the Bluetooth device using Capacitor on mobile devices.
 * @param {function} handleCharacteristicValueChanged - Callback to handle characteristic value changes.
 * @returns {Promise<object>} - Object containing the device.
 */
const connectToDeviceCapacitor = async (handleCharacteristicValueChanged) => {
    try {
        await BleClient.initialize();

        device = await BleClient.requestDevice({
            services: [UUID_HEART_RATE_SERVICE],
        });

        await BleClient.connect(device.deviceId, () => {});

        await BleClient.startNotifications(
            device.deviceId,
            UUID_HEART_RATE_SERVICE,
            UUID_HEART_RATE_MEASUREMENT,
            (value) => {
                if (!(value instanceof DataView)) {
                    return;
                }

                const heartRateValue = parseHeartRateDataMobile(value);
                const rrValues = parseRrPeaksDataMobile(value);

                console.log('Heart Rate:', heartRateValue);
                console.log('RR Values:', rrValues);

                handleCharacteristicValueChanged({ heartRateValue, rrValues });
            }
        );

        return { device };
    } catch (error) {
        console.error('Error connecting device:', error);
        throw error;
    }
};



/**
 * Connects to the Bluetooth device and sets up notifications for heart rate measurements.
 * @param {function} handleCharacteristicValueChanged - Callback to handle characteristic value changes.
 * @returns {Promise<object>} - Object containing the device, server, service, and characteristic.
 */
export const connectToDevice = async (handleCharacteristicValueChanged) => {
    if (isMobilePlatform()) {
        return connectToDeviceCapacitor(handleCharacteristicValueChanged);
    } else {
        return connectToDeviceWeb(handleCharacteristicValueChanged);
    }
};

/**
 * Toggles the pause state of heart rate notifications.
 * @param {boolean} isPaused - Current pause state.
 * @param {function} handleCharacteristicValueChanged - Callback to handle characteristic value changes.
 */
export const togglePause = async (isPaused, handleCharacteristicValueChanged) => {
    if (isMobilePlatform()) {
        // Lógica de Capacitor para pausar
        if (isPaused) {
            await BleClient.stopNotifications(device.deviceId, UUID_HEART_RATE_SERVICE, UUID_HEART_RATE_MEASUREMENT);
        } else {
            await BleClient.startNotifications(device.deviceId, UUID_HEART_RATE_SERVICE, UUID_HEART_RATE_MEASUREMENT, (value) => {
                if (!(value instanceof ArrayBuffer)) {
                    console.error('Valor recibido no es un ArrayBuffer');
                    return;
                }

                const heartRateValue = parseHeartRateDataMobile(value);
                const rrValues = parseRrPeaksDataMobile(value);
                handleCharacteristicValueChanged({ heartRateValue, rrValues });
            });
        }
    } else {
        // Lógica para la web
        if (isPaused) {
            await characteristic.stopNotifications();
            characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        } else {
            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        }
    }
};

/**
 * Stops notifications and disconnects from the Bluetooth device.
 * @param {function} handleCharacteristicValueChanged - Callback to handle characteristic value changes.
 */
export const stopAndDisconnect = async (handleCharacteristicValueChanged) => {
    try {
        if (isMobilePlatform()) {
            // Lógica de Capacitor para desconectar
            await BleClient.stopNotifications(device.deviceId, UUID_HEART_RATE_SERVICE, UUID_HEART_RATE_MEASUREMENT);
            await BleClient.disconnect(device.deviceId);
            console.log('Dispositivo desconectado en móvil.');
        } else {
            // Lógica para la web
            await characteristic.stopNotifications();
            characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
            server.disconnect();
            console.log('Dispositivo desconectado en web.');
        }
    } catch (error) {
        console.error('Error al desconectar:', error);
        throw error;
    }
};

/**
 * Handles characteristic value changes for heart rate measurements.
 * @param {Event|Object} event - Event triggered by a change in the characteristic value.
 * @param {function} setHeartRate - Function to update the heart rate state.
 * @param {function} setRrPeaks - Function to update the RR peaks state.
 * @param {function} setHeartRateData - Function to update the heart rate data state.
 * @param {function} setHrvData - Function to update the HRV data state.
 */
export const handleCharacteristicValueChanged = (event, setHeartRate, setRrPeaks, setHeartRateData, setHrvData) => {
    let heartRateValue, rrPeakValues;

    if (isMobilePlatform()) {
        heartRateValue = event.heartRateValue;
        rrPeakValues = event.rrValues || [];
    } else {
        const value = event.target.value;
        if (!value) {
            console.error('Evento o valor de notificación inválido');
            return;
        }

        heartRateValue = parseHeartRateDataWeb(value);
        rrPeakValues = parseRrPeaksDataWeb(value);
    }

    rrPeakValues = rrPeakValues.map((rr) => Math.round(rr * 100) / 100);

    if (heartRateValue !== null) {
        setHeartRate(heartRateValue);
        setHeartRateData((prevData) => [...prevData, heartRateValue]);
        setRrPeaks((prevData) => [
            ...prevData,
            ...rrPeakValues.map((interval) => [interval, Date.now()]),
        ]);

        calculateHrv(rrPeakValues, setRrPeaks, setHrvData);
    } else {
        console.error('No se pudo obtener el valor de la frecuencia cardíaca.');
    }
};

/**
 * Calculates HRV (Heart Rate Variability) based on RR intervals.
 * @param {Array} rrIntervals - Array of RR intervals.
 * @param {function} setRrPeaks - Function to update the RR peaks state.
 * @param {function} setHrvData - Function to update the HRV data state.
 */
export const calculateHrv = (rrIntervals, setRrPeaks, setHrvData) => {
    setRrPeaks((prevRrPeaks) => {
        if (!Array.isArray(rrIntervals)) {
            rrIntervals = [rrIntervals];
        }

        const currentTime = Date.now();
        const newRrPeaks = [
            ...prevRrPeaks,
            ...rrIntervals.map((interval) => [interval, currentTime]),
        ];

        const recentRrPeaks = newRrPeaks.filter(
            ([, timestamp]) => currentTime - timestamp <= 15000
        );
        const rrValues = recentRrPeaks.map(([interval]) => interval);
        const cleanedRrValues = cleanRrIntervals(rrValues);
        const rmssd = calculateRmssd(cleanedRrValues);

        if (rmssd !== null) {
            const lnRmssd = Math.log(rmssd);
            const scaledHrv = scaleHrvTo100(lnRmssd);
            const roundedHrv = Math.round(scaledHrv * 100) / 100; // Redondear a 2 decimales
            setHrvData((prevHrvData) => [...prevHrvData, roundedHrv]);
        }

        return recentRrPeaks;
    });
};