import json, os, urllib.request

BYTEPLUS_CREATE='https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks'
BYTEPLUS_MODEL=os.getenv('BYTEPLUS_VIDEO_MODEL','dreamina-seedance-2-5-260628')


def capabilities():
    return {
        'production_target':'cinematic_live_action_vertical',
        'local_gpu':False,
        'wan_endpoint_configured':bool(os.getenv('WAN_VIDEO_API_URL')),
        'byteplus_configured':bool(os.getenv('BYTEPLUS_API_KEY')),
        'fallback':'motion_comic_preview_only',
        'requirements':{
            'wan_2_2_ti2v_5b':'~24 GB VRAM minimum',
            'byteplus_seedance':'funded API account/key required'
        },
        'audio_target':'synchronized dialogue, foley, ambience and score'
    }


def _post_json(url,payload,headers=None,timeout=30):
    data=json.dumps(payload).encode()
    req=urllib.request.Request(url,data=data,method='POST',headers={'content-type':'application/json',**(headers or {})})
    with urllib.request.urlopen(req,timeout=timeout) as response:
        return json.loads(response.read())


def _get_json(url,headers=None,timeout=30):
    req=urllib.request.Request(url,headers=headers or {})
    with urllib.request.urlopen(req,timeout=timeout) as response:
        return json.loads(response.read())


def create_job(prompt):
    wan=os.getenv('WAN_VIDEO_API_URL','').strip()
    if wan:
        try:
            return {'provider':'wan2.2','ok':True,'response':_post_json(wan,{'prompt':prompt,'aspect_ratio':'9:16','resolution':'720p','generate_audio':True})}
        except Exception as exc:
            return {'provider':'wan2.2','ok':False,'error':str(exc)}
    key=os.getenv('BYTEPLUS_API_KEY','').strip()
    if key:
        payload={
            'model':BYTEPLUS_MODEL,
            'content':[{'type':'text','text':prompt}],
            'ratio':'9:16',
            'resolution':'720p',
            'duration':30,
            'generate_audio':True,
            'watermark':False
        }
        try:
            result=_post_json(BYTEPLUS_CREATE,payload,{'Authorization':f'Bearer {key}'})
            return {'provider':'seedance','ok':bool(result.get('id')),'task_id':result.get('id'),'response':result}
        except Exception as exc:
            return {'provider':'seedance','ok':False,'error':str(exc)}
    return {
        'provider':None,
        'ok':False,
        'code':'REAL_VIDEO_CAPACITY_REQUIRED',
        'detail':'No funded hosted video API or self-hosted 24GB+ GPU renderer is configured.'
    }


def get_seedance_task(task_id):
    key=os.getenv('BYTEPLUS_API_KEY','').strip()
    if not key:
        return {'ok':False,'code':'NOT_CONFIGURED'}
    try:
        return {'ok':True,'response':_get_json(BYTEPLUS_CREATE+'/'+task_id,{'Authorization':f'Bearer {key}'})}
    except Exception as exc:
        return {'ok':False,'error':str(exc)}
