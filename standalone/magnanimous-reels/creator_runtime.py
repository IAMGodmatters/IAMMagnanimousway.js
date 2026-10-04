import asyncio
import json
import math
import os
import random
import re
import sqlite3
import struct
import time
import wave
from pathlib import Path

BASE = Path('/workspace')
DB_PATH = BASE / 'reels.db'
AUDIO_DIR = BASE / 'static' / 'creator-audio'
TIMING_DIR = BASE / 'static' / 'creator-timings'
AMBIENT_DIR = BASE / 'static' / 'ambient'
for directory in (AUDIO_DIR, TIMING_DIR, AMBIENT_DIR):
    directory.mkdir(parents=True, exist_ok=True)

VOICE_PRESETS = {
    'warm_female': {'voice': 'en-US-AvaNeural', 'rate': '-4%', 'pitch': '+0Hz', 'label': 'Warm Female'},
    'dramatic_male': {'voice': 'en-US-BrianNeural', 'rate': '-6%', 'pitch': '-2Hz', 'label': 'Dramatic Male'},
    'bright_female': {'voice': 'en-US-EmmaNeural', 'rate': '-1%', 'pitch': '+2Hz', 'label': 'Bright Female'},
    'cinematic_male': {'voice': 'en-US-GuyNeural', 'rate': '-5%', 'pitch': '-3Hz', 'label': 'Cinematic Male'},
    'calm_female': {'voice': 'en-US-JennyNeural', 'rate': '-7%', 'pitch': '-1Hz', 'label': 'Calm Female'},
    'natural_male': {'voice': 'en-US-AndrewNeural', 'rate': '-3%', 'pitch': '+0Hz', 'label': 'Natural Male'},
}

GENRE_PROFILES = {
    'Drama': {'voice_key': 'warm_female', 'ambient': 'drama', 'tempo': 0.92},
    'Romance': {'voice_key': 'bright_female', 'ambient': 'romance', 'tempo': 0.95},
    'Thriller': {'voice_key': 'dramatic_male', 'ambient': 'thriller', 'tempo': 1.04},
    'Mystery': {'voice_key': 'calm_female', 'ambient': 'mystery', 'tempo': 0.90},
    'Fantasy': {'voice_key': 'cinematic_male', 'ambient': 'fantasy', 'tempo': 0.93},
    'Action': {'voice_key': 'natural_male', 'ambient': 'action', 'tempo': 1.08},
    'Adventure': {'voice_key': 'natural_male', 'ambient': 'adventure', 'tempo': 1.02},
}

HIT_TEMPLATES = [
    {'id': 'secret-heir', 'title': 'The Hidden Heir', 'genre': 'Drama', 'hook': 'Everyone treats the new employee like nobody until the board meeting reveals who really owns the company.'},
    {'id': 'second-chance', 'title': 'Seven Days to Change Everything', 'genre': 'Drama', 'hook': 'A woman wakes up seven days before the decision that destroyed her family and tries to change the ending.'},
    {'id': 'moon-crown', 'title': 'The Moon Crown', 'genre': 'Fantasy', 'hook': 'A village girl discovers the mark on her hand is the seal of a royal bloodline everyone thought was extinct.'},
    {'id': 'wrong-bride', 'title': 'The Bride He Never Chose', 'genre': 'Romance', 'hook': 'A contract marriage begins as revenge and becomes dangerous when both sides discover the same hidden enemy.'},
    {'id': 'last-train', 'title': 'The Last Train Home', 'genre': 'Thriller', 'hook': 'Five passengers board a midnight train that begins stopping at stations that do not exist on any map.'},
    {'id': 'time-loop', 'title': 'Eleven Fifty-Nine', 'genre': 'Mystery', 'hook': 'Every night resets at midnight, but one clue remains and someone else remembers too.'},
]

