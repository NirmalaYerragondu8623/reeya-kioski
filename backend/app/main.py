from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import events, image_search, uploads, voice_search

app = FastAPI(title="Reeya Kioski - Image Search API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(uploads.router)
app.include_router(image_search.router)
app.include_router(voice_search.router)
app.include_router(events.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
