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

function App() {
  // State for inputs and results
  const [sku, setSku] = useState("SKU_A");
  const [region, setRegion] = useState("North");
  const [weatherDesc, setWeatherDesc] = useState("");
  const [event, setEvent] = useState("concert");
  const [buzz, setBuzz] = useState(60);
  const [prediction, setPrediction] = useState(null);
  const [buzzTrendData, setBuzzTrendData] = useState([]);

  const [totalStock, setTotalStock] = useState(300);
  const [demand, setDemand] = useState({
    North: 100,
    South: 90,
    East: 80,
    West: 110,
  });
  const [allocation, setAllocation] = useState(null);

  // Fetch live weather when region changes
  const fetchWeather = async (regionName) => {
    const API_KEY = "1ddfe6d3b7f014a1bf35d2b1ccf87d39"; 
    const cityMap = {
      North: "New York",
      South: "Miami",
      East: "Boston",
      West: "San Francisco",
    };
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityMap[regionName]}&appid=${API_KEY}`
      );
      const desc = res.data.weather[0].main.toLowerCase();
      setWeatherDesc(desc);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setWeatherDesc("unavailable");
    }
  };

  // Update region and fetch its weather
  const handleRegionChange = (e) => {
    const selected = e.target.value;
    setRegion(selected);
    fetchWeather(selected);
  };

  // Initialize weather on mount
  useEffect(() => {
    fetchWeather(region);
  }, []);

  // Demand prediction API call
  const predictDemand = async () => {
    console.log("Predict button clicked");
    try {
      const params = new URLSearchParams({
        sku,
        region,
        weather: weatherDesc,
        event,
        buzz_score: buzz,
      });
      const res = await axios.get(`http://localhost:8080/predict-demand?${params.toString()}`);
      const predicted = res.data.predicted_demand;
      setPrediction(predicted);
      console.log("Current weather in", region, "is", weatherDesc);
      setBuzzTrendData((prev) => [...prev, { buzz, predicted }]);
    } catch (err) {
      console.error("Prediction error:", err);
      alert("Prediction failed");
    }
  };

  // Stock optimization API call
  const optimizeStock = async () => {
    try {
      const res = await axios.post("http://localhost:8080/optimize-stock", {
        predictions: demand,
        total_stock: totalStock,
      });
      setAllocation(res.data.allocation);
    } catch (err) {
      alert("Optimization failed");
    }
  };

  return (
    <div className="App">
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
          <select value={region} onChange={handleRegionChange}>
            <option>North</option>
            <option>South</option>
            <option>East</option>
            <option>West</option>
          </select>
        </div>

        <div className="form-row">
          <label>Live Weather:</label>
          <span className="weather">{weatherDesc}</span>
        </div>

        <div className="form-row">
          <label>Event:</label>
          <select value={event} onChange={(e) => setEvent(e.target.value)}>
            <option>none</option>
            <option>concert</option>
            <option>sports</option>
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

        <button className="primary-btn" onClick={predictDemand}>
          Predict
        </button>

        {prediction !== null && (
          <p className="result">
            📈 Predicted Demand: <strong>{prediction} units</strong>
          </p>
        )}

        {buzzTrendData.length > 1 && (
          <div className="chart-container">
            <h3>📊 Buzz vs Demand Trend</h3>
            <LineChart width={600} height={300} data={buzzTrendData}>
              <CartesianGrid stroke="#ccc" />
              <XAxis
                dataKey="buzz"
                label={{
                  value: "Buzz Score",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                label={{ value: "Predicted Demand", angle: -90, position: "insideLeft" }}
              />
              <Tooltip />
              <Line type="monotone" dataKey="predicted" stroke="#007BFF" />
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
              onChange={(e) =>
                setDemand({ ...demand, [r]: Number(e.target.value) })
              }
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
        <button className="primary-btn" onClick={optimizeStock}>
          Optimize
        </button>

        {allocation && (
          <div className="chart-container">
            <h3>📦 Allocated Stock per Region</h3>
            <BarChart
              width={600}
              height={300}
              data={Object.entries(allocation).map(([r, v]) => ({ region: r, value: v }))}
            >
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#28a745" />
            </BarChart>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
