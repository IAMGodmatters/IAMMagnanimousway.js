FROM debian:bookworm-slim

ARG ASTERISK_VERSION=22.10.1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ca-certificates curl wget xz-utils pkg-config gettext-base \
    libssl-dev libxml2-dev libsqlite3-dev uuid-dev libjansson-dev libedit-dev \
    libcurl4-openssl-dev libncurses-dev libnewt-dev libspeexdsp-dev libopus-dev \
    libsrtp2-dev liburiparser-dev libspandsp-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src
RUN wget -q "https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-${ASTERISK_VERSION}.tar.gz" && \
    tar -xzf "asterisk-${ASTERISK_VERSION}.tar.gz" && \
    cd "asterisk-${ASTERISK_VERSION}" && \
    ./configure --with-jansson-bundled && \
    make -j2 && \
    make install && \
    make samples && \
    ldconfig && \
    cd / && rm -rf "/usr/src/asterisk-${ASTERISK_VERSION}"*

RUN useradd --system --home /var/lib/asterisk --shell /usr/sbin/nologin asterisk && \
    mkdir -p /var/run/asterisk /var/log/asterisk /var/spool/asterisk /var/lib/asterisk /etc/asterisk/templates && \
    chown -R asterisk:asterisk /var/run/asterisk /var/log/asterisk /var/spool/asterisk /var/lib/asterisk

COPY templates/ /etc/asterisk/templates/
COPY entrypoint.sh /usr/local/bin/magnanimous-asterisk-entrypoint
RUN chmod 0755 /usr/local/bin/magnanimous-asterisk-entrypoint

# 5060 is owned by the Magnanimous SIP registrar. Asterisk listens on 5070
# for the internal PBX/media plane and restricted PSTN interconnect traffic.
EXPOSE 5070/udp 5070/tcp 8088/tcp 8089/tcp 10000-20000/udp
ENTRYPOINT ["/usr/local/bin/magnanimous-asterisk-entrypoint"]
CMD ["asterisk", "-f", "-U", "asterisk", "-G", "asterisk", "-vvv"]
