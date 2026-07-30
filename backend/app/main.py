from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import events, image_search, leads, uploads, voice_search

app = FastAPI(title="Reeya Kioski - Image Search API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins_list,
    allow_origin_regex=get_settings().allowed_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
    # navigator.sendBeacon (used by the analytics /events calls) always sends
    # requests with credentials mode "include", so the browser requires this
    # header back even though we don't actually rely on cookies/auth here.
    allow_credentials=True,
)

app.include_router(uploads.router)
app.include_router(image_search.router)
app.include_router(voice_search.router)
app.include_router(events.router)
app.include_router(leads.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
