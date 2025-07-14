# backend/utils/trends.py

from pytrends.request import TrendReq

def get_google_trend_score(keyword: str, region_code: str = 'US') -> int:
    pytrends = TrendReq(hl='en-US', tz=360)
    
    # Build payload
    pytrends.build_payload([keyword], geo=region_code, timeframe='now 7-d')
    
    # Fetch interest over time
    data = pytrends.interest_over_time()
    if not data.empty:
        trend_score = int(data[keyword].mean())
        return trend_score
    else:
        return 0  # fallback if no data
