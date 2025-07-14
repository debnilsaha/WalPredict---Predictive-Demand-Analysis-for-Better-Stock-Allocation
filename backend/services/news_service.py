# services/news_service.py
import requests
import os

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

REGION_NEWS_KEYWORDS = {
    "North": ["New York", "northeast"],
    "South": ["Houston", "southern US"],
    "East": ["Boston", "east coast"],
    "West": ["Los Angeles", "west coast"]
}

def fetch_local_news(region, max_results=5):
    if not NEWS_API_KEY:
        raise RuntimeError("NEWS_API_KEY not set")

    keywords = REGION_NEWS_KEYWORDS.get(region, [region])
    query = " OR ".join(keywords)

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "language": "en",
        "sortBy": "relevancy",
        "apiKey": NEWS_API_KEY,
        "pageSize": max_results
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        articles = response.json().get("articles", [])
        titles = [article["title"] for article in articles if "title" in article]
        return titles
    except Exception as e:
        print("News fetch error:", e)
        return ["No news available"]
