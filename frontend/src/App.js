import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
} from "chart.js";
import "./App.css";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title);

function App() {
  const [packetsByInterface, setPacketsByInterface] = useState({});
  const [cpuUsage, setCpuUsage] = useState([]);
  const [scanResults, setScanResults] = useState([]);
  const [target, setTarget] = useState("");
  const [customPorts, setCustomPorts] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const predefinedPorts = [80, 443, 3306];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packetRes, systemRes] = await Promise.all([
          axios.get("http://localhost:5000/api/packets"),
          axios.get("http://localhost:5000/api/system"),
        ]);

        setPacketsByInterface(packetRes.data || {});
        setCpuUsage(systemRes.data["CPU History"] || []);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Error fetching data. Please check the backend.");
      }
    };

    const interval = setInterval(fetchData, 2000);
    fetchData(); // Initial fetch
    return () => clearInterval(interval);
  }, []);

  const handleScan = async () => {
    if (!target) {
      alert("Please enter a valid target IP.");
      return;
    }

    let ports = [...predefinedPorts];

    if (customPorts) {
      const customPortsArray = customPorts
        .split(",")
        .map((port) => port.trim())
        .filter((port) => !isNaN(port) && port > 0 && port <= 65535)
        .map(Number);
      ports = [...ports, ...customPortsArray];
    }

    if (ports.length === 0) {
      alert("Please enter some valid ports.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/scan", { target, ports });
      setScanResults(res.data || []);
    } catch (error) {
      console.error("Error scanning ports:", error);
      alert("Port scan failed. Please check the target IP and try again.");
    }
  };

  const getPortService = (port) => {
    const services = {
      80: "HTTP",
      443: "HTTPS",
      3306: "MySQL",
    };
    return services[port] || "Unknown Service";
  };

  return (
    <div className="app-container">
      <h1 className="header">Network Packet Sniffer & Scanner</h1>

      {/* Packet Analysis */}
      <section className="section">
        <h2>Packet Analysis</h2>
        <p className="last-updated">Last Updated: {format(lastUpdated, "Pp")}</p>

        {Object.keys(packetsByInterface).length > 0 ? (
          Object.entries(packetsByInterface).map(([iface, packets]) => (
            <div key={iface} className="interface-section">
              <h3>Interface: {iface}</h3>
              <ul className="packet-list">
                {packets.map((packet, index) => (
                  <li key={index}>
                    {packet["Source"]} → {packet["Destination"]} [{packet["Protocol"]}]
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p>No packets detected.</p>
        )}
      </section>

      {/* CPU Usage */}
      <section className="section">
        <h2>CPU Usage</h2>
        {cpuUsage.length > 0 ? (
          <Line
            data={{
              labels: cpuUsage.map((_, i) => i + 1),
              datasets: [
                {
                  label: "CPU Usage (%)",
                  data: cpuUsage,
                  borderColor: "rgba(75,192,192,1)",
                  fill: false,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: "CPU Usage Over Time",
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: "Time (seconds)",
                  },
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "CPU Usage (%)",
                  },
                },
              },
            }}
          />
        ) : (
          <p>Loading CPU usage...</p>
        )}
      </section>

      {/* Port Scanner */}
      <section className="section">
        <h2>Port Scanner</h2>
        <input
          className="target-input"
          type="text"
          placeholder="Target IP"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <div className="port-range">
          <label>Predefined Ports: 80 (HTTP), 443 (HTTPS), 3306 (MySQL)</label>
          <br />
          <input
            className="port-input"
            type="text"
            placeholder="Enter custom ports (comma separated)"
            value={customPorts}
            onChange={(e) => setCustomPorts(e.target.value)}
          />
        </div>
        <button className="scan-btn" onClick={handleScan}>
          Scan
        </button>

        {scanResults.length > 0 && (
          <table className="scan-results-table">
            <thead>
              <tr>
                <th>Port Number</th>
                <th>Port Service</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scanResults.map((result, index) => (
                <tr key={index}>
                  <td>{result.Port}</td>
                  <td>{getPortService(result.Port)}</td>
                  <td>{result.Status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
