import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")

client = Client(account_sid, auth_token)
calls = client.calls.list(limit=1)

if calls:
    c = calls[0]
    print(dir(c))
    print("---")
    print(f"From attribute: {getattr(c, 'from_', 'NOT FOUND')}")
    print(f"To attribute: {getattr(c, 'to', 'NOT FOUND')}")
else:
    print("No calls found")
