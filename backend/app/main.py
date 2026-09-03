import hashlib, hmac, os, secrets, sqlite3, subprocess, tempfile, time, uuid
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

load_dotenv()
app = FastAPI(title='I AM Magnanimous Way™ AI Platform', version='2.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
DB_PATH = Path(os.getenv('DATABASE_PATH', './iamagnanimous.db'))
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@iamagnanimous.local')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'change-this-password')
SESSION_SECRET = os.getenv('SESSION_SECRET', 'change-this-session-secret')
TOOLS = [{'id':'magnanimous','name':'Magnanimous AI','description':'Routes requests across configured AI providers and platform tools.'},{'id':'ai-chat','name':'AI Chat','description':'General-purpose AI assistant.'},{'id':'writing','name':'Writing Helper','description':'Create, rewrite, summarize and polish content.'},{'id':'research','name':'Research Helper','description':'Organize research questions, sources and briefs.'},{'id':'bible-study','name':'Bible Study','description':'Study Scripture and organize biblical topics.'},{'id':'marketing','name':'Marketing Helper','description':'Create campaigns, captions, offers and content plans.'},{'id':'business','name':'Business Helper','description':'Business planning, ideas and analysis.'},{'id':'coding','name':'Coding Helper','description':'Explain, generate and troubleshoot code.'},{'id':'video-studio','name':'Text → Video Studio','description':'Turn text into a captioned MP4 using free/local rendering.'},{'id':'social','name':'Social Media Helper','description':'Create platform-ready social posts and scripts.'},{'id':'video-script','name':'Video Script Helper','description':'Create short- and long-form video scripts.'},{'id':'travel','name':'Travel Helper','description':'Build travel plans and itineraries.'},{'id':'customer-service','name':'Customer Service Helper','description':'Draft helpful customer responses.'}]
PROVIDERS=[{'id':'openai','name':'OpenAI','configured':bool(os.getenv('OPENAI_API_KEY'))},{'id':'groq','name':'Groq','configured':bool(os.getenv('GROQ_API_KEY'))},{'id':'gemini','name':'Google Gemini','configured':bool(os.getenv('GEMINI_API_KEY'))},{'id':'ollama','name':'Ollama / Local AI','configured':bool(os.getenv('OLLAMA_BASE_URL'))},{'id':'local-video','name':'Local Video Renderer (FFmpeg)','configured':True}]
def db():
 c=sqlite3.connect(DB_PATH); c.row_factory=sqlite3.Row; c.execute("CREATE TABLE IF NOT EXISTS ads (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,url TEXT NOT NULL,label TEXT NOT NULL DEFAULT 'Sponsored',placement TEXT NOT NULL DEFAULT 'home',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL)"); c.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY,value TEXT NOT NULL)"); c.commit(); return c
def hash_password(password,salt=None):
 salt=salt or secrets.token_bytes(16); return salt.hex()+':'+hashlib.scrypt(password.encode(),salt=salt,n=2**14,r=8,p=1).hex()
def check_password(password,stored):
 try:
  s,d=stored.split(':',1); return hmac.compare_digest(hashlib.scrypt(password.encode(),salt=bytes.fromhex(s),n=2**14,r=8,p=1).hex(),d)
 except Exception:return False
def sign_session(email):
 payload=f'{email}|{int(time.time())+86400}'; return payload+'|'+hmac.new(SESSION_SECRET.encode(),payload.encode(),hashlib.sha256).hexdigest()
def verify_session(token):
 try:
  email,exp,sig=token.split('|',2); expected=hmac.new(SESSION_SECRET.encode(),f'{email}|{exp}'.encode(),hashlib.sha256).hexdigest(); return int(exp)>=int(time.time()) and hmac.compare_digest(sig,expected) and hmac.compare_digest(email,ADMIN_EMAIL)
 except Exception:return False
def require_admin(authorization):
 if not authorization or not authorization.startswith('Bearer ') or not verify_session(authorization[7:]): raise HTTPException(401,'Admin login required')
class ChatRequest(BaseModel): message:str=Field(min_length=1,max_length=20000); model:str|None=None
class VideoRequest(BaseModel): text:str=Field(min_length=1,max_length=5000); title:str=Field(default='I AM Magnanimous Way™',max_length=120); duration:int=Field(default=10,ge=3,le=60); width:int=Field(default=1080,ge=320,le=1920); height:int=Field(default=1920,ge=320,le=1920)
class LoginRequest(BaseModel): email:str; password:str
class AdRequest(BaseModel): title:str=Field(min_length=1,max_length=120); url:str=Field(min_length=4,max_length=2000); label:str=Field(default='Sponsored',max_length=80); placement:str=Field(default='home',max_length=80); active:bool=True
class SettingRequest(BaseModel): site_name:str=Field(min_length=1,max_length=120); tagline:str=Field(min_length=1,max_length=240); canva_url:str=Field(default='',max_length=2000)
@app.on_event('startup')
def startup():
 c=db()
 if c.execute("SELECT 1 FROM settings WHERE key='admin_password_hash'").fetchone() is None:
  c.execute("INSERT INTO settings(key,value) VALUES('admin_password_hash',?)",(hash_password(ADMIN_PASSWORD),)); c.execute("INSERT OR IGNORE INTO settings(key,value) VALUES('site_name','I AM Magnanimous AI Platform')"); c.execute("INSERT OR IGNORE INTO settings(key,value) VALUES('tagline','Free AI tools, Magnanimous AI orchestration, and creator tools in one place.')"); c.execute("INSERT OR IGNORE INTO settings(key,value) VALUES('canva_url','')"); c.commit()
 c.close()
