from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
from model.stock_optimizer import optimize_stock

app = Flask(__name__)

# ✅ CORS Fix — Allow from localhost:3000
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})

# Load model and encoder
model = joblib.load('model/demand_model.pkl')
encoder = joblib.load('model/encoder.pkl')

# ✅ Weather condition mapper
def map_weather_condition(condition):
    condition = condition.lower()
    if condition in ['clear']:
        return 'sunny'
    elif condition in ['rain', 'drizzle', 'thunderstorm']:
        return 'rainy'
    elif condition in ['clouds', 'mist', 'fog', 'haze', 'smoke']:
        return 'cold'
    elif condition in ['snow', 'sleet']:
        return 'cold'
    else:
        return 'hot'  # fallback if unknown

@app.route('/predict-demand', methods=['POST'])
def predict_demand():
    try:
        print("🔍 /predict-demand endpoint hit")
        data = request.get_json()
        print("Request JSON:", data)

        sku = data.get('sku')
        region = data.get('region')
        raw_weather = data.get('weather')  # raw OpenWeather response
        weather = map_weather_condition(raw_weather)  # mapped to model-compatible value
        event = data.get('event')
        buzz_score = data.get('buzz_score')

        # Ensure all required fields exist
        if not all([sku, region, weather, event, buzz_score is not None]):
            return jsonify({"error": "Missing fields"}), 400

        # Format DataFrame
        df = pd.DataFrame([{
            'sku': sku,
            'region': region,
            'weather': weather,
            'event': event,
            'buzz_score': buzz_score
        }])

        # Encode categorical features
        encoded = encoder.transform(df[['sku', 'region', 'weather', 'event']])
        encoded_df = pd.DataFrame(encoded, columns=encoder.get_feature_names_out())
        X = pd.concat([encoded_df, df[['buzz_score']]], axis=1)

        # Predict
        prediction = model.predict(X)[0]
        return jsonify({'predicted_demand': int(prediction)})

    except Exception as e:
        print("❌ Error in /predict-demand:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/optimize-stock', methods=['POST'])
def stock_allocation():
    try:
        data = request.get_json()
        predictions = data.get('predictions')  
        total_stock = data.get('total_stock')

        if not predictions or total_stock is None:
            return jsonify({"error": "Missing predictions or total_stock"}), 400

        allocation = optimize_stock(predictions, total_stock)
        return jsonify({'allocation': allocation})

    except Exception as e:
        print("❌ Error in /optimize-stock:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/')
def home():
    return 'WalPredict API Running!'

if __name__ == '__main__':
    app.run(debug=True, port=8000)
