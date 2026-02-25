import { useState, useEffect } from 'react';
import { testConnection } from '../services/api';

export default function BackendStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      const connected = await testConnection();
      setIsConnected(connected);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check on mount
    checkBackendStatus();

    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isChecking && isConnected === null) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
        <div className="size-2 rounded-full bg-stone-400 animate-pulse"></div>
        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Checking...</span>
      </div>
    );
  }

  return (
    <button
      onClick={checkBackendStatus}
      disabled={isChecking}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-primary/50 transition-all cursor-pointer"
      title="Click to refresh backend status"
    >
      <div
        className={`size-2 rounded-full ${
          isConnected
            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
            : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
        } ${isChecking ? 'animate-pulse' : ''}`}
      ></div>
      <span className={`text-xs font-medium ${
        isConnected 
          ? 'text-green-700 dark:text-green-400' 
          : 'text-red-700 dark:text-red-400'
      }`}>
        {isConnected ? 'Backend Online' : 'Backend Offline'}
      </span>
    </button>
  );
}
