import { useState } from "react";
import ConnectForm from "./components/ConnectForm";
import IngestionForm from "./components/IngestionForm";
import "./App.css";

function App() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnected(true);
  };

  return (
    <div className="App">
      <h1>ClickHouse & Flat File Ingestion Tool</h1>
      {!isConnected ? (
        <ConnectForm onConnect={handleConnect} />
      ) : (
        <IngestionForm />
      )}
    </div>
  );
}

export default App;
