import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import "./App.css";

const regionCityMap = {
  North: "New York",
  South: "Houston",
  East: "Boston",
  West: "Los Angeles",
};

const WEATHER_API_KEY = "85091dab5afb943e699dbb7519b302bc";

function App() {
  const [sku, setSku] = useState("SKU_A");
  const [region, setRegion] = useState("North");
  const [eventOptions, setEventOptions] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("none");
  const [buzz, setBuzz] = useState(60);
  const [prediction, setPrediction] = useState(null);
  const [weather, setWeather] = useState("loading...");
  const [buzzTrendData, setBuzzTrendData] = useState([]);

  const [totalStock, setTotalStock] = useState(300);
  const [demand, setDemand] = useState({ North: 100, South: 90, East: 80, West: 110 });
  const [allocation, setAllocation] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const city = regionCityMap[region];
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
        );
        setWeather(res.data.weather[0].main.toLowerCase());
      } catch {
        setWeather("unknown");
      }
    };

    const fetchEvents = async () => {
      try {
        const res = await axios.post("http://localhost:8000/get-events", { region });
        const opts = res.data.events.map((e) => e.toLowerCase());
        setEventOptions(opts);
        const firstEvent = opts[0] || "none";
        setSelectedEvent(firstEvent);
        const buzzScore = Math.min(100, 20 + opts.length * 8);
        setBuzz(buzzScore);
      } catch {
        setEventOptions(["none"]);
        setSelectedEvent("none");
        setBuzz(40);
      }
    };

    fetchWeather();
    fetchEvents();
  }, [region]);

  const predictDemand = async () => {
    try {
      const res = await axios.post("http://localhost:8000/predict-demand", {
        sku,
        region,
        weather,
        event: selectedEvent,
        buzz_score: buzz,
      });
      const predicted = res.data.predicted_demand;
      setPrediction(predicted);
      setBuzzTrendData((prev) => [...prev, { buzz, predicted }]);
    } catch {
      alert("Prediction failed");
    }
  };

  const optimizeStock = async () => {
    try {
      const res = await axios.post("http://localhost:8000/optimize-stock", {
        predictions: demand,
        total_stock: totalStock,
      });
      setAllocation(res.data.allocation);
    } catch {
      alert("Optimization failed");
    }
  };

  return (
    <div className="App dark-theme">
      <header className="header">
        <h1>📦 WalPredict Stock Intelligence</h1>
        <p>AI-Powered Demand Forecasting & Stock Optimization</p>
      </header>

      <div className="card">
        <h2>🔮 Predict Demand</h2>
        <div className="form-row">
          <label>SKU:</label>
          <select value={sku} onChange={(e) => setSku(e.target.value)}>
            <option>SKU_A</option>
            <option>SKU_B</option>
            <option>SKU_C</option>
          </select>
        </div>

        <div className="form-row">
          <label>Region:</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option>North</option>
            <option>South</option>
            <option>East</option>
            <option>West</option>
          </select>
        </div>

        <div className="form-row">
          <label>Live Weather:</label>
          <span className="data-tag">{weather}</span>
        </div>

        <div className="form-row">
          <label>Event:</label>
          <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            {eventOptions.map((ev, idx) => (
              <option key={idx} value={ev}>{ev}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>Buzz Score: {buzz}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={buzz}
            onChange={(e) => setBuzz(Number(e.target.value))}
          />
        </div>

        <button className="primary-btn" onClick={predictDemand}>Predict</button>

        {prediction !== null && (
          <p className="result">
            📈 Predicted Demand: <strong>{prediction} units</strong>
          </p>
        )}

        {buzzTrendData.length > 1 && (
          <div className="chart-container">
            <h3>📊 Buzz vs Demand Trend</h3>
            <LineChart width={600} height={300} data={buzzTrendData}>
              <CartesianGrid stroke="#555" />
              <XAxis dataKey="buzz" stroke="#00fff7" />
              <YAxis stroke="#00fff7" />
              <Tooltip />
              <Line type="monotone" dataKey="predicted" stroke="#00c2ff" strokeWidth={2} />
            </LineChart>
          </div>
        )}
      </div>

      <div className="card">
        <h2>📊 Stock Optimization</h2>
        {Object.keys(demand).map((r) => (
          <div className="form-row" key={r}>
            <label>{r} Demand:</label>
            <input
              type="number"
              value={demand[r]}
              onChange={(e) => setDemand({ ...demand, [r]: Number(e.target.value) })}
            />
          </div>
        ))}

        <div className="form-row">
          <label>Total Stock:</label>
          <input
            type="number"
            value={totalStock}
            onChange={(e) => setTotalStock(Number(e.target.value))}
          />
        </div>

        <button className="primary-btn" onClick={optimizeStock}>Optimize</button>

        {allocation && (
          <div className="chart-container">
            <h3>📦 Allocated Stock per Region</h3>
            <BarChart width={600} height={300} data={Object.entries(allocation).map(([r, v]) => ({ region: r, value: v }))}>
              <CartesianGrid stroke="#555" />
              <XAxis dataKey="region" stroke="#00fff7" />
              <YAxis stroke="#00fff7" />
              <Tooltip />
              <Bar dataKey="value" fill="#39ff14" />
            </BarChart>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
