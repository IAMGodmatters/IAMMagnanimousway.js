FROM debian:bookworm-slim

ARG KAMAILIO_VERSION=6.0.7

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates gnupg wget gettext-base postgresql-client && \
    wget -qO- https://deb.kamailio.org/kamailiodebkey.gpg | gpg --dearmor -o /usr/share/keyrings/kamailio.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/kamailio.gpg] https://deb-archive.kamailio.org/repos/kamailio-${KAMAILIO_VERSION} bookworm main" > /etc/apt/sources.list.d/kamailio.list && \
    apt-get update && apt-get install -y --no-install-recommends \
      kamailio kamailio-postgres-modules && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/kamailio/templates /var/run/kamailio && \
    chown -R kamailio:kamailio /var/run/kamailio

COPY kamailio.cfg.template /etc/kamailio/templates/kamailio.cfg.template
COPY entrypoint.sh /usr/local/bin/magnanimous-sip-entrypoint
RUN chmod 0755 /usr/local/bin/magnanimous-sip-entrypoint

EXPOSE 5060/udp 5060/tcp
ENTRYPOINT ["/usr/local/bin/magnanimous-sip-entrypoint"]
CMD ["kamailio", "-DD", "-E", "-u", "kamailio", "-g", "kamailio", "-f", "/etc/kamailio/kamailio.cfg"]
