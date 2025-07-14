# backend/services/ticketmaster_service.py

import os
import requests

# Load your Ticketmaster API Key from environment (optional)
TM_API_KEY = os.getenv("TICKETMASTER_KEY")

# Map regions to broad cities or metro areas for Ticketmaster
REGION_CITY_MAP = {
    "North": "New York",
    "South": "Houston",
    "East": "Boston",
    "West": "Los Angeles",
}

def get_local_events(region, size=7):
    """
    Fetch upcoming events for a region from Ticketmaster.
    Returns a list of event names (strings), limited to `size`.
    If no API key is set or any HTTP/JSON error occurs, returns ["none"].
    """
    city = REGION_CITY_MAP.get(region, "New York")

    # Graceful fallback if no API key provided
    if not TM_API_KEY:
        print("[Ticketmaster] No API key set; returning ['none']")
        return ["none"]

    url = "https://app.ticketmaster.com/discovery/v2/events.json"
    params = {
        "apikey": TM_API_KEY,
        "city": city,
        "size": size,
        "sort": "date,asc",
    }

    try:
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        events = []
        embedded = data.get("_embedded", {})
        for ev in embedded.get("events", []):
            name = ev.get("name")
            if name:
                events.append(name)

        # If no events found, return ["none"]
        return events or ["none"]

    except requests.exceptions.RequestException as e:
        print(f"[Ticketmaster] HTTP error: {e}")
    except ValueError as e:
        print(f"[Ticketmaster] JSON decode error: {e}")
    except Exception as e:
        print(f"[Ticketmaster] Unexpected error: {e}")

    # On any failure, return ["none"]
    return ["none"]
