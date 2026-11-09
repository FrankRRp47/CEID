# Despliegue de kiraiSoft

## Variables obligatorias

Configura estas variables en el proveedor cloud (no las subas al repositorio):

```env
POSTGRES_USER=kiraisoft
POSTGRES_PASSWORD=<secreto-largo-y-unico>
POSTGRES_DB=kiraisoft
DATABASE_URL=postgresql+psycopg://kiraisoft:<password-url-encoded>@postgres-container:5432/kiraisoft
JWT_SECRET_KEY=<secreto-aleatorio-de-32-o-mas-caracteres>
GOOGLE_CLIENT_ID=<client-id-de-google>
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
VITE_API_URL=
```

`VITE_API_URL` debe quedar vacío cuando el frontend y la API se publican bajo
el mismo dominio: Nginx enviará `/api` al backend. Si la API tiene un dominio
separado, usa por ejemplo `https://api.tu-dominio.com`.

## Google Sign-In

En Google Cloud Console crea un OAuth Client ID de tipo **Web application**:

- Agrega `https://tu-dominio.com` a **Authorized JavaScript origins**.
- Agrega `https://tu-dominio.com` a **Authorized redirect URIs** si tu
  configuración de Google lo solicita.
- Usa el mismo Client ID en `GOOGLE_CLIENT_ID`; Compose lo inyecta también como
  `VITE_GOOGLE_CLIENT_ID` durante el build del frontend.

## Dokploy / Docker Compose

El Compose publica solo el frontend. El proxy cloud debe apuntar al puerto
interno `80` del servicio `frontend`. El backend y PostgreSQL se comunican
únicamente dentro de la red Docker.

Si el proveedor no crea automáticamente la red externa de Dokploy, créala
una sola vez antes del despliegue:

```powershell
docker network create dokploy-network
```

El volumen `postgres_data` es persistente. No uses `docker compose down -v`
en producción porque elimina los datos de PostgreSQL.

## Comprobaciones posteriores

- Frontend: `https://tu-dominio.com`
- Salud de API: `https://tu-dominio.com/health`
- Documentación API: `https://tu-dominio.com/docs`
