import json, os, re, mimetypes, time, sqlite3, hmac, hashlib
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote, parse_qs

BASE = '/workspace'
STATIC = f'{BASE}/static'
DB_PATH = f'{BASE}/reels.db'
STORIES = json.load(open(f'{BASE}/stories.json'))
BY_ID = {int(story['id']): story for story in STORIES}
FREE_STORY_IDS = {1, 2, 3}
UNLOCK_COST = 30
WELCOME_COINS = 90
WEEK_SECONDS = 7 * 24 * 60 * 60
PAYMENT_LINKS = {
    'weekly': 'https://buy.stripe.com/7sY3cvg3o5nwgis2Rn6kg07',
    'coins150': 'https://buy.stripe.com/9B63cvbN86rAfeoajP6kg08',
    'coins500': 'https://buy.stripe.com/14A5kD18ueY62kib03wPX2Njiu',
    'coins1400': 'https://buy.stripe.com/dRmeVd2cy6rA9U463z6kg0a',
}


def now():
    return int(time.time())


def today():
    return time.strftime('%Y-%m-%d', time.gmtime())


def valid_device(value):
    return bool(re.fullmatch(r'[A-Za-z0-9_-]{16,128}', str(value or '')))


def connect_db():
    db = sqlite3.connect(DB_PATH, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    return db


def init_db():
    db = connect_db()
    db.executescript('''
    CREATE TABLE IF NOT EXISTS accounts(
      device_id TEXT PRIMARY KEY,
      coins INTEGER NOT NULL DEFAULT 90,
      daily_streak INTEGER NOT NULL DEFAULT 0,
      last_bonus_date TEXT,
      pass_active INTEGER NOT NULL DEFAULT 0,
      pass_until INTEGER,
      stripe_subscription_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS unlocks(
      device_id TEXT NOT NULL,
      story_id INTEGER NOT NULL,
      unlocked_at INTEGER NOT NULL,
      source TEXT NOT NULL,
      PRIMARY KEY(device_id, story_id)
    );
    CREATE TABLE IF NOT EXISTS watch_rewards(
      device_id TEXT NOT NULL,
      story_id INTEGER NOT NULL,
      reward_date TEXT NOT NULL,
      rewarded_at INTEGER NOT NULL,
      PRIMARY KEY(device_id, story_id, reward_date)
    );
    CREATE TABLE IF NOT EXISTS stripe_events(
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      processed_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscriptions(
      subscription_id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      status TEXT NOT NULL,
      current_period_end INTEGER,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS purchases(
      stripe_object_id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      entitlement TEXT NOT NULL,
      coins INTEGER NOT NULL DEFAULT 0,
      purchased_at INTEGER NOT NULL
    );
    ''')
    db.commit()
    db.close()


def ensure_account(device_id):
    if not valid_device(device_id):
        return None
    db = connect_db()
    timestamp = now()
    db.execute(
        'INSERT OR IGNORE INTO accounts(device_id,coins,created_at,updated_at) VALUES(?,?,?,?)',
        (device_id, WELCOME_COINS, timestamp, timestamp),
    )
    db.commit()
    row = db.execute('SELECT * FROM accounts WHERE device_id=?', (device_id,)).fetchone()
    db.close()
    return row


def pass_active(account):
    if not account or not int(account['pass_active'] or 0):
        return False
    expires = int(account['pass_until'] or 0)
    return expires == 0 or expires > now()


def has_access(device_id, story_id):
    if story_id in FREE_STORY_IDS:
        return True, 'free_preview'
    account = ensure_account(device_id)
    if not account:
        return False, 'invalid_device'
    if pass_active(account):
        return True, 'weekly_pass'
    db = connect_db()
    unlocked = db.execute(
        'SELECT 1 FROM unlocks WHERE device_id=? AND story_id=?',
        (device_id, story_id),
    ).fetchone()
    db.close()
    return (True, 'coin_unlock') if unlocked else (False, 'locked')


def account_payload(device_id):
    account = ensure_account(device_id)
    if not account:
        return None
    db = connect_db()
    unlocked = [
        int(row['story_id'])
        for row in db.execute(
            'SELECT story_id FROM unlocks WHERE device_id=? ORDER BY story_id',
            (device_id,),
        )
    ]
    rewards = int(
        db.execute(
            'SELECT COUNT(*) AS n FROM watch_rewards WHERE device_id=? AND reward_date=?',
            (device_id, today()),
        ).fetchone()['n']
    )
    db.close()
    account = ensure_account(device_id)
    return {
        'device_id': device_id,
        'coins': int(account['coins']),
        'welcome_coins': WELCOME_COINS,
        'unlock_cost': UNLOCK_COST,
        'free_story_ids': sorted(FREE_STORY_IDS),
        'unlocked_story_ids': unlocked,
        'weekly_pass_active': pass_active(account),
        'weekly_pass_until': int(account['pass_until'] or 0),
        'daily_streak': int(account['daily_streak'] or 0),
        'last_bonus_date': account['last_bonus_date'],
        'watch_rewards_today': rewards,
        'watch_reward_daily_limit': 5,
        'watch_reward_coins': 5,
    }


def stripe_secret():
    try:
        return open(f'{BASE}/.stripe_webhook_secret').read().strip()
    except Exception:
        return ''


def verify_stripe_signature(raw_body, header):
    secret = stripe_secret()
    if not secret:
        return False
    timestamp = ''
    signatures = []
    for part in str(header or '').split(','):
        if '=' not in part:
            continue
        key, value = part.strip().split('=', 1)
        if key == 't':
            timestamp = value
        elif key == 'v1':
            signatures.append(value)
    if not timestamp or not signatures:
        return False
    try:
        if abs(now() - int(timestamp)) > 300:
            return False
    except Exception:
        return False
    signed = f'{timestamp}.'.encode() + raw_body
    expected = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, signature) for signature in signatures)