ASSET_RULES = [
    (('castle', 'king', 'queen', 'crown', 'palace'), 'castle'),
    (('city', 'office', 'company', 'boss', 'board', 'billionaire'), 'citynight'),
    (('train', 'station', 'rail'), 'train'),
    (('forest', 'woods', 'tree'), 'forestnight'),
    (('ocean', 'sea', 'beach', 'coast'), 'coast'),
    (('home', 'house', 'family', 'mother', 'father'), 'house'),
    (('school', 'child', 'kids'), 'kids'),
    (('door', 'portal', 'gate'), 'magicdoor'),
    (('letter', 'message', 'secret'), 'letter'),
    (('phone', 'call', 'text'), 'phone'),
    (('rain', 'storm'), 'storm'),
    (('night', 'midnight', 'dark'), 'darkcity'),
    (('love', 'bride', 'wedding', 'romance'), 'flowers'),
    (('mountain', 'cliff'), 'mountain'),
    (('river',), 'river'),
]

MOTION_PRESETS = ['slow_push', 'pan_left', 'pan_right', 'slow_pull', 'float_up']
TRANSITIONS = ['crossfade', 'dip_black', 'whip_soft', 'crossfade', 'flash_soft']


def now():
    return int(time.time())


def connect():
    db = sqlite3.connect(DB_PATH, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    return db


def init_schema():
    db = connect()
    db.executescript('''
    CREATE TABLE IF NOT EXISTS creator_projects(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      title TEXT NOT NULL,
      genre TEXT NOT NULL,
      premise TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS creator_episodes(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      episode_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      script TEXT NOT NULL,
      voice_key TEXT NOT NULL,
      scenes_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      published_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(project_id, episode_number)
    );
    CREATE INDEX IF NOT EXISTS idx_creator_projects_device ON creator_projects(device_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_creator_episodes_project ON creator_episodes(project_id, episode_number);
    ''')
    db.commit()
    db.close()
    ensure_ambient_tracks()


def clean(value, limit):
    return re.sub(r'\s+', ' ', str(value or '').strip())[:limit]


def row_dict(row):
    if not row:
        return None
    data = dict(row)
    if 'scenes_json' in data:
        try:
            data['scenes'] = json.loads(data.pop('scenes_json') or '[]')
        except Exception:
            data['scenes'] = []
    return data


def select_asset(text):
    low = text.lower()
    for words, asset in ASSET_RULES:
        if any(word in low for word in words):
            return asset
    return 'citylight'


def split_scenes(script):
    parts = [p.strip() for p in re.split(r'(?<=[.!?])\s+|\n+', script) if p.strip()]
    if not parts:
        return []
    if len(parts) <= 5:
        beats = parts[:]
    else:
        cuts = [0, round(len(parts)*.2), round(len(parts)*.4), round(len(parts)*.6), round(len(parts)*.8), len(parts)]
        beats = [' '.join(parts[cuts[i]:cuts[i+1]]) for i in range(5)]
    while len(beats) < 5:
        beats.append(beats[-1])
    scenes = []
    for index, text in enumerate(beats[:5]):
        scenes.append({
            'text': text[:500],
            'tag': select_asset(text),
            'motion': MOTION_PRESETS[index % len(MOTION_PRESETS)],
            'transition': TRANSITIONS[index % len(TRANSITIONS)],
            'shot': ['establishing', 'medium', 'close', 'reaction', 'cliffhanger'][index],
        })
    return scenes


def list_projects(device_id):
    db = connect()
    projects = []
    for row in db.execute('SELECT * FROM creator_projects WHERE device_id=? ORDER BY updated_at DESC', (device_id,)).fetchall():
        project = row_dict(row)
        project['episodes'] = [row_dict(ep) for ep in db.execute('SELECT * FROM creator_episodes WHERE project_id=? ORDER BY episode_number', (row['id'],)).fetchall()]
        projects.append(project)
    db.close()
    return projects


def create_project(device_id, payload):
    title = clean(payload.get('title'), 80)
    genre = clean(payload.get('genre') or 'Drama', 30)
    premise = clean(payload.get('premise'), 900)
    if not title or not premise:
        return None, 'Title and premise are required.'
    db = connect(); timestamp = now()
    cursor = db.execute('INSERT INTO creator_projects(device_id,title,genre,premise,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)', (device_id, title, genre, premise, 'draft', timestamp, timestamp))
    project_id = cursor.lastrowid
    db.commit(); db.close()
    return {'id': project_id, 'title': title, 'genre': genre, 'premise': premise, 'status': 'draft'}, None


def create_episode(device_id, payload):
    try:
        project_id = int(payload.get('project_id'))
    except Exception:
        return None, 'Valid project_id is required.'
    title = clean(payload.get('title') or 'Episode', 90)
    script = clean(payload.get('script'), 8000)
    if len(script) < 40:
        return None, 'Write at least a few sentences for the episode.'
    db = connect()
    project = db.execute('SELECT * FROM creator_projects WHERE id=? AND device_id=?', (project_id, device_id)).fetchone()
    if not project:
        db.close(); return None, 'Project not found.'
    profile = GENRE_PROFILES.get(project['genre'], GENRE_PROFILES['Drama'])
    voice_key = clean(payload.get('voice_key') or profile['voice_key'], 40)
    if voice_key not in VOICE_PRESETS:
        voice_key = profile['voice_key']
    episode_number = int(db.execute('SELECT COALESCE(MAX(episode_number),0)+1 AS n FROM creator_episodes WHERE project_id=?', (project_id,)).fetchone()['n'])
    scenes = split_scenes(script); timestamp = now()
    cursor = db.execute('INSERT INTO creator_episodes(project_id,episode_number,title,script,voice_key,scenes_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)', (project_id, episode_number, title, script, voice_key, json.dumps(scenes), 'draft', timestamp, timestamp))
    episode_id = cursor.lastrowid
    db.execute('UPDATE creator_projects SET status=?,updated_at=? WHERE id=?', ('in_progress', timestamp, project_id))
    db.commit(); row = db.execute('SELECT * FROM creator_episodes WHERE id=?', (episode_id,)).fetchone(); db.close()
    return row_dict(row), None


def get_episode_for_owner(device_id, episode_id):
    db = connect()
    row = db.execute('''SELECT e.*,p.genre,p.title AS project_title FROM creator_episodes e JOIN creator_projects p ON p.id=e.project_id WHERE e.id=? AND p.device_id=?''', (episode_id, device_id)).fetchone()
    db.close(); return row_dict(row)


def build_narration_text(scenes):
    lines = []
    for scene in scenes:
        text = scene['text'].strip()
        if text and text[-1] not in '.!?':
            text += '.'
        lines.append(text)
    return ' '.join(lines)


async def generate_voice(episode):
    try:
        import edge_tts
    except Exception as exc:
        return False, f'Neural voice engine unavailable: {exc}'
    scenes = episode.get('scenes') or split_scenes(episode.get('script', ''))
    text = build_narration_text(scenes)
    preset = VOICE_PRESETS.get(episode.get('voice_key'), VOICE_PRESETS['warm_female'])
    communicate = edge_tts.Communicate(text, preset['voice'], rate=preset['rate'], pitch=preset['pitch'])
    audio = bytearray(); boundaries = []
    async for chunk in communicate.stream():
        if chunk['type'] == 'audio':
            audio.extend(chunk['data'])
        elif chunk['type'] == 'SentenceBoundary':
            boundaries.append({'start': chunk['offset']/10_000_000, 'duration': chunk['duration']/10_000_000, 'text': chunk['text']})
    if len(boundaries) != len(scenes):
        total = max([b['start'] + b['duration'] for b in boundaries], default=max(18, len(text)/12))
        weights = [max(1, len(scene['text'].split())) for scene in scenes]
        weight_sum = sum(weights); cursor = 0; fixed = []
        for scene, weight in zip(scenes, weights):
            duration = total * weight / weight_sum
            fixed.append({'start': cursor, 'duration': duration, 'text': scene['text']})
            cursor += duration
        boundaries = fixed
    else:
        for index, boundary in enumerate(boundaries):
            boundary['text'] = scenes[index]['text']
    (AUDIO_DIR / f"{episode['id']}.mp3").write_bytes(audio)
    (TIMING_DIR / f"{episode['id']}.json").write_text(json.dumps({'episodeId': episode['id'], 'boundaries': boundaries}), encoding='utf-8')
    return len(audio) > 5000, None if len(audio) > 5000 else 'Narration audio was too small.'


def generate_episode(device_id, episode_id):
    episode = get_episode_for_owner(device_id, episode_id)
    if not episode:
        return None, 'Episode not found.'
    try:
        ok, error = asyncio.run(generate_voice(episode))
    except Exception as exc:
        return None, f'Voice generation failed: {exc}'
    if not ok:
        return None, error or 'Voice generation failed.'
    db = connect(); timestamp = now()
    db.execute('UPDATE creator_episodes SET status=?,updated_at=? WHERE id=?', ('ready', timestamp, episode_id))
    db.commit(); row = db.execute('SELECT * FROM creator_episodes WHERE id=?', (episode_id,)).fetchone(); db.close()
    return row_dict(row), None


def publish_episode(device_id, episode_id):
    episode = get_episode_for_owner(device_id, episode_id)
    if not episode:
        return None, 'Episode not found.'
    if episode['status'] not in ('ready', 'published'):
        return None, 'Generate the episode before publishing.'
    timestamp = now(); db = connect()
    db.execute('UPDATE creator_episodes SET status=?,published_at=?,updated_at=? WHERE id=?', ('published', timestamp, timestamp, episode_id))
    db.execute('UPDATE creator_projects SET status=?,updated_at=? WHERE id=?', ('published', timestamp, episode['project_id']))
    db.commit(); row = db.execute('SELECT * FROM creator_episodes WHERE id=?', (episode_id,)).fetchone(); db.close()
    return row_dict(row), None


def published_feed(limit=50):
    db = connect()
    rows = db.execute('''SELECT e.id,e.project_id,e.episode_number,e.title,e.script,e.voice_key,e.scenes_json,e.status,e.published_at,p.title AS project_title,p.genre FROM creator_episodes e JOIN creator_projects p ON p.id=e.project_id WHERE e.status='published' ORDER BY e.published_at DESC LIMIT ?''', (int(limit),)).fetchall()
    db.close(); return [row_dict(row) for row in rows]


def episode_timing(episode_id):
    path = TIMING_DIR / f'{int(episode_id)}.json'
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding='utf-8')).get('boundaries', [])
    except Exception:
        return []