@app.get('/health')
def health():return {'status':'ok','service':'iamagnanimous-ai','version':'2.0.0'}
@app.get('/api/tools')
def tools():return {'tools':TOOLS}
@app.get('/api/providers')
def providers():return {'providers':PROVIDERS}
@app.post('/api/admin/login')
def admin_login(req:LoginRequest):
 c=db(); row=c.execute("SELECT value FROM settings WHERE key='admin_password_hash'").fetchone(); c.close()
 if not hmac.compare_digest(req.email,ADMIN_EMAIL) or not row or not check_password(req.password,row['value']):raise HTTPException(401,'Invalid email or password')
 return {'token':sign_session(req.email),'email':req.email}
@app.get('/api/admin/settings')
def get_settings(authorization:str|None=Header(default=None)):
 require_admin(authorization); c=db(); data={r['key']:r['value'] for r in c.execute('SELECT key,value FROM settings')}; c.close(); return {'site_name':data.get('site_name','I AM Magnanimous AI Platform'),'tagline':data.get('tagline',''),'canva_url':data.get('canva_url','')}
@app.put('/api/admin/settings')
def save_settings(req:SettingRequest,authorization:str|None=Header(default=None)):
 require_admin(authorization); c=db()
 for k,v in {'site_name':req.site_name,'tagline':req.tagline,'canva_url':req.canva_url}.items():c.execute('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',(k,v))
 c.commit(); c.close(); return {'ok':True}
@app.get('/api/ads')
def public_ads(placement:str='home'):
 c=db(); rows=c.execute('SELECT id,title,url,label,placement,active FROM ads WHERE active=1 AND placement=? ORDER BY id DESC',(placement,)).fetchall(); c.close(); return {'ads':[dict(r) for r in rows]}
@app.get('/api/admin/ads')
def admin_ads(authorization:str|None=Header(default=None)):
 require_admin(authorization); c=db(); rows=c.execute('SELECT id,title,url,label,placement,active FROM ads ORDER BY id DESC').fetchall(); c.close(); return {'ads':[dict(r) for r in rows]}
@app.post('/api/admin/ads')
def create_ad(req:AdRequest,authorization:str|None=Header(default=None)):
 require_admin(authorization); c=db(); cur=c.execute('INSERT INTO ads(title,url,label,placement,active,created_at) VALUES(?,?,?,?,?,?)',(req.title,req.url,req.label,req.placement,int(req.active),int(time.time()))); c.commit(); aid=cur.lastrowid; c.close(); return {'id':aid,'ok':True}
@app.put('/api/admin/ads/{ad_id}')
def update_ad(ad_id:int,req:AdRequest,authorization:str|None=Header(default=None)):
 require_admin(authorization); c=db(); c.execute('UPDATE ads SET title=?,url=?,label=?,placement=?,active=? WHERE id=?',(req.title,req.url,req.label,req.placement,int(req.active),ad_id)); c.commit(); c.close(); return {'ok':True}
@app.delete('/api/admin/ads/{ad_id}')
def delete_ad(ad_id:int,authorization:str|None=Header(default=None)):
 require_admin(authorization); c=db(); c.execute('DELETE FROM ads WHERE id=?',(ad_id,)); c.commit(); c.close(); return {'ok':True}
@app.post('/api/chat')
def chat(req:ChatRequest):
 key=os.getenv('OPENAI_API_KEY')
 if not key:return {'output':'Magnanimous AI is ready, but no cloud AI key is configured. Add an AI provider key to enable cloud AI. Local/free tools remain available.','provider':'local'}
 try:
  from openai import OpenAI; r=OpenAI(api_key=key).responses.create(model=req.model or os.getenv('OPENAI_MODEL','gpt-5.6'),input=req.message); return {'output':r.output_text,'provider':'openai'}
 except Exception as exc:raise HTTPException(502,f'AI provider error: {exc}')
def _escape_drawtext(s):return s.replace('\\','\\\\').replace(':','\\:').replace("'","\\'").replace('%','\\%').replace('\n',' ')
@app.post('/api/video/render')
def render_video(req:VideoRequest):
 outdir=Path(tempfile.gettempdir())/'iamagnanimous-video'; outdir.mkdir(parents=True,exist_ok=True); outfile=outdir/f'{uuid.uuid4().hex}.mp4'; title=_escape_drawtext(req.title[:120]); text=_escape_drawtext(req.text[:1200]); vf=f"drawtext=fontcolor=white:fontsize={max(28,req.width//24)}:text='{title}':x=(w-text_w)/2:y=h*0.12:box=1:boxcolor=black@0.45:boxborderw=20,drawtext=fontcolor=white:fontsize={max(24,req.width//30)}:text='{text}':x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.35:boxborderw=24"; cmd=['ffmpeg','-y','-f','lavfi','-i',f'color=c=0x17112b:s={req.width}x{req.height}:d={req.duration}','-vf',vf,'-r','30','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(outfile)]
 try:subprocess.run(cmd,check=True,capture_output=True,text=True,timeout=180)
 except Exception as exc:raise HTTPException(500,f'Video render failed: {exc}')
 return {'download_url':f'/api/video/download/{outfile.name}','filename':outfile.name,'renderer':'FFmpeg','free_renderer':True}
@app.get('/api/video/download/{filename}')
def download_video(filename:str):
 path=Path(tempfile.gettempdir())/'iamagnanimous-video'/filename
 if not path.exists() or path.suffix!='.mp4':raise HTTPException(404,'Video not found')
 return FileResponse(path,media_type='video/mp4',filename=path.name)