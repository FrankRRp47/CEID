# kiraiSoft API

API FastAPI con PostgreSQL, migraciones Alembic, JWT y autenticación con Google.
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
- `POST /api/v1/auth/google`: valida la credencial de Google y devuelve un
  token de acceso Bearer. Requiere `GOOGLE_CLIENT_ID`.
- `GET /health`: comprobacion de salud.

Para generar una clave JWT de desarrollo, usa
`python -c "import secrets; print(secrets.token_urlsafe(48))"` y guardala en
`.env`. No compartas ni incluyas ese archivo en una imagen o repositorio.

## Imagen Docker

El Dockerfile se construye desde esta carpeta. `.env` se excluye del contexto;
al iniciar un contenedor, proporciona `DATABASE_URL` y `JWT_SECRET_KEY` como
variables de entorno. Usa como host de PostgreSQL el nombre del servicio o
contenedor accesible desde la red Docker, no `localhost`. El entrypoint ejecuta
automaticamente `alembic upgrade head` contra esa misma base de datos antes de
iniciar la API; si la migracion falla, el contenedor no inicia la API.

Si PostgreSQL ya esta ejecutandose en un contenedor llamado
`postgres-container`, conecta ambos contenedores a una red Docker compartida.
Ejecuta estos comandos una sola vez:

```bash
docker network create kiraisoft-network
docker network connect kiraisoft-network postgres-container
```

Desde esta carpeta, arranca la API en esa red. La migracion se ejecuta
automaticamente al iniciar el contenedor:

```bash
docker run --rm --network kiraisoft-network --env-file .env \
  -e DATABASE_URL="postgresql+psycopg://miusuario:12345678@postgres-container:5432/mibasededatos" \
  kiraisoft-backend:latest alembic upgrade head

docker run --name kiraisoft-backend --network kiraisoft-network \
  -p 8000:8000 --env-file .env \
  -e DATABASE_URL="postgresql+psycopg://miusuario:12345678@postgres-container:5432/mibasededatos" \
  kiraisoft-backend:latest
```

Si la red ya existe, omite `docker network create`. Si PostgreSQL ya esta
conectado a esa red, omite `docker network connect`. Si el contenedor del
backend con ese nombre ya existe, detenlo y eliminalo antes de volver a crearlo.
