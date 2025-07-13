import React, { useState } from "react";
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
  const [sku, setSku] = useState("SKU_A");
  const [region, setRegion] = useState("North");
  const [weather, setWeather] = useState("cold");
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

  const predictDemand = async () => {
    try {
      const res = await axios.post("http://localhost:8000/predict-demand", {
        sku,
        region,
        weather,
        event,
        buzz_score: buzz,
      });
      const predicted = res.data.predicted_demand;
      setPrediction(predicted);
      setBuzzTrendData((prev) => [...prev, { buzz, predicted }]);
    } catch (err) {
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
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option>North</option>
            <option>South</option>
            <option>East</option>
            <option>West</option>
          </select>
        </div>

        <div className="form-row">
          <label>Weather:</label>
          <select value={weather} onChange={(e) => setWeather(e.target.value)}>
            <option>cold</option>
            <option>hot</option>
            <option>sunny</option>
            <option>rainy</option>
          </select>
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
          <p className="result">📈 Predicted Demand: <strong>{prediction} units</strong></p>
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
                label={{
                  value: "Predicted Demand",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Line type="monotone" dataKey="predicted" stroke="#007BFF" />
            </LineChart>
          </div>
        )}
      </div>

      <div className="card">
        <h2>📊 Stock Optimization</h2>
        {["North", "South", "East", "West"].map((r) => (
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
              data={Object.entries(allocation).map(([r, v]) => ({
                region: r,
                value: v,
              }))}
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
