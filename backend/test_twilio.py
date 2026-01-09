import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")

if not account_sid or not auth_token:
    print("Error: Missing credentials")
    exit(1)

try:
    client = Client(account_sid, auth_token)
    calls = client.calls.list(limit=5)
    print(f"Successfully fetched {len(calls)} calls")
    for c in calls:
        print(f"- {c.sid} ({c.status})")
except Exception as e:
    print(f"Error fetching calls: {e}")
