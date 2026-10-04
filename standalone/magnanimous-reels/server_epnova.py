import re
from http.server import ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

import creator_runtime
import server as base

STATIC = '/workspace/static'
base.PAYMENT_LINKS['coins500'] = 'https://buy.stripe.com/14A5kD18ueY62rC9fL6kg09'


def published_by_id(episode_id):
    for episode in creator_runtime.published_feed(100):
        if int(episode['id']) == int(episode_id):
            return episode
    return None


class ReelsHandler(base.Handler):
    server_version = 'MagnanimousReels/4.0'

    def serve_index(self):
        path = f'{STATIC}/index.html'
        try:
            html = open(path, encoding='utf-8').read()
        except Exception:
            return self.send_json({'error': 'app shell not found'}, 404)
        if 'src="/creator.js"' not in html:
            html = html.replace('</body>', '<script src="/creator.js"></script></body>')
        return self.send_bytes(html.encode('utf-8'), 'text/html; charset=utf-8', 200, 'no-cache')

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        query = parse_qs(parsed.query)

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
