# Frontend CEID

Interfaz de registro e inicio de sesión para la API de Proyectoceid.

## Desarrollo local

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env` si todavía no existe. La URL local de ejemplo es `VITE_API_URL=http://localhost:8000`.
3. Inicia el servidor con `npm run dev`.

El backend debe estar disponible en el puerto 8000. El registro usa `POST /api/v1/auth/register`; el inicio de sesión usa `POST /api/v1/auth/login`.

## Docker

Construye y ejecuta la imagen desde esta carpeta:

```bash
docker build -t proyectoceid-frontend .
docker run --rm -p 8080:80 proyectoceid-frontend
```

Abre `http://localhost:8080`. Para cambiar la dirección de la API incluida en la compilación, agrega `--build-arg VITE_API_URL=http://localhost:8000` al comando `docker build`. La API debe permitir CORS desde el origen del frontend.
