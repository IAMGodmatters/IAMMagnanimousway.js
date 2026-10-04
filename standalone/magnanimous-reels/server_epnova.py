import re
from http.server import ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

import creator_runtime
import series_runtime
import video_runtime
import server as base

STATIC = '/workspace/static'
base.PAYMENT_LINKS['coins500'] = 'https://buy.stripe.com/14A5kD18ueY62rC9fL6kg09'
# Every series now gives Episodes 1-3 free. The old pilot card is Episode 1, so all 60 pilots remain free previews.
base.FREE_STORY_IDS = set(base.BY_ID.keys())


def published_by_id(episode_id):
    for episode in creator_runtime.published_feed(100):
        if int(episode['id']) == int(episode_id):
            return episode
    return None


class ReelsHandler(base.Handler):
    server_version = 'MagnanimousReels/5.1'

    def serve_index(self):
        path = f'{STATIC}/index.html'
        try:
            html = open(path, encoding='utf-8').read()
        except Exception:
            return self.send_json({'error': 'app shell not found'}, 404)
        if 'src="/creator.js"' not in html:
            html = html.replace('</body>', '<script src="/creator.js"></script></body>')
        if 'src="/series.js"' not in html:
            html = html.replace('</body>', '<script src="/series.js"></script></body>')
        if 'src="/premium-gating.js"' not in html:
            html = html.replace('</body>', '<script src="/premium-gating.js"></script></body>')
        return self.send_bytes(html.encode('utf-8'), 'text/html; charset=utf-8', 200, 'no-cache')

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        query = parse_qs(parsed.query)

        if path == '/api/series':
            return self.send_json({'series': series_runtime.series_list(), 'render': series_runtime.render_summary()})

        if path == '/api/video/capabilities':
            data = video_runtime.capabilities(); data['render'] = series_runtime.render_summary()
            return self.send_json(data)

        series_match = re.fullmatch(r'/api/series/(\d+)', path)
        if series_match:
            item = series_runtime.get_series(int(series_match.group(1)))
            if not item:
                return self.send_json({'detail': 'Series not found.'}, 404)
            return self.send_json({'series': item})

        episode_series_match = re.fullmatch(r'/api/series/(\d+)/episode/(\d+)', path)
        if episode_series_match:
            sid, epn = map(int, episode_series_match.groups())
            item = series_runtime.get_episode(sid, epn)
            if not item:
                return self.send_json({'detail': 'Episode not found.'}, 404)
            device_id = (query.get('device') or [''])[0]
            weekly = bool(base.valid_device(device_id) and base.pass_active(base.ensure_account(device_id)))
            allowed, source = series_runtime.access(device_id, sid, epn, weekly)
            payload = dict(item)
            payload['access'] = {'allowed': allowed, 'source': source, 'unlock_cost': series_runtime.UNLOCK_COST}
            return self.send_json({'episode': payload})

        series_video = re.fullmatch(r'/series-video/(\d+)/(\d+)\.mp4', path)
        if series_video:
            sid, epn = map(int, series_video.groups())
            device_id = (query.get('device') or [''])[0]
            weekly = bool(base.valid_device(device_id) and base.pass_active(base.ensure_account(device_id)))
            allowed, _ = series_runtime.access(device_id, sid, epn, weekly)
            if not allowed:
                return self.send_json({'detail': 'Episode locked.', 'code': 'PAYMENT_REQUIRED', 'unlock_cost': series_runtime.UNLOCK_COST}, 402)
            item = series_runtime.get_episode(sid, epn)
            if not item or not item.get('real_video_ready'):
                return self.send_json({'detail': 'Real cinematic video has not been rendered yet.', 'code': 'REAL_VIDEO_PENDING'}, 409)
            return self.serve(series_runtime.video_path(sid, epn), 'private, max-age=3600')

        if path == '/series.js':
            return self.serve(f'{STATIC}/series.js', 'no-cache')

        if path == '/premium-gating.js':
            return self.serve(f'{STATIC}/premium-gating.js', 'no-cache')

        if path == '/api/creator/config':
            return self.send_json(creator_runtime.creator_config())

        project_match = re.fullmatch(r'/api/creator/projects/([A-Za-z0-9_-]{16,128})', path)
        if project_match:
            device_id = project_match.group(1)
            return self.send_json({'projects': creator_runtime.list_projects(device_id)})

        if path == '/api/creator/published':
            return self.send_json({'episodes': creator_runtime.published_feed(50)})

        episode_match = re.fullmatch(r'/api/creator/episode/(\d+)', path)
        if episode_match:
            episode_id = int(episode_match.group(1))
            device_id = (query.get('device') or [''])[0]
            episode = creator_runtime.get_episode_for_owner(device_id, episode_id) if base.valid_device(device_id) else None
            if not episode:
                episode = published_by_id(episode_id)
            if not episode:
                return self.send_json({'detail': 'Episode not found.'}, 404)
            return self.send_json({'episode': episode, 'timings': creator_runtime.episode_timing(episode_id)})

        audio_match = re.fullmatch(r'/creator-audio/(\d+)\.mp3', path)
        if audio_match:
            episode_id = int(audio_match.group(1))
            device_id = (query.get('device') or [''])[0]
            allowed = bool(published_by_id(episode_id))
            if not allowed and base.valid_device(device_id):
                allowed = bool(creator_runtime.get_episode_for_owner(device_id, episode_id))
            if not allowed:
                return self.send_json({'detail': 'Episode audio is not available.'}, 403)
            return self.serve(f'{STATIC}/creator-audio/{episode_id}.mp3', 'private, max-age=3600')

        timing_match = re.fullmatch(r'/creator-timings/(\d+)\.json', path)
        if timing_match:
            episode_id = int(timing_match.group(1))
            device_id = (query.get('device') or [''])[0]
            allowed = bool(published_by_id(episode_id))
            if not allowed and base.valid_device(device_id):
                allowed = bool(creator_runtime.get_episode_for_owner(device_id, episode_id))
            if not allowed:
                return self.send_json({'detail': 'Episode timeline is not available.'}, 403)
            return self.serve(f'{STATIC}/creator-timings/{episode_id}.json', 'private, max-age=3600')

        ambient_match = re.fullmatch(r'/ambient/([a-z]+)\.wav', path)
        if ambient_match:
            return self.serve(f"{STATIC}/ambient/{ambient_match.group(1)}.wav", 'public, max-age=604800, immutable')

        if path == '/creator.js':
            return self.serve(f'{STATIC}/creator.js', 'no-cache')

        if path in ['/', '/watch', '/series', '/pricing', '/rewards', '/my-reels', '/create', '/work-list']:
            return self.serve_index()

        return super().do_GET()

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        if path == '/api/series/unlock':
            payload = self.read_json(); device_id = str(payload.get('device_id') or '')
            if not base.valid_device(device_id):
                return self.send_json({'detail': 'Valid device_id required.'}, 400)
            base.ensure_account(device_id)
            try:
                sid = int(payload.get('series_id')); epn = int(payload.get('episode_number'))
            except Exception:
                return self.send_json({'detail': 'Valid series_id and episode_number required.'}, 400)
            episode = series_runtime.get_episode(sid, epn)
            if not episode:
                return self.send_json({'detail': 'Episode not found.'}, 404)
            if epn > series_runtime.FREE_EPISODES and not episode.get('real_video_ready'):
                return self.send_json({'unlocked': False, 'code': 'REAL_VIDEO_PENDING', 'detail': 'This paid episode cannot take coins until its real cinematic video is rendered.'}, 409)
            weekly = base.pass_active(base.ensure_account(device_id))
            if weekly:
                result = {'unlocked': True, 'source': 'weekly_pass', 'spent': 0}
            else:
                result = series_runtime.unlock(device_id, sid, epn)
            result['account'] = base.account_payload(device_id)
            result['series_unlocks'] = series_runtime.unlocked_episode_keys(device_id)
            return self.send_json(result, 200 if result.get('unlocked') else 402)

        if not path.startswith('/api/creator/'):
            return super().do_POST()

        payload = self.read_json()
        device_id = str(payload.get('device_id') or '')
        if not base.valid_device(device_id):
            return self.send_json({'detail': 'Valid device_id required.'}, 400)
        base.ensure_account(device_id)

        if path == '/api/creator/project':
            project, error = creator_runtime.create_project(device_id, payload)
            if error:
                return self.send_json({'detail': error}, 400)
            return self.send_json({'project': project}, 201)

        if path == '/api/creator/episode':
            episode, error = creator_runtime.create_episode(device_id, payload)
            if error:
                return self.send_json({'detail': error}, 400)
            return self.send_json({'episode': episode}, 201)

        if path == '/api/creator/generate':
            try:
                episode_id = int(payload.get('episode_id'))
            except Exception:
                return self.send_json({'detail': 'Valid episode_id required.'}, 400)
            episode, error = creator_runtime.generate_episode(device_id, episode_id)
            if error:
                return self.send_json({'detail': error}, 500)
            return self.send_json({'episode': episode, 'generated': True, 'cost': 0})

        if path == '/api/creator/publish':
            try:
                episode_id = int(payload.get('episode_id'))
            except Exception:
                return self.send_json({'detail': 'Valid episode_id required.'}, 400)
            episode, error = creator_runtime.publish_episode(device_id, episode_id)
            if error:
                return self.send_json({'detail': error}, 409)
            return self.send_json({'episode': episode, 'published': True})

        return self.send_json({'error': 'not found'}, 404)


if __name__ == '__main__':
    ThreadingHTTPServer(('0.0.0.0', 8080), ReelsHandler).serve_forever()
