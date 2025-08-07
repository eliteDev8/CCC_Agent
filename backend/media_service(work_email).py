from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
from google.oauth2 import service_account
import io
from backend.config import settings

class MediaService:
    @staticmethod
    def get_gdrive_service():
        creds = service_account.Credentials.from_service_account_file(
            settings.google_creds_path,
            scopes=["https://www.googleapis.com/auth/drive"]
        )
        return build("drive", "v3", credentials=creds)

    @staticmethod
    async def upload_to_gdrive(file):
        # return "local-test"
        service = MediaService.get_gdrive_service()
        file_metadata = {
            'name': file.filename,
            'parents': [settings.GOOGLE_DRIVE_FOLDER_ID] if settings.GOOGLE_DRIVE_FOLDER_ID else []
        }
        media = MediaIoBaseUpload(io.BytesIO(await file.read()), mimetype=file.content_type, resumable=True)
        print("file_metadata",media)
        try:
            gfile = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id',
                supportsAllDrives=True
            ).execute()
            print("gfile",gfile)
            return gfile.get('id')
        except Exception as e:
            print(f"Google Drive upload error: {e}")
            return None

    @staticmethod
    async def delete_from_gdrive(gdrive_id):
        service = MediaService.get_gdrive_service()
        try:
            service.files().delete(fileId=gdrive_id).execute()
            return True
        except Exception as e:
            print(f"Google Drive delete error: {e}")
            return False

    @staticmethod
    async def rename_gdrive_file(gdrive_id, new_name):
        service = MediaService.get_gdrive_service()
        try:
            file_metadata = {'name': new_name}
            service.files().update(fileId=gdrive_id, body=file_metadata).execute()
            return True
        except Exception as e:
            print(f"Google Drive rename error: {e}")
            return False

    @staticmethod
    async def download_from_gdrive(gdrive_id):
        service = MediaService.get_gdrive_service()
        try:
            request = service.files().get_media(fileId=gdrive_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
            fh.seek(0)
            return fh.read()
        except Exception as e:
            print(f"Google Drive download error: {e}")
            return None 