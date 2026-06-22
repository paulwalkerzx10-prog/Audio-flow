import { useState } from 'react';

export const useBluetooth = () => {
  const [device, setDevice] = useState<any>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const connectSimulated = () => {
    setIsConnecting(true);
    setError(null);
    setTimeout(() => {
      setDevice({ name: 'AirPods Pro (Simulated)', gatt: { connected: true } });
      setBatteryLevel(87);
      setIsSimulated(true);
      setIsConnecting(false);
    }, 800);
  };

  const connect = async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setError("Bluetooth not supported in this browser. Please use Chrome or Edge, or connect a simulated device.");
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    setIsSimulated(false);
    try {
      const btDevice = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      setDevice(btDevice);
      
      const onDisconnected = () => {
        setDevice(null);
        setBatteryLevel(null);
        setIsSimulated(false);
      };

      btDevice.addEventListener('gattserverdisconnected', onDisconnected);

      if (btDevice.gatt) {
        const server = await btDevice.gatt.connect();
        try {
          const service = await server.getPrimaryService('battery_service');
          const characteristic = await service.getCharacteristic('battery_level');
          const value = await characteristic.readValue();
          setBatteryLevel(value.getUint8(0));

          await characteristic.startNotifications();
          characteristic.addEventListener('characteristicvaluechanged', (e: any) => {
            setBatteryLevel(e.target.value.getUint8(0));
          });
        } catch (e) {
          console.log("No battery service found on this Bluetooth device.", e);
        }
      }
    } catch (err: any) {
      if (err.name === 'SecurityError' || (err.message && err.message.includes('permissions policy'))) {
        console.warn("Bluetooth permission disallowed by policy in iframe:", err.message);
        setError("Bluetooth access is disallowed in this embedded view. Open the app in a new tab for direct Bluetooth, or use SIMULATION to test the feature below.");
      } else {
        console.error("Bluetooth connection failure:", err);
        setError(err.message || "Failed to connect to Bluetooth device.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (device?.gatt?.connected && !isSimulated) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setBatteryLevel(null);
    setIsSimulated(false);
  };

  return { device, batteryLevel, isConnecting, error, connect, connectSimulated, disconnect, isSimulated };
};

