import { useState } from "react";
import axios from "axios";

function ConnectForm({ onConnect }) {
  const [config, setConfig] = useState({
    host: "localhost",
    port: "8123",
    user: "default",
    jwt: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Connecting...");
    try {
      const response = await axios.post(
        "http://localhost:8080/api/connect",
        config
      );
      if (response.data.status === "Connected") {
        setStatus("Connected!");
        onConnect();
      } else {
        setStatus(`Error: ${response.data.error}`);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Connect to ClickHouse</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Host:</label>
          <input
            type="text"
            name="host"
            value={config.host}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Port:</label>
          <input
            type="text"
            name="port"
            value={config.port}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>User:</label>
          <input
            type="text"
            name="user"
            value={config.user}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>JWT/Password:</label>
          <input
            type="text"
            name="jwt"
            value={config.jwt}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Connect</button>
      </form>
      <p>{status}</p>
    </div>
  );
}

export default ConnectForm;
