from app import create_app
import json

app = create_app()
app.config['TESTING'] = True
client = app.test_client()

def test_transition(app_id, to_status):
    print(f"\nMoving Application {app_id} to {to_status}...")
    response = client.patch(
        f'/api/applications/{app_id}/status',
        data=json.dumps({"to_status": to_status}),
        content_type='application/json'
    )
    res_data = response.get_json()
    print(f"Status: {response.status_code}")
    print(f"Success: {res_data['success']}")
    if res_data['success']:
        intel = res_data['data'].get('interview_intel')
        if intel:
            print(f"AI Intel Received: {intel[:100]}...")
        else:
            print("No AI Intel generated (expected if not INTERVIEWING status or key missing).")
    else:
        print(f"Error: {res_data['error']}")

# Assuming ID 5 is currently SCREENING (if previous partial test worked) or APPLIED
# Let's try to list them first to be sure
with app.app_context():
    from app.models import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, status FROM applications WHERE id = 5")
    row = cur.fetchone()
    print(f"Application 5 current status: {row[1] if row else 'NOT FOUND'}")
    cur.close()
    conn.close()

if row:
    if row[1] == 'APPLIED':
        test_transition(5, 'SCREENING')
        test_transition(5, 'INTERVIEWING')
    elif row[1] == 'SCREENING':
        test_transition(5, 'INTERVIEWING')
    else:
        print("Application 5 is already at or past INTERVIEWING.")
