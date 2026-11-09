#!/bin/sh
set -eu

attempt=1
max_attempts=30
while ! alembic upgrade head; do
    if [ "$attempt" -ge "$max_attempts" ]; then
        echo "No se pudo completar la migración de la base de datos después de $max_attempts intentos." >&2
        exit 1
    fi
    echo "La base de datos aún no está disponible; reintentando ($attempt/$max_attempts)." >&2
    attempt=$((attempt + 1))
    sleep 5
done

exec "$@"
