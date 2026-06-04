import { useState, useEffect } from 'react'
import './App.css'

interface AppProps {
  auth?: { isAuthenticated: boolean; user: any; token: string | null };
  eventBus?: any;
}

function App({ auth, eventBus }: AppProps) {
  const [count, setCount] = useState(0)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    if (!eventBus) return;

    // Listen for messages from other MFEs
    const sub = eventBus.on('global:message', (payload: { from: string; text: string }) => {
      setMessages((prev) => [...prev, `[${payload.from}]: ${payload.text}`]);
    });

    return () => sub.unsubscribe();
  }, [eventBus]);

  const sendMessage = () => {
    eventBus?.emit('global:message', {
      from: 'React MFE',
      text: `Hello from React! Count is ${count}`,
    });
  };

  return (
    <div className="mfe-container">
      <h2>⚛️ React Micro Frontend</h2>

      {auth?.isAuthenticated && (
        <div className="auth-info">
          Logged in as: <strong>{auth.user?.username}</strong>
        </div>
      )}

      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>
          count is {count}
        </button>
        <button onClick={sendMessage} className="btn-send">
          Send Message to Other MFEs
        </button>
      </div>

      {messages.length > 0 && (
        <div className="messages">
          <h4>Messages from other MFEs:</h4>
          {messages.map((msg, i) => (
            <div key={i} className="message">{msg}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