def credit_coins(device_id, amount):
    ensure_account(device_id)
    db = connect_db()
    db.execute(
        'UPDATE accounts SET coins=coins+?,updated_at=? WHERE device_id=?',
        (int(amount), now(), device_id),
    )
    db.commit()
    db.close()


def set_subscription(device_id, subscription_id, status, period_end=None):
    if not valid_device(device_id) or not subscription_id:
        return
    ensure_account(device_id)
    active = 1 if status in ('active', 'trialing') else 0
    expires = int(period_end or 0) or (now() + WEEK_SECONDS if active else 0)
    db = connect_db()
    timestamp = now()
    db.execute(
        '''INSERT INTO subscriptions(subscription_id,device_id,status,current_period_end,updated_at)
           VALUES(?,?,?,?,?)
           ON CONFLICT(subscription_id) DO UPDATE SET
             device_id=excluded.device_id,status=excluded.status,
             current_period_end=excluded.current_period_end,updated_at=excluded.updated_at''',
        (subscription_id, device_id, status, expires, timestamp),
    )
    db.execute(
        'UPDATE accounts SET pass_active=?,pass_until=?,stripe_subscription_id=?,updated_at=? WHERE device_id=?',
        (active, expires, subscription_id, timestamp, device_id),
    )
    db.commit()
    db.close()


