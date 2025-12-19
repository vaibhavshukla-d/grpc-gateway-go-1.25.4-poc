import { useState, useEffect, useRef } from 'react';

// WebSocket Streaming Component
export default function WebSocketStreamingComponent() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const outputRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      addLog('Already connected!', 'info');
      return;
    }

    setStatus('connecting');
    addLog('Connecting to WebSocket...', 'info');
    setUsers([]);

    // Use proper WebSocket URL with query parameters if needed
    const ws = new WebSocket('ws://localhost:8080/v1/users');
    wsRef.current = ws;

    ws.onopen = () => {
      addLog('✓ WebSocket connection established', 'success');
      setStatus('connected');
      addLog('Listening for streaming data...', 'info');
      
      // Send initial request to start streaming
      // For grpc-websocket-proxy, we may need to send an empty JSON object
      try {
        ws.send(JSON.stringify({}));
        addLog('📤 Sent initial request to start stream', 'info');
      } catch (e) {
        addLog('⚠️ Error sending initial request: ' + e.message, 'error');
      }
    };

    ws.onmessage = (event) => {
      try {
        addLog('📦 Raw message: ' + event.data, 'data');
        
        // grpc-websocket-proxy sends newline-delimited JSON
        // Split by newline in case multiple messages come at once
        const messages = event.data.trim().split('\n').filter(msg => msg.length > 0);
        
        messages.forEach(msg => {
          try {
            const data = JSON.parse(msg);
            addLog(`📨 Parsed: ${JSON.stringify(data)}`, 'success');
            
            // Check for result field (grpc-websocket-proxy format)
            const user = data.result || data;
            
            if (user.id && user.name) {
              setUsers(prev => [...prev, user]);
              addLog(`👤 User #${user.id}: ${user.name}`, 'success');
            }
          } catch (parseErr) {
            addLog('⚠️ Parse error for message: ' + parseErr.message, 'error');
          }
        });
      } catch (e) {
        addLog('⚠️ Message processing error: ' + e.message, 'error');
      }
    };

    ws.onerror = () => {
      addLog('❌ WebSocket error occurred', 'error');
    };

    ws.onclose = (event) => {
      addLog(`Connection closed (code: ${event.code})`, 'info');
      setStatus('disconnected');
      wsRef.current = null;
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      addLog('Closing connection...', 'info');
      // Close with proper status code
      wsRef.current.close(1000, 'Client closing connection');
    }
  };

  const clearOutput = () => {
    setLogs([]);
    setUsers([]);
    addLog('Console cleared', 'info');
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    addLog('Component mounted - Ready to connect', 'info');
    addLog('Make sure gRPC server is running on localhost:8080', 'info');
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'connecting': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'data': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        🌐 WebSocket Streaming Console
      </h3>
      
      <div className={`p-3 rounded mb-4 font-semibold ${getStatusColor()}`}>
        Status: {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={connectWebSocket}
          disabled={status === 'connected'}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 transition"
        >
          Connect & Stream
        </button>
        <button
          onClick={disconnectWebSocket}
          disabled={status !== 'connected'}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 transition"
        >
          Disconnect
        </button>
        <button
          onClick={clearOutput}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Clear Console
        </button>
      </div>

      {users.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
          <h4 className="font-semibold mb-2 text-blue-900">
            📋 Received Users ({users.length}):
          </h4>
          <div className="space-y-1">
            {users.map((user, idx) => (
              <div key={idx} className="py-1 px-2 bg-white rounded text-gray-700">
                <span className="font-mono text-sm text-blue-600">#{user.id}</span>
                {' '}→{' '}
                <span className="font-semibold">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-2 text-sm text-gray-600 font-semibold">
        Console Output:
      </div>
      <div 
        ref={outputRef}
        className="bg-gray-900 text-gray-300 p-4 rounded font-mono text-sm h-96 overflow-y-auto"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Click "Connect & Stream" to start.</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="mb-2 leading-relaxed">
              <span className="text-gray-500 text-xs">[{log.timestamp}]</span>{' '}
              <span className={getLogColor(log.type)}>{log.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
        <p><strong>Endpoint:</strong> ws://localhost:8080/v1/users/list</p>
        <p className="mt-1"><strong>Note:</strong> This component uses WebSocket to receive streaming data from your gRPC server</p>
      </div>
    </div>
  );
}