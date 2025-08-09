from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os, json
from mnemonic import Mnemonic
from bip_utils import Bip39SeedGenerator, Bip44, Bip44Coins, Bip44Changes

WALLETS_JSON = os.getenv("WALLETS_JSON", "/data/dormant_wallets.json")
mnemo = Mnemonic("english")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# Load dormant wallets into a set
_wallet_set = set()
try:
    with open(WALLETS_JSON, "r", encoding="utf-8") as f:
        arr = json.load(f)
        if isinstance(arr, list):
            _wallet_set = set(map(str, arr))
except FileNotFoundError:
    _wallet_set = set()

WORDS = mnemo.wordlist

class PhraseIn(BaseModel):
    words: List[str]

class CheckIn(BaseModel):
    pubkey: str

@app.get("/health")
def health():
    return {"ok": True, "wallets_loaded": len(_wallet_set)}

@app.get("/api/words")
def words():
    return WORDS

@app.post("/api/validate")
def validate(inp: PhraseIn):
    if len(inp.words) != 12:
        raise HTTPException(400, "exactly 12 words required")
    phrase = " ".join(inp.words)
    # Validate checksum
    if not mnemo.check(phrase):
        return {"valid": False, "pubkey": None}
    # Seed -> derive BTC address m/44'/0'/0'/0/0
    seed_bytes = Bip39SeedGenerator(phrase).Generate()
    acc = Bip44.FromSeed(seed_bytes, Bip44Coins.BITCOIN).Purpose().Coin().Account(0)
    ext = acc.Change(Bip44Changes.CHAIN_EXT)
    addr = ext.AddressIndex(0).PublicKey().ToAddress()
    return {"valid": True, "pubkey": addr}

@app.post("/api/check")
def check_pubkey(inp: CheckIn):
    return {"in_list": inp.pubkey in _wallet_set}