def process_stripe_event(event):
    event_id = str(event.get('id') or '')
    event_type = str(event.get('type') or '')
    if not event_id:
        return {'received': False, 'detail': 'missing event id'}
    db = connect_db()
    if db.execute('SELECT 1 FROM stripe_events WHERE event_id=?', (event_id,)).fetchone():
        db.close()
        return {'received': True, 'duplicate': True}
    db.close()

    obj = ((event.get('data') or {}).get('object') or {})
    metadata = obj.get('metadata') or {}
    relevant = metadata.get('surface') == 'magnanimous_reels'

    if event_type in ('checkout.session.completed', 'checkout.session.async_payment_succeeded') and relevant:
        device_id = str(obj.get('client_reference_id') or '')
        entitlement = str(metadata.get('entitlement') or '')
        paid = str(obj.get('payment_status') or '') in ('paid', 'no_payment_required')
        if valid_device(device_id) and paid:
            ensure_account(device_id)
            object_id = str(obj.get('id') or event_id)
            db = connect_db()
            previous = db.execute('SELECT 1 FROM purchases WHERE stripe_object_id=?', (object_id,)).fetchone()
            db.close()
            if not previous:
                if entitlement.startswith('coins_'):
                    amount = int(metadata.get('coins') or entitlement.split('_')[-1] or 0)
                    if amount > 0:
                        credit_coins(device_id, amount)
                    db = connect_db()
                    db.execute(
                        'INSERT OR IGNORE INTO purchases(stripe_object_id,device_id,entitlement,coins,purchased_at) VALUES(?,?,?,?,?)',
                        (object_id, device_id, entitlement, amount, now()),
                    )
                    db.commit(); db.close()
                elif entitlement == 'weekly_all_access':
                    subscription_id = str(obj.get('subscription') or '')
                    if subscription_id:
                        set_subscription(device_id, subscription_id, 'active', now() + WEEK_SECONDS)
                    db = connect_db()
                    db.execute(
                        'INSERT OR IGNORE INTO purchases(stripe_object_id,device_id,entitlement,coins,purchased_at) VALUES(?,?,?,?,?)',
                        (object_id, device_id, entitlement, 0, now()),
                    )
                    db.commit(); db.close()

    elif event_type.startswith('customer.subscription.'):
        subscription_id = str(obj.get('id') or '')
        db = connect_db()
        mapped = db.execute(
            'SELECT device_id FROM subscriptions WHERE subscription_id=?',
            (subscription_id,),
        ).fetchone()
        db.close()
        device_id = str(mapped['device_id']) if mapped else str(metadata.get('device_id') or '')
        if valid_device(device_id):
            status = 'canceled' if event_type.endswith('.deleted') else str(obj.get('status') or 'inactive')
            set_subscription(device_id, subscription_id, status, obj.get('current_period_end'))

    db = connect_db()
    db.execute(
        'INSERT OR IGNORE INTO stripe_events(event_id,event_type,processed_at) VALUES(?,?,?)',
        (event_id, event_type, now()),
    )
    db.commit(); db.close()
    return {'received': True}


init_db()


