import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import events, image_search, leads, uploads, voice_search

logger = logging.getLogger(__name__)

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Starlette's default error response for an unhandled exception is built
    # by ServerErrorMiddleware, which sits outside CORSMiddleware — so it goes
    # out with no Access-Control-Allow-Origin header and the browser reports
    # a generic "Failed to fetch" instead of showing the real error. Handling
    # it here keeps the response inside the normal middleware stack so CORS
    # headers still get attached.
    logger.exception("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(uploads.router)
app.include_router(image_search.router)
app.include_router(voice_search.router)
app.include_router(events.router)
app.include_router(leads.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
