from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import database as db
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_IDS = [8678582128, 8403172681, 8918951833]

def check_admin(x_user_id: str = Header(None)):
    if not x_user_id or int(x_user_id) not in ADMIN_IDS:
        raise HTTPException(status_code=403, detail="Доступ запрещен. Вы не администратор.")
    return int(x_user_id)

@app.get("/api/products")
def get_products():
    return db.get_products()

@app.post("/api/admin/add_product")
def add_product(name: str, price: int, cat: str, img: str, x_user_id: str = Header(None)):
    check_admin(x_user_id)
    db.add_product(name, price, cat, img)
    return {"status": "ok"}

@app.post("/api/admin/create_promo")
def create_promo(code: str, discount: int, uses: int, x_user_id: str = Header(None)):
    check_admin(x_user_id)
    db.create_promo(code, discount, uses)
    return {"status": "ok"}

@app.post("/api/admin/ban_user")
def ban_user(user_id: int, ban: bool, x_user_id: str = Header(None)):
    check_admin(x_user_id)
    db.ban_user(user_id, ban)
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
