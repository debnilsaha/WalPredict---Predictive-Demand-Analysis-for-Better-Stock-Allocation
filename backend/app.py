from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
from model.stock_optimizer import optimize_stock

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

model = joblib.load('model/demand_model.pkl')
encoder = joblib.load('model/encoder.pkl')

@app.route('/predict-demand', methods=['POST'])
def predict_demand():
    data = request.get_json()

    sku = data.get('sku')
    region = data.get('region')
    weather = data.get('weather')
    event = data.get('event')
    buzz_score = data.get('buzz_score')

    df = pd.DataFrame([{
        'sku': sku,
        'region': region,
        'weather': weather,
        'event': event,
        'buzz_score': buzz_score
    }])

    encoded = encoder.transform(df[['sku', 'region', 'weather', 'event']])
    encoded_df = pd.DataFrame(encoded, columns=encoder.get_feature_names_out())
    X = pd.concat([encoded_df, df[['buzz_score']]], axis=1)

    prediction = model.predict(X)[0]

    return jsonify({'predicted_demand': int(prediction)})

@app.route('/optimize-stock', methods=['POST'])
def stock_allocation():
    data = request.get_json()
    predictions = data.get('predictions')  
    total_stock = data.get('total_stock')

    allocation = optimize_stock(predictions, total_stock)
    return jsonify({'allocation': allocation})

@app.route('/')
def home():
    return 'WalPredict API Running!'

if __name__ == '__main__':
    app.run(debug=True, port=8000)

