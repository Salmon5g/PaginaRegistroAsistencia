# Sistema de Registro de Asistencia de Empleados

Sistema web para el control de asistencia de una empresa de productos quimicos (25 trabajadores). Permite registrar entradas/salidas, gestionar usuarios y generar reportes de atrasos, salidas anticipadas e inasistencias.

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | Nuxt 3 (Vue 3) |
| Backend | Node.js + Express |
| ORM | Sequelize |
| Base de datos | MySQL 8 |
| Autenticacion | JWT + bcrypt |

---

## Requisitos Previos

- [Node.js](https://nodejs.org/) >= 18.x
- [npm](https://www.npmjs.com/) >= 9.x
- [MySQL](https://dev.mysql.com/downloads/mysql/) >= 8.0

---

## Instalacion

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/PaginaRegistroAsistencia.git
cd PaginaRegistroAsistencia/sistema de registro de asistencia de empleados
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` como `.env` y completa tus datos de MySQL:

```bash
copy .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root          # tu usuario de MySQL
DB_PASS=tu_password   # tu password de MySQL
DB_NAME=asistencia_db
JWT_SECRET=una-clave-secreta-larga
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4000
```

### 3. Crear la base de datos

Abre MySQL Workbench, phpMyAdmin o la terminal de MySQL y ejecuta el script SQL que se encuentra en:

```
avance2_script.txt
```

O ejecuta manualmente:

```sql
CREATE DATABASE IF NOT EXISTS asistencia_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 4. Instalar dependencias del Backend

```bash
npm install
```

### 5. Ejecutar migraciones (crear tablas)

```bash
npm run db:migrate
```

Esto crea las tablas `usuarios` y `asistencias` en tu base de datos.

### 6. Instalar dependencias del Frontend

```bash
cd client
npm install
cd ..
```

---

## Ejecucion

Necesitas **2 terminales** abiertas simultaneamente:

### Terminal 1 - Backend (API)

```bash
npm run dev
```

La API estara disponible en: `http://localhost:3000`

### Terminal 2 - Frontend (UI)

```bash
cd client
npm run dev
```

La pagina estara disponible en: `http://localhost:4000`

---

## Credenciales por Defecto

Despues de ejecutar las migraciones, se crea un usuario administrador:

| Campo | Valor |
|-------|-------|
| Email | admin@asistencia.cl |
| Password | admin123 |
| Rol | administrador |

> **IMPORTANTE:** Cambia la contrasena despues del primer inicio de sesion.

---

## Estructura del Proyecto

```
sistema-de-asistencia/
├── src/                          # Backend
│   ├── config/                   # Configuracion BD
│   ├── models/                   # Modelos Sequelize (Usuario, Asistencia)
│   ├── migrations/               # Migraciones de tablas
│   ├── controllers/              # Logica de negocio
│   ├── routes/                   # Endpoints API REST
│   ├── middlewares/              # Auth JWT, manejo de errores
│   ├── seeders/                  # Datos iniciales
│   ├── app.js                    # Configuracion Express
│   └── server.js                 # Puerto + conexion BD
├── client/                       # Frontend Nuxt 3
│   └── app/
│       ├── app.vue
│       └── pages/                # Paginas Vue
│           ├── index.vue         # Landing page
│           ├── login.vue         # Inicio de sesion
│           ├── panel.vue         # Panel de asistencia
│           └── asistencias.vue   # Historial
├── .env.example                  # Variables de entorno (ejemplo)
├── .sequelizerc                  # Config Sequelize CLI
├── package.json
└── avance2_script.txt            # Script SQL de la BD
```

---

## API - Endpoints

Prefijo base: `/api/v1`

### Publicos (no requieren token)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/health` | Verificar que la API funciona |
| POST | `/api/v1/auth/login` | Iniciar sesion (devuelve JWT) |

### Protegidos (requieren token JWT en header `Authorization: Bearer <token>`)

**Asistencias:**

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/v1/asistencias` | Registrar entrada o salida |
| GET | `/api/v1/asistencias/mis` | Ver mis asistencias |
| GET | `/api/v1/asistencias` | Listar todas (solo admin) |

**Usuarios (solo admin):**

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/usuarios` | Listar usuarios |
| GET | `/api/v1/usuarios/:id` | Obtener usuario por ID |
| POST | `/api/v1/usuarios` | Crear usuario |
| PUT | `/api/v1/usuarios/:id` | Actualizar usuario |
| DELETE | `/api/v1/usuarios/:id` | Desactivar usuario |

**Reportes (solo admin):**

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/reportes/atrasos` | Entradas despues de 9:30 |
| GET | `/api/v1/reportes/salidas-anticipadas` | Salidas antes de 17:30 |
| GET | `/api/v1/reportes/inasistencias` | Dias sin registro |

### Ejemplo de login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@asistencia.cl","password":"admin123"}'
```

---

## Comandos Utiles

```bash
# Backend
npm run dev              # Iniciar en modo desarrollo
npm run start            # Iniciar en produccion
npm run db:migrate       # Ejecutar migraciones
npm run db:migrate:undo  # Deshacer ultima migracion
npm run db:migrate:status # Ver estado de migraciones

# Frontend
cd client
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para produccion
```

---


