#!/usr/bin/env python3
import argparse
import base64
import hashlib
import pathlib
import time

ROOT=pathlib.Path(__file__).resolve().parents[2]
RAW_PREFIX='https://raw.githubusercontent.com/IAMGodmatters/IAMMagnanimousway.js/main/local-bridge/'
PRIVATE_PREFIX='$Server.TrimEnd("/") + "/api/magnanimous/local-bridge/artifacts/'
ITEMS={
    'install.ps1':('local-bridge/install.ps1','text/plain; charset=utf-8'),
    'uninstall.ps1':('local-bridge/uninstall.ps1','text/plain; charset=utf-8'),
    'bridge_agent.py':('local-bridge/bridge_agent.py','text/x-python; charset=utf-8'),
    'ncs2_edge.py':('local-bridge/ncs2_edge.py','text/x-python; charset=utf-8'),
}

def harden_installer(data: bytes) -> bytes:
    text=data.decode('utf-8')
    preamble='''
# Fetch protected Local Bridge payloads immediately while the one-time pairing authorization is fresh.
$homeDir = Join-Path $env:USERPROFILE ".magnanimous"
New-Item -ItemType Directory -Force -Path $homeDir | Out-Null
$config = Join-Path $homeDir "local-bridge.json"
$agent = Join-Path $homeDir "bridge_agent.py"
$ncs2Agent = Join-Path $homeDir "ncs2_edge.py"
$artifactBase = $Server.TrimEnd("/") + "/api/magnanimous/local-bridge/artifacts"
$artifactHeaders = @{ "X-Magnanimous-Pairing-Code" = $PairingCode; Accept = "application/octet-stream"; "User-Agent" = "Magnanimous-Local-Bridge-Installer/2.0" }
$source = $artifactBase + "/bridge_agent.py"
$agentMeta = Invoke-RestMethod -Uri ($source + "?metadata=1") -Headers $artifactHeaders -TimeoutSec 30
Invoke-WebRequest -UseBasicParsing -Uri $source -Headers $artifactHeaders -OutFile $agent -TimeoutSec 30
$actualAgentHash = (Get-FileHash -Path $agent -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualAgentHash -ne ([string]$agentMeta.sha256).ToLowerInvariant()) { Remove-Item -Force $agent -ErrorAction SilentlyContinue; throw "Magnanimous Local Bridge agent integrity verification failed." }
$ncs2Source = $artifactBase + "/ncs2_edge.py"
try {
  $ncs2Meta = Invoke-RestMethod -Uri ($ncs2Source + "?metadata=1") -Headers $artifactHeaders -TimeoutSec 30
  Invoke-WebRequest -UseBasicParsing -Uri $ncs2Source -Headers $artifactHeaders -OutFile $ncs2Agent -TimeoutSec 30
  $actualNcs2Hash = (Get-FileHash -Path $ncs2Agent -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualNcs2Hash -ne ([string]$ncs2Meta.sha256).ToLowerInvariant()) { Remove-Item -Force $ncs2Agent -ErrorAction SilentlyContinue; throw "Magnanimous NCS2 edge helper integrity verification failed." }
} catch {
  Remove-Item -Force $ncs2Agent -ErrorAction SilentlyContinue
  Write-Warning "NCS2 edge helper was not available. Core Local Bridge activation will continue."
}
'''
    marker='$ErrorActionPreference = "Stop"\n'
    assert marker in text, 'Installer bootstrap marker changed.'
    text=text.replace(marker,marker+preamble,1)
    text=text.replace(
        f'$source = "{RAW_PREFIX}bridge_agent.py"',
        '$source = '+PRIVATE_PREFIX+'bridge_agent.py"'
    )
    text=text.replace(
        'Invoke-WebRequest -UseBasicParsing -Uri $source -OutFile $agent',
        'if (-not (Test-Path $agent)) { throw "Private Local Bridge agent preload is missing." }'
    )
    text=text.replace(
        f'$ncs2Source = "{RAW_PREFIX}ncs2_edge.py"',
        '$ncs2Source = '+PRIVATE_PREFIX+'ncs2_edge.py"'
    )
    text=text.replace(
        '  Invoke-WebRequest -UseBasicParsing -Uri $ncs2Source -OutFile $ncs2Agent',
        '  if (-not (Test-Path $ncs2Agent)) { throw "Private NCS2 edge helper preload is missing." }'
    )
    assert RAW_PREFIX not in text, 'Published installer still contains a public raw GitHub dependency.'
    for needle in (
        '/api/magnanimous/local-bridge/artifacts/bridge_agent.py',
        '/api/magnanimous/local-bridge/artifacts/ncs2_edge.py',
        'X-Magnanimous-Pairing-Code',
        'Get-FileHash -Path $agent -Algorithm SHA256',
        'Get-FileHash -Path $ncs2Agent -Algorithm SHA256',
        'Fetch protected Local Bridge payloads immediately',
        'Private Local Bridge agent preload is missing.',
    ):
        assert needle in text, f'Hardened installer missing {needle}'
    return text.encode('utf-8')

def sql_quote(value: str) -> str:
    return value.replace("'","''")

def build(output_sql: pathlib.Path, output_dir: pathlib.Path | None) -> None:
    ts=int(time.time())
    statements=[]
    if output_dir:
        output_dir.mkdir(parents=True,exist_ok=True)
    for name,(rel,media) in ITEMS.items():
        data=(ROOT/rel).read_bytes()
        if name=='install.ps1':
            data=harden_installer(data)
        encoded=base64.b64encode(data).decode('ascii')
        digest=hashlib.sha256(data).hexdigest()
        statements.append(
            "INSERT INTO magnanimous_local_bridge_artifacts(name,content_base64,sha256,byte_length,media_type,updated_at) "
            f"VALUES('{sql_quote(name)}','{encoded}','{digest}',{len(data)},'{sql_quote(media)}',{ts}) "
            "ON CONFLICT(name) DO UPDATE SET content_base64=excluded.content_base64,sha256=excluded.sha256,byte_length=excluded.byte_length,media_type=excluded.media_type,updated_at=excluded.updated_at "
            "WHERE magnanimous_local_bridge_artifacts.sha256<>excluded.sha256;"
        )
        if output_dir:
            (output_dir/name).write_bytes(data)
    output_sql.parent.mkdir(parents=True,exist_ok=True)
    output_sql.write_text('\n'.join(statements)+'\n',encoding='utf-8')
    assert len(statements)==4
    print('Built four private Local Bridge artifacts with early SHA-256 verification and no public GitHub dependency in the delivered installer.')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--sql',default='/tmp/magnanimous-local-bridge-artifacts.sql')
    parser.add_argument('--output-dir',default='')
    args=parser.parse_args()
    build(pathlib.Path(args.sql),pathlib.Path(args.output_dir) if args.output_dir else None)