def ensure_ambient_tracks():
    specs = {
        'drama': (146.8, 196.0, 0.18), 'romance': (220.0, 277.2, 0.14), 'thriller': (73.4, 110.0, 0.20),
        'mystery': (98.0, 130.8, 0.16), 'fantasy': (164.8, 246.9, 0.14), 'action': (110.0, 164.8, 0.18), 'adventure': (130.8, 196.0, 0.15)
    }
    sample_rate = 16000; seconds = 12; frames = sample_rate * seconds
    for name, (f1, f2, level) in specs.items():
        path = AMBIENT_DIR / f'{name}.wav'
        if path.exists() and path.stat().st_size > 10000:
            continue
        rng = random.Random(name)
        with wave.open(str(path), 'w') as output:
            output.setnchannels(1); output.setsampwidth(2); output.setframerate(sample_rate)
            chunks = bytearray()
            for i in range(frames):
                t = i / sample_rate
                swell = 0.65 + 0.35 * math.sin(2*math.pi*t/6.0)
                tone = math.sin(2*math.pi*f1*t) * 0.55 + math.sin(2*math.pi*f2*t) * 0.30
                texture = (rng.random()*2-1) * 0.04
                value = max(-1, min(1, (tone + texture) * level * swell))
                chunks.extend(struct.pack('<h', int(value * 32767)))
            output.writeframes(chunks)


def creator_config():
    return {
        'voices': [{'id': key, 'label': value['label']} for key, value in VOICE_PRESETS.items()],
        'templates': HIT_TEMPLATES,
        'genres': list(GENRE_PROFILES.keys()),
        'cost': {'draft': 0, 'native_dynamic_comic': 0, 'publish': 0},
        'production': {
            'format': '9:16 vertical',
            'beats_per_episode': 5,
            'motion': 'Ken Burns/parallax-style scene motion with transitions',
            'audio': 'Neural narration plus low-volume genre ambience',
            'captions': 'Sentence-synchronized',
            'provider_dependency': 'none for native dynamic-comic mode'
        }
    }


init_schema()
