# WhatsApp eCommerce Backend

Backend API para un eCommerce conversacional enfocado en ventas por WhatsApp.

## 🚀 Características

- **Gestión de Productos**: CRUD completo con categorías, precios duales, control de inventario y soft delete
- **Pedidos Públicos**: Los clientes pueden crear pedidos sin necesidad de registrarse
- **Integración WhatsApp**: Generación automática de enlaces para enviar pedidos por WhatsApp
- **Panel Admin**: Gestión de productos, pedidos, clientes y configuración
- **Analytics**: Dashboard con estadísticas de ventas y productos más vendidos
- **Upload de Imágenes**: Integración con AWS S3 para almacenamiento de imágenes

## 📦 Stack Tecnológico

- **Framework**: NestJS + TypeScript
- **Base de Datos**: PostgreSQL + TypeORM
- **Autenticación**: JWT + Passport
- **Storage**: AWS S3
- **Documentación**: Swagger/OpenAPI

## 🛠️ Instalación

### Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- AWS S3 bucket (para imágenes)

### Configuración

1. Clonar el repositorio e instalar dependencias:

```bash
npm install
```

2. Copiar el archivo de configuración:

```bash
cp .env.example .env
```

3. Editar `.env` con tus credenciales:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=whatsapp_ecommerce

# JWT
JWT_SECRET=tu-secret-seguro

# Admin inicial
ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASSWORD=TuPassword123!

# AWS S3 (para imágenes)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_S3_BUCKET=tu-bucket
```

4. Crear la base de datos:

```bash
createdb whatsapp_ecommerce
```

5. Ejecutar el seed para crear el usuario admin:

```bash
npm run seed
```

### Desarrollo

```bash
npm run start:dev
```

La API estará disponible en `http://localhost:3000/api/v1`
La documentación Swagger en `http://localhost:3000/docs`

### Producción

```bash
npm run build
npm run start:prod
```

## 🐳 Docker

```bash
# Levantar con Docker Compose
docker-compose up -d

# Solo la base de datos
docker-compose up -d db
```

## 📚 API Endpoints

### Públicos (sin autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/products` | Listar productos visibles |
| GET | `/api/v1/products/:id` | Ver detalle de producto |
| GET | `/api/v1/categories` | Listar categorías activas |
| POST | `/api/v1/orders/public` | Crear pedido |
| GET | `/api/v1/orders/public/:publicId` | Ver resumen del pedido |
| GET | `/api/v1/settings/public` | Configuración pública |

### Admin (requiere JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesión |
| GET/POST/PATCH/DELETE | `/api/v1/products/*` | CRUD productos |
| GET/POST/PATCH/DELETE | `/api/v1/categories/*` | CRUD categorías |
| GET/PATCH/DELETE | `/api/v1/orders/*` | Gestión pedidos |
| GET/PATCH | `/api/v1/customers/*` | Gestión clientes |
| GET/PATCH | `/api/v1/settings` | Configuración |
| GET | `/api/v1/analytics/*` | Estadísticas |
| POST | `/api/v1/uploads/image` | Subir imagen |

## 🔧 Configuración del Negocio

Desde el panel admin puedes configurar:

- **businessName**: Nombre del negocio
- **businessWhatsApp**: Número de WhatsApp (con código de país, ej: 5491112345678)
- **businessAddress**: Dirección del negocio
- **currency**: Moneda (ARS, USD, etc)
- **currencySymbol**: Símbolo de la moneda ($, €, etc)

## 📱 Flujo de Pedido

1. El vendedor envía un link del catálogo al cliente por WhatsApp
2. El cliente navega los productos y arma su pedido
3. El cliente completa sus datos (nombre, teléfono, dirección opcional)
4. Al finalizar, se genera un resumen del pedido
5. El cliente presiona "Enviar por WhatsApp" que abre WhatsApp con el mensaje pre-armado
6. El pedido queda registrado en el sistema con estado "Pendiente"
7. El admin gestiona el pedido desde el panel (Contactado → Confirmado → Entregado)

## 📄 Licencia

Este proyecto es privado.
