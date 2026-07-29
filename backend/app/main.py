from fastapi import FastAPI

from app.routers import events, image_search, uploads

app = FastAPI(title="Reeya Kioski - Image Search API")

app.include_router(uploads.router)
app.include_router(image_search.router)
app.include_router(events.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
