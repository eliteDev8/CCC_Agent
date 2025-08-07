from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import get_db
from backend.api.v1.auth import get_current_user
from backend.models.user import User
from backend.models.media import Media
from sqlalchemy.future import select
from backend.services.media_service import MediaService
from typing import List, Union
from fastapi.responses import StreamingResponse
import io

router = APIRouter(prefix="/media", tags=["media"])

def admin_required(current_user: User = Depends(get_current_user)):
    if str(current_user.role) != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.post("/upload")
async def upload_media(
    files: Union[List[UploadFile], UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    # Support both single and multiple file upload
    if isinstance(files, UploadFile):
        files = [files]
    results = []
    for file in files:
        gdrive_id = await MediaService.upload_to_gdrive(file)
        if not gdrive_id:
            raise HTTPException(status_code=404, detail="Upload failed")
        file.file.seek(0, 2)  # Move to end of file
        file_size = None
        try:
            file_size = file.file.tell()
        except Exception:
            pass
        file.file.seek(0)  # Move back to start
        media = Media(
            user_id=current_user.id,
            filename=file.filename,
            filetype=file.content_type,
            gdrive_id=gdrive_id,
            file_size=file_size
        )
        db.add(media)
        await db.commit()
        await db.refresh(media)
        results.append({
            "id": media.id,
            "filename": media.filename,
            "filetype": media.filetype,
            "file_size": media.file_size,
            "created_at": media.created_at
        })
    return results

@router.get("/list", response_model=List[dict])
async def list_media(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    result = await db.execute(select(Media))
    media_list = result.scalars().all()
    user_ids = list(set(m.user_id for m in media_list))
    users = {}
    if user_ids:
        user_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in user_result.scalars().all():
            users[u.id] = u.email
    return [{
        "id": m.id,
        "filename": m.filename,
        "filetype": m.filetype,
        "gdrive_id": m.gdrive_id,
        "file_size": m.file_size,
        "created_at": m.created_at,
        "owner": users.get(m.user_id, "")
    } for m in media_list]


@router.get("/download/{media_id}")
async def download_media(
    media_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    result = await db.execute(select(Media).where(Media.id == media_id))
    media = result.scalars().first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    file_bytes = await MediaService.download_from_gdrive(media.gdrive_id)
    if not file_bytes:
        raise HTTPException(status_code=404, detail="File not found in Google Drive")
    headers = {
        "Content-Disposition": f'attachment; filename=\"{media.filename}\"',
        "Content-Length": str(len(file_bytes)),  # Enables browser progress bar!
    }
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media.filetype or "application/octet-stream",
        headers=headers
    )

@router.delete("/delete/{media_id}")
async def delete_media(
    media_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    result = await db.execute(select(Media).where(Media.id == media_id))
    media = result.scalars().first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    await MediaService.delete_from_gdrive(media.gdrive_id)
    await db.delete(media)
    await db.commit()
    return {"success": True}

@router.put("/rename/{media_id}")
async def rename_media(
    media_id: int,
    new_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    result = await db.execute(select(Media).where(Media.id == media_id))
    media = result.scalars().first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    await MediaService.rename_gdrive_file(media.gdrive_id, new_name)
    media.filename = new_name
    await db.commit()
    await db.refresh(media)
    return {"id": media.id, "filename": media.filename} 