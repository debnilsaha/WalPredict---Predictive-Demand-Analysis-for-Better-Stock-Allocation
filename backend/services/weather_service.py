# backend/services/weather_service.py

import os
import requests

# Your OpenWeatherMap API key (move into env var for production!)
OWM_API_KEY = os.getenv("OWM_API_KEY", "85091dab5afb943e699dbb7519b302bc")

def get_current_weather(region):
    """
    Given a region name (North, South, etc.), map to a city
    and return the weather.main string from OpenWeatherMap.
    """
    city_map = {
        "North": "New York",
        "South": "Houston",
        "East": "Boston",
        "West": "Los Angeles",
    }
    city = city_map.get(region, "New York")
    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}&appid={OWM_API_KEY}&units=metric"
    )
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    # e.g. "Clouds", "Rain", "Clear"
    return data["weather"][0]["main"]
