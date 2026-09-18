import os, uuid
from pathlib import Path
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

app=FastAPI(title="Magnanimous Music Engine",version="1.0.0")
MODEL=os.getenv("MUSIC_ENGINE_MODEL","ACE-Step/Ace-Step1.5")
TOKEN=os.getenv("MUSIC_ENGINE_TOKEN","")
OUT=Path(os.getenv("MUSIC_ENGINE_OUTPUT_DIR","/tmp/magnanimous-music"));OUT.mkdir(parents=True,exist_ok=True)
_pipe=None

class Generate(BaseModel):
 prompt:str=Field(min_length=1,max_length=4000)
 lyrics:str=Field(default="",max_length=20000)
 duration:int=Field(default=30,ge=10,le=600)
 instrumental:bool=False

def guard(authorization):
 if not TOKEN: raise HTTPException(503,"Engine token is not configured")
 if authorization!=f"Bearer {TOKEN}": raise HTTPException(401,"Unauthorized")

def pipeline():
 global _pipe
 if _pipe is None:
  from transformers import pipeline as hf_pipeline
  _pipe=hf_pipeline("text-to-audio",model=MODEL,trust_remote_code=True,device_map="auto")
 return _pipe

@app.get("/health")
def health():
 return {"status":"ok","service":"magnanimous-music-engine","model":MODEL,"configured":bool(TOKEN)}

@app.post("/v1/generate")
def generate(req:Generate,authorization:str|None=Header(default=None)):
 guard(authorization)
 prompt=req.prompt.strip()
 if req.lyrics.strip() and not req.instrumental: prompt+=f"\nLyrics:\n{req.lyrics.strip()}"
 try:
  result=pipeline()(prompt)
  audio=result["audio"]; rate=int(result["sampling_rate"])
  import soundfile as sf
  name=f"{uuid.uuid4().hex}.wav"; path=OUT/name
  sf.write(path,audio.T if getattr(audio,"ndim",1)>1 else audio,rate)
  return {"status":"completed","filename":name,"audio_url":f"/v1/audio/{name}","sample_rate":rate,"model":MODEL}
 except Exception as exc:
  raise HTTPException(500,f"Music generation failed: {type(exc).__name__}: {exc}")

@app.get("/v1/audio/{filename}")
def audio(filename:str,authorization:str|None=Header(default=None)):
 guard(authorization)
 if "/" in filename or "\\" in filename or not filename.endswith(".wav"): raise HTTPException(400,"Invalid filename")
 path=OUT/filename
 if not path.exists(): raise HTTPException(404,"Audio not found")
 return FileResponse(path,media_type="audio/wav",filename=filename)
