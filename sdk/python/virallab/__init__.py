import json
import os
import urllib.request

def score(api_key: str, url: str = None, features: dict = None) -> dict:
    endpoint = os.environ.get('PUBLIC_SCORE_URL', '/public/score')
    data = json.dumps({ 'url': url, 'features': features or {} }).encode('utf-8')
    req = urllib.request.Request(endpoint, data=data, headers={ 'Content-Type': 'application/json', 'x-api-key': api_key }, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))








