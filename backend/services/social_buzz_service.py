from pytrends.request import TrendReq

def get_buzz_score(sku):
    pytrends = TrendReq(hl='en-US', tz=360)
    
    # Map SKU to search-friendly keyword
    sku_map = {
        "SKU_A": "Wireless Earbuds",
        "SKU_B": "Smartwatch",
        "SKU_C": "Bluetooth Speaker"
    }

    keyword = sku_map.get(sku, sku)
    pytrends.build_payload([keyword], cat=0, timeframe='now 7-d', geo='', gprop='')

    data = pytrends.interest_over_time()
    if data.empty:
        return 20  # fallback

    score = int(data[keyword].mean())
    return min(score, 100)
