
import os
from google.cloud import storage

# Configuration
BUCKET_NAME = "asistente-siac-voz-logs"
KEY_FILE = "mundimotos-481115-c652dd31ca7c.json"
SOURCE_DIR = "frontend/audios_voz"
DEST_FOLDER = "previews"

def upload_files():
    if not os.path.exists(KEY_FILE):
        print(f"Error: Key file {KEY_FILE} not found.")
        return

    storage_client = storage.Client.from_service_account_json(KEY_FILE)
    bucket = storage_client.bucket(BUCKET_NAME)

    # Ensure source dir exists
    if not os.path.exists(SOURCE_DIR):
        print(f"Error: Source directory {SOURCE_DIR} not found.")
        return

    files = [f for f in os.listdir(SOURCE_DIR) if f.endswith('.m4a')]
    
    print(f"Found {len(files)} files to upload...")

    for filename in files:
        local_path = os.path.join(SOURCE_DIR, filename)
        # Force filename to lowercase for consistency in storage
        dest_blob_name = f"{DEST_FOLDER}/{filename.lower()}"
        
        blob = bucket.blob(dest_blob_name)
        print(f"Uploading {filename} to gs://{BUCKET_NAME}/{dest_blob_name}...")
        
        blob.upload_from_filename(local_path, content_type='audio/mp4')
        try:
            blob.make_public()
            print(f"Public URL: {blob.public_url}")
        except Exception as e:
            print(f"Could not make public (will need proxy): {e}")

    print("Upload complete!")

if __name__ == "__main__":
    upload_files()
