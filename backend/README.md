# Wedding RSVP

Use Node.js 22.13 or later. Set RSVP_ADMIN_PASSWORD to a private password of at least 16 characters, then run node backend/server.mjs from the wedding folder. Visit http://127.0.0.1:8787/admin and sign in as admin. Create a link for each party and keep the links private.

SQLite stores replies in backend/data by default. Set RSVP_DATA_DIR to an appropriate private, persistent directory for production and backups. The server binds to loopback. Put it behind an HTTPS reverse proxy to accept internet traffic. The current static invitation and the standalone HTML do not have a running RSVP service.