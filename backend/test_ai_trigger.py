import urllib.request
import json
import time

def patch(url, data):
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}, 
        method='PATCH'
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

base_url = "http://127.0.0.1:5000/api/applications/5/status"

print("Moving to SCREENING...")
res1 = patch(base_url, {"to_status": "SCREENING"})
print(f"Success: {res1['success']}")

print("\nMoving to INTERVIEWING (Should trigger Gemini API)...")
res2 = patch(base_url, {"to_status": "INTERVIEWING"})
print(f"Success: {res2['success']}")
if res2['success']:
    print(f"Intel summary: {res2['data']['interview_intel'][:100]}...")
else:
    print(f"Error: {res2['error']}")
