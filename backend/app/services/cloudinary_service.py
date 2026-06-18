import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 Mo


async def upload_product_image(file: UploadFile, product_id: int) -> dict:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Format non autorisé. JPG, PNG ou WebP uniquement.")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image trop lourde (max 5 Mo)")

    result = cloudinary.uploader.upload(
        content,
        folder=f"thefriends/products/{product_id}",
        transformation=[
            {"width": 800, "height": 1067, "crop": "fill", "gravity": "auto"},
            {"format": "webp", "quality": "auto:good"},
        ],
        resource_type="image",
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


async def upload_shop_photo(file: UploadFile, shop_id: int) -> dict:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Format non autorisé.")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image trop lourde (max 5 Mo)")

    result = cloudinary.uploader.upload(
        content,
        folder=f"thefriends/shops/{shop_id}",
        transformation=[
            {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
            {"format": "webp", "quality": "auto:good"},
        ],
        resource_type="image",
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


def delete_image(public_id: str) -> None:
    cloudinary.uploader.destroy(public_id)
