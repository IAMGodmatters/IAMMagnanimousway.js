# Magnanimous Kids media streaming

Magnanimous Kids uses an owner-authorized, read-only Google Drive connection for approved children’s media. The owner authorizes once through `/kids/setup`; audience playback is served through the Magnanimous backend so viewers do not receive the owner password, OAuth tokens, or Google Drive session.

Public media requests are restricted to approved Kids media roots and support HTTP Range requests for browser playback. The Kids player keeps offline/import support and can advance automatically to the next title in the same series.

This document records the production architecture only. It contains no credentials or secrets.