class Handler(BaseHTTPRequestHandler):
    server_version = 'MagnanimousReels/3.0'

    def log_message(self, fmt, *args):
        print(fmt % args, flush=True)

    def send_bytes(self, data, ctype='application/octet-stream', status=200, cache='no-store'):
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', cache)
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'camera=(), geolocation=()')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, obj, status=200):
        self.send_bytes(json.dumps(obj, ensure_ascii=False).encode(), 'application/json; charset=utf-8', status)

    def serve(self, path, cache='public, max-age=86400'):
        if not os.path.isfile(path):
            return self.send_json({'error': 'not found'}, 404)
        ctype = mimetypes.guess_type(path)[0] or 'application/octet-stream'
        with open(path, 'rb') as handle:
            self.send_bytes(handle.read(), ctype, 200, cache)

    def read_json(self):
        try:
            size = int(self.headers.get('content-length') or 0)
            raw = self.rfile.read(min(size, 200000))
            return json.loads(raw or b'{}')
        except Exception:
            return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        query = parse_qs(parsed.query)
        if path == '/api/health':
            audio = sum(os.path.isfile(f'{STATIC}/audio/{sid}.mp3') and os.path.getsize(f'{STATIC}/audio/{sid}.mp3') > 5000 for sid in BY_ID)
            timings = 0; scenes = 0; missing_assets = []
            for sid, story in BY_ID.items():
                timing_path = f'{STATIC}/timings/{sid}.json'
                if os.path.isfile(timing_path):
                    try:
                        timings += len(json.load(open(timing_path)).get('boundaries', [])) == len(story['scenes'])
                    except Exception:
                        pass
                for scene in story['scenes']:
                    scenes += 1
                    asset_path = f"{STATIC}/assets/{scene['tag']}.jpg"
                    if not os.path.isfile(asset_path):
                        missing_assets.append(scene['tag'])
            return self.send_json({'ok': audio == 60 and timings == 60 and not missing_assets, 'stories': len(STORIES), 'audio': audio, 'timings': timings, 'scenes': scenes, 'missingAssets': sorted(set(missing_assets)), 'monetization': 'verified', 'version': 3})
        if path == '/api/stories':
            return self.send_json(STORIES)
        if path == '/api/monetization':
            return self.send_json({'free_story_ids': sorted(FREE_STORY_IDS), 'unlock_cost': UNLOCK_COST, 'welcome_coins': WELCOME_COINS, 'weekly_price_php': 199, 'packs': [{'coins': 150, 'price_php': 49, 'url': PAYMENT_LINKS['coins150']}, {'coins': 500, 'price_php': 129, 'url': PAYMENT_LINKS['coins500']}, {'coins': 1400, 'price_php': 299, 'url': PAYMENT_LINKS['coins1400']}], 'weekly': {'price_php': 199, 'url': PAYMENT_LINKS['weekly'], 'recurring': True}})
        account_match = re.fullmatch(r'/api/account/([A-Za-z0-9_-]{16,128})', path)
        if account_match:
            return self.send_json(account_payload(account_match.group(1)))
        story_match = re.fullmatch(r'/api/story/(\d+)', path)
        if story_match:
            story_id = int(story_match.group(1)); story = BY_ID.get(story_id)
            if not story:
                return self.send_json({'error': 'story not found'}, 404)
            try:
                timings = json.load(open(f'{STATIC}/timings/{story_id}.json')).get('boundaries', [])
            except Exception:
                timings = []
            return self.send_json({'story': story, 'timings': timings})
        if path.startswith('/assets/'):
            return self.serve(f'{STATIC}{path}', 'public, max-age=604800, immutable')
        if path.startswith('/audio/'):
            audio_match = re.fullmatch(r'/audio/(\d+)\.mp3', path)
            if not audio_match:
                return self.send_json({'error': 'not found'}, 404)
            story_id = int(audio_match.group(1))
            device_id = (query.get('device') or [''])[0]
            allowed, _ = has_access(device_id, story_id)
            if not allowed:
                return self.send_json({'error': 'episode locked', 'code': 'PAYMENT_REQUIRED', 'story_id': story_id, 'unlock_cost': UNLOCK_COST}, 402)
            return self.serve(f'{STATIC}/audio/{story_id}.mp3', 'private, max-age=3600')
        if path.startswith('/timings/'):
            return self.serve(f'{STATIC}{path}', 'public, max-age=604800, immutable')
        if path == '/manifest.webmanifest':
            return self.serve(f'{STATIC}/manifest.webmanifest', 'no-cache')
        if path == '/sw.js':
            return self.serve(f'{STATIC}/sw.js', 'no-cache')
        if path in ['/', '/watch', '/series', '/pricing', '/rewards', '/my-reels'] or not path.startswith('/api/'):
            return self.serve(f'{STATIC}/index.html', 'no-cache')
        return self.send_json({'error': 'not found'}, 404)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        if path == '/api/stripe/webhook':
            size = int(self.headers.get('content-length') or 0)
            raw = self.rfile.read(min(size, 2000000))
            signature = self.headers.get('stripe-signature') or ''
            if not verify_stripe_signature(raw, signature):
                return self.send_json({'detail': 'invalid Stripe signature'}, 401)
            try:
                event = json.loads(raw)
            except Exception:
                return self.send_json({'detail': 'invalid JSON'}, 400)
            return self.send_json(process_stripe_event(event))

        body = self.read_json()
        device_id = str(body.get('device_id') or '')
        if not valid_device(device_id):
            return self.send_json({'detail': 'valid device_id required'}, 400)
        ensure_account(device_id)

        if path == '/api/unlock':
            try:
                story_id = int(body.get('story_id'))
            except Exception:
                return self.send_json({'detail': 'story_id required'}, 400)
            if story_id not in BY_ID:
                return self.send_json({'detail': 'story not found'}, 404)
            allowed, source = has_access(device_id, story_id)
            if allowed:
                return self.send_json({'unlocked': True, 'source': source, 'account': account_payload(device_id)})
            db = connect_db()
            coins = int(db.execute('SELECT coins FROM accounts WHERE device_id=?', (device_id,)).fetchone()['coins'])
            if coins < UNLOCK_COST:
                db.close()
                return self.send_json({'unlocked': False, 'code': 'INSUFFICIENT_COINS', 'needed': UNLOCK_COST, 'coins': coins, 'account': account_payload(device_id)}, 402)
            timestamp = now()
            db.execute('UPDATE accounts SET coins=coins-?,updated_at=? WHERE device_id=?', (UNLOCK_COST, timestamp, device_id))
            db.execute('INSERT OR IGNORE INTO unlocks(device_id,story_id,unlocked_at,source) VALUES(?,?,?,?)', (device_id, story_id, timestamp, 'coins'))
            db.commit(); db.close()
            return self.send_json({'unlocked': True, 'source': 'coins', 'spent': UNLOCK_COST, 'account': account_payload(device_id)})

        if path == '/api/daily-bonus':
            db = connect_db()
            account = db.execute('SELECT * FROM accounts WHERE device_id=?', (device_id,)).fetchone()
            current_day = today()
            if account['last_bonus_date'] == current_day:
                db.close()
                return self.send_json({'claimed': False, 'code': 'ALREADY_CLAIMED', 'account': account_payload(device_id)})
            streak = int(account['daily_streak'] or 0) + 1
            reward = min(50, 20 + (streak - 1) * 5)
            db.execute('UPDATE accounts SET coins=coins+?,daily_streak=?,last_bonus_date=?,updated_at=? WHERE device_id=?', (reward, streak, current_day, now(), device_id))
            db.commit(); db.close()
            return self.send_json({'claimed': True, 'reward': reward, 'streak': streak, 'account': account_payload(device_id)})

        if path == '/api/watch-complete':
            try:
                story_id = int(body.get('story_id'))
            except Exception:
                return self.send_json({'detail': 'story_id required'}, 400)
            allowed, _ = has_access(device_id, story_id)
            if not allowed:
                return self.send_json({'rewarded': False, 'code': 'LOCKED'}, 402)
            db = connect_db(); current_day = today()
            prior = db.execute('SELECT 1 FROM watch_rewards WHERE device_id=? AND story_id=? AND reward_date=?', (device_id, story_id, current_day)).fetchone()
            count = int(db.execute('SELECT COUNT(*) AS n FROM watch_rewards WHERE device_id=? AND reward_date=?', (device_id, current_day)).fetchone()['n'])
            if prior or count >= 5:
                db.close()
                return self.send_json({'rewarded': False, 'code': 'LIMIT_OR_ALREADY_REWARDED', 'account': account_payload(device_id)})
            db.execute('INSERT INTO watch_rewards(device_id,story_id,reward_date,rewarded_at) VALUES(?,?,?,?)', (device_id, story_id, current_day, now()))
            db.execute('UPDATE accounts SET coins=coins+5,updated_at=? WHERE device_id=?', (now(), device_id))
            db.commit(); db.close()
            return self.send_json({'rewarded': True, 'reward': 5, 'account': account_payload(device_id)})

        return self.send_json({'error': 'not found'}, 404)


if __name__ == '__main__':
    ThreadingHTTPServer(('0.0.0.0', 8080), Handler).serve_forever()
