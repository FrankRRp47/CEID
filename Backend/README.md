# Backend

API FastAPI con PostgreSQL, migraciones Alembic y autenticacion mediante JWT.
El backend requiere Python 3.15.2; el Dockerfile de esta carpeta es independiente
del frontend y del contenedor de PostgreSQL.

## Desarrollo local

1. Asegurate de que PostgreSQL este ejecutandose y de que los datos de conexion
   de `.env` coincidan con esa instancia. El `.env` incluido contiene valores
   solo para desarrollo local; cambia `JWT_SECRET_KEY` por un secreto aleatorio
   antes de cualquier uso compartido o despliegue.
2. Desde esta carpeta, crea y activa un entorno virtual e instala dependencias:

   ```powershell
   py -3.15 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. Aplica la migracion inicial y arranca la API:

   ```powershell
   alembic upgrade head
   uvicorn main:app --reload
   ```

La API queda disponible en `http://localhost:8000`; la documentacion interactiva
esta en `/docs`. Si PostgreSQL esta en un contenedor, publica su puerto 5432
para que la URL local de `.env` pueda alcanzarlo.

## Endpoints

- `POST /api/v1/auth/register`: crea una cuenta. JSON: `username`, `email`,
  `password` (minimo 8 caracteres).
- `POST /api/v1/auth/login`: autentica con `email` y `password`; devuelve un
  token de acceso Bearer.
- `GET /health`: comprobacion de salud.

Para generar una clave JWT de desarrollo, usa
`python -c "import secrets; print(secrets.token_urlsafe(48))"` y guardala en
`.env`. No compartas ni incluyas ese archivo en una imagen o repositorio.

## Imagen Docker

El Dockerfile se construye desde esta carpeta. `.env` se excluye del contexto;
al iniciar un contenedor, proporciona `DATABASE_URL` y `JWT_SECRET_KEY` como
variables de entorno. Usa como host de PostgreSQL el nombre del servicio o
contenedor accesible desde la red Docker, no `localhost`. Aplica
`alembic upgrade head` contra esa misma base de datos antes de iniciar la API.

Si PostgreSQL ya esta ejecutandose en un contenedor llamado
`postgres-container`, conecta ambos contenedores a una red Docker compartida.
Ejecuta estos comandos una sola vez:

```bash
docker network create proyectoceid-network
docker network connect proyectoceid-network postgres-container
```

Desde esta carpeta, aplica la migracion y arranca la API en esa red:

```bash
docker run --rm --network proyectoceid-network --env-file .env \
  -e DATABASE_URL="postgresql+psycopg://miusuario:12345678@postgres-container:5432/mibasededatos" \
  proyectoceid-backend:latest alembic upgrade head

docker run --name proyectoceid-backend --network proyectoceid-network \
  -p 8000:8000 --env-file .env \
  -e DATABASE_URL="postgresql+psycopg://miusuario:12345678@postgres-container:5432/mibasededatos" \
  proyectoceid-backend:latest
```

Si la red ya existe, omite `docker network create`. Si PostgreSQL ya esta
conectado a esa red, omite `docker network connect`. Si el contenedor del
backend con ese nombre ya existe, detenlo y eliminalo antes de volver a crearlo.
