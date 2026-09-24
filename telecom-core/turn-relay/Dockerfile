FROM coturn/coturn:4.18.0-r0
USER root
COPY entrypoint.sh /usr/local/bin/magnanimous-turn-entrypoint
RUN chmod 0755 /usr/local/bin/magnanimous-turn-entrypoint
ENTRYPOINT ["/usr/local/bin/magnanimous-turn-entrypoint"]
