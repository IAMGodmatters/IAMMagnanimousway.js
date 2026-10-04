import json, os, sqlite3, time, subprocess, sys
BASE='/workspace'; STATIC=f'{BASE}/static'; MANIFEST=f'{BASE}/series_manifest.json'; DB=f'{BASE}/reels.db'
FREE_EPISODES=3
UNLOCK_COST=30

def load_manifest():
    if not os.path.isfile(MANIFEST):
        subprocess.run([sys.executable, f'{BASE}/build_series_manifest.py'], check=True, cwd=BASE)
    return json.load(open(MANIFEST,encoding='utf-8'))

def connect_db():
    db=sqlite3.connect(DB,timeout=10); db.row_factory=sqlite3.Row; db.execute('PRAGMA journal_mode=WAL'); return db

def init_schema():
    db=connect_db(); db.executescript('''
    CREATE TABLE IF NOT EXISTS series_episode_unlocks(
      device_id TEXT NOT NULL,
      series_id INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      unlocked_at INTEGER NOT NULL,
      source TEXT NOT NULL,
      PRIMARY KEY(device_id,series_id,episode_number)
    );
    CREATE TABLE IF NOT EXISTS series_watch_progress(
      device_id TEXT NOT NULL,
      series_id INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(device_id,series_id,episode_number)
    );
    CREATE TABLE IF NOT EXISTS series_render_jobs(
      series_id INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      provider TEXT NOT NULL DEFAULT 'unassigned',
      status TEXT NOT NULL DEFAULT 'awaiting_capacity',
      task_id TEXT,
      video_path TEXT,
      detail TEXT,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(series_id,episode_number)
    );
    ''')
    manifest=load_manifest(); ts=int(time.time())
    for s in manifest['series']:
      for ep in s['episodes']:
        path=video_path(s['series_id'],ep['episode_number'])
        ready=os.path.isfile(path) and os.path.getsize(path)>10000
        db.execute('''INSERT INTO series_render_jobs(series_id,episode_number,provider,status,video_path,detail,updated_at)
                      VALUES(?,?,?,?,?,?,?) ON CONFLICT(series_id,episode_number) DO UPDATE SET
                      status=CASE WHEN excluded.status='ready' THEN 'ready' ELSE series_render_jobs.status END,
                      video_path=CASE WHEN excluded.status='ready' THEN excluded.video_path ELSE series_render_jobs.video_path END,
                      updated_at=excluded.updated_at''',
                   (s['series_id'],ep['episode_number'],'native_or_configured','ready' if ready else 'awaiting_capacity',path if ready else None,'Real moving video required; legacy motion-comic preview is not considered final.' if not ready else 'Real video asset present.',ts))
    db.commit(); db.close()

def series_list():
    m=load_manifest(); db=connect_db(); rows={(int(r['series_id']),int(r['episode_number'])):dict(r) for r in db.execute('SELECT * FROM series_render_jobs').fetchall()}; db.close()
    out=[]
    for s in m['series']:
      ready=sum(1 for e in s['episodes'] if rows.get((s['series_id'],e['episode_number']),{}).get('status')=='ready')
      out.append({'series_id':s['series_id'],'title':s['title'],'category':s['category'],'season':s['season'],'episode_count':s['episode_count'],'lead':s['lead'],'real_video_ready':ready,'real_video_required':s['episode_count']-ready,'free_episode_count':FREE_EPISODES})
    return out

def get_series(series_id):
    sid=int(series_id); m=load_manifest(); s=next((x for x in m['series'] if int(x['series_id'])==sid),None)
    if not s:return None
    db=connect_db(); rows={(int(r['episode_number'])):dict(r) for r in db.execute('SELECT * FROM series_render_jobs WHERE series_id=?',(sid,)).fetchall()}; db.close()
    obj={k:v for k,v in s.items() if k!='episodes'}; obj['free_episode_count']=FREE_EPISODES
    obj['episodes']=[]
    for ep in s['episodes']:
      e=dict(ep); r=rows.get(int(e['episode_number']),{}); e['render_status']=r.get('status','awaiting_capacity'); e['real_video_ready']=e['render_status']=='ready'; e['video_url']=f"/series-video/{sid}/{e['episode_number']}.mp4" if e['real_video_ready'] else None; obj['episodes'].append(e)
    return obj

def get_episode(series_id,episode_number):
    s=get_series(series_id)
    if not s:return None
    return next((e for e in s['episodes'] if int(e['episode_number'])==int(episode_number)),None)

def video_path(series_id,episode_number):
    return f'{STATIC}/series-video/{int(series_id)}/{int(episode_number)}.mp4'

def access(device_id,series_id,episode_number,weekly_pass=False):
    ep=int(episode_number)
    if ep<=FREE_EPISODES:return True,'free_preview'
    if weekly_pass:return True,'weekly_pass'
    db=connect_db(); row=db.execute('SELECT 1 FROM series_episode_unlocks WHERE device_id=? AND series_id=? AND episode_number=?',(device_id,int(series_id),ep)).fetchone(); db.close()
    return (True,'coin_unlock') if row else (False,'locked')

def unlock(device_id,series_id,episode_number):
    sid=int(series_id); ep=int(episode_number)
    if ep<=FREE_EPISODES:return {'unlocked':True,'source':'free_preview','spent':0}
    db=connect_db(); already=db.execute('SELECT 1 FROM series_episode_unlocks WHERE device_id=? AND series_id=? AND episode_number=?',(device_id,sid,ep)).fetchone()
    if already: db.close(); return {'unlocked':True,'source':'coin_unlock','spent':0}
    row=db.execute('SELECT coins FROM accounts WHERE device_id=?',(device_id,)).fetchone()
    if not row: db.close(); return {'unlocked':False,'code':'ACCOUNT_NOT_FOUND'}
    coins=int(row['coins'])
    if coins<UNLOCK_COST: db.close(); return {'unlocked':False,'code':'INSUFFICIENT_COINS','coins':coins,'needed':UNLOCK_COST}
    ts=int(time.time()); db.execute('UPDATE accounts SET coins=coins-?,updated_at=? WHERE device_id=?',(UNLOCK_COST,ts,device_id)); db.execute('INSERT INTO series_episode_unlocks(device_id,series_id,episode_number,unlocked_at,source) VALUES(?,?,?,?,?)',(device_id,sid,ep,ts,'coins')); db.commit(); db.close(); return {'unlocked':True,'source':'coins','spent':UNLOCK_COST}

def unlocked_episode_keys(device_id):
    db=connect_db(); rows=db.execute('SELECT series_id,episode_number FROM series_episode_unlocks WHERE device_id=? ORDER BY series_id,episode_number',(device_id,)).fetchall(); db.close(); return [f"{int(r['series_id'])}:{int(r['episode_number'])}" for r in rows]

def render_summary():
    db=connect_db(); rows=db.execute('SELECT status,COUNT(*) n FROM series_render_jobs GROUP BY status').fetchall(); db.close(); counts={r['status']:int(r['n']) for r in rows}; return {'total':600,'ready':counts.get('ready',0),'awaiting_capacity':counts.get('awaiting_capacity',0),'generating':counts.get('generating',0),'failed':counts.get('failed',0),'production_target':'cinematic_live_action_vertical'}

init_schema()
