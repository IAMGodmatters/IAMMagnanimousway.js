from satellite.policy import LinkState, SatelliteLink, SatellitePolicy


def test_satellite_is_failover_not_public_identity():
    policy = SatellitePolicy(enabled=True)
    link = SatelliteLink(adapter="replaceable-satellite", state=LinkState.HEALTHY)
    assert policy.route_class(terrestrial_healthy=True, satellite=link) == "terrestrial"
    assert policy.route_class(terrestrial_healthy=False, satellite=link) == "satellite"


def test_degraded_satellite_keeps_voice_but_suppresses_video():
    policy = SatellitePolicy(enabled=True)
    link = SatelliteLink(adapter="replaceable-satellite", state=LinkState.DEGRADED)
    assert policy.media_allowed("voice", link) is True
    assert policy.media_allowed("video", link) is False


def test_metered_satellite_blocks_bulk_sync_by_default():
    policy = SatellitePolicy(enabled=True)
    link = SatelliteLink(adapter="replaceable-satellite", state=LinkState.HEALTHY, metered=True)
    assert policy.media_allowed("bulk-sync", link) is False
