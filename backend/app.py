from utils.trends import get_google_trend_score

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
from model.stock_optimizer import optimize_stock
from services.ticketmaster_service import get_local_events
from services.weather_service import get_current_weather 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Load ML model and encoder
model = joblib.load('model/demand_model.pkl')
encoder = joblib.load('model/encoder.pkl')

# Helper: Map raw weather condition to model-compatible values
def map_weather_condition(condition):
    ev = (condition or '').lower()
    if ev in ['clear']:
        return 'sunny'
    elif ev in ['rain', 'drizzle', 'thunderstorm']:
        return 'rainy'
    elif ev in ['clouds', 'mist', 'fog', 'haze', 'smoke', 'snow', 'sleet']:
        return 'cold'
    else:
        return 'hot'

# Helper: Map raw event titles to model categories
def map_event(raw_event):
    ev = (raw_event or '').lower()
    if any(keyword in ev for keyword in ['concert', 'music', 'festival']):
        return 'concert'
    elif any(keyword in ev for keyword in ['sport', 'game', 'match', 'tournament']):
        return 'sports'
    else:
        return 'none'

@app.route('/')
def home():
    return 'WalPredict API Running!'

@app.route('/get-weather', methods=['POST'])
def fetch_weather():
    data = request.get_json() or {}
    region = data.get('region')
    if not region:
        return jsonify({'error': 'Region is required'}), 400

    # Placeholder for weather service
    raw_condition = 'clear'
    weather = map_weather_condition(raw_condition)
    return jsonify({'raw_weather': raw_condition, 'weather': weather})

@app.route('/get-events', methods=['POST'])
def fetch_events():
    data = request.get_json() or {}
    region = data.get('region')
    if not region:
        return jsonify({'error': 'Region is required'}), 400

    events = get_local_events(region, size=7)
    return jsonify({'events': events})

@app.route('/predict-demand', methods=['POST'])
def predict_demand():
    try:
        data = request.get_json() or {}
        print("\U0001F50D REQUEST DATA:", data)

        sku = data.get('sku')
        region = data.get('region')
        raw_weather = data.get('weather')
        weather = map_weather_condition(raw_weather)
        raw_event = data.get('event')
        event = map_event(raw_event)
        buzz_score = data.get('buzz_score')

        if buzz_score is None:
            buzz_score = get_google_trend_score(sku)

        if not all([sku, region, weather, event]) or buzz_score is None:
            return jsonify({'error': 'Missing required fields'}), 400

        df = pd.DataFrame([{ 'sku': sku,
                             'region': region,
                             'weather': weather,
                             'event': event,
                             'buzz_score': buzz_score }])
        print("\U0001F50D MODEL INPUT DF:\n", df)

        encoded = encoder.transform(df[['sku','region','weather','event']])
        encoded_df = pd.DataFrame(encoded, columns=encoder.get_feature_names_out())
        X = pd.concat([encoded_df, df[['buzz_score']]], axis=1)
        print("\U0001F50D FINAL MODEL INPUT:\n", X)

        prediction = model.predict(X)[0]
        print("\U0001F50D PREDICTION:", prediction)
        return jsonify({'predicted_demand': int(prediction)})

    except Exception as e:
        print("❌ ERROR in /predict-demand:", repr(e))
        return jsonify({'error': str(e)}), 500

@app.route('/optimize-stock', methods=['POST'])
def stock_allocation():
    try:
        data = request.get_json() or {}
        predictions = data.get('predictions')
        total_stock = data.get('total_stock')
        if not predictions or total_stock is None:
            return jsonify({'error': 'Missing predictions or total_stock'}), 400

        allocation = optimize_stock(predictions, total_stock)
        return jsonify({'allocation': allocation})

    except Exception as e:
        print("❌ ERROR in /optimize-stock:", repr(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)
