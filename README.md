# 🍳 Morfi-Plan

Aplicación para planificar comidas semanales. Gestiona menús, asigna comidas a días de la semana y recibe listas de compras por email.

## ✨ Características

- 📅 **Calendario Semanal**: Vista de lunes a viernes con almuerzos y cenas
- 🍽️ **Biblioteca de Menús**: Crea, edita y organiza tus recetas
- 📝 **Asignación Simple**: Asigna menús a días específicos
- 📧 **Emails Automáticos**: Envía la lista de compras semanal (con Resend)
- 📱 **Responsive**: Diseño optimizado para móviles
- 🔄 **Sincronización**: Datos persistentes en JSONBin.io

## 🚀 Deploy en Vercel

### 1. Crear cuentas necesarias

#### JSONBin.io (para persistencia de datos)

1. Ve a [https://jsonbin.io](https://jsonbin.io)
2. Crea una cuenta gratuita
3. Obtén tu **API Key** en [https://jsonbin.io/api-keys](https://jsonbin.io/api-keys)
4. Crea un nuevo bin vacío en [https://jsonbin.io/app/bins/new](https://jsonbin.io/app/bins/new)
5. Copia el **Bin ID** (está en la URL: `https://jsonbin.io/app/bins/xxxxxxxxxxxxx`)

#### Resend (para envío de emails)

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Obtén tu **API Key** en [https://resend.com/api-keys](https://resend.com/api-keys)
4. Opcional: Verifica tu dominio o usa el dominio por defecto `morfi-plan.resend.dev`

### 2. Configurar Variables de Entorno

En el dashboard de Vercel, agrega estas variables:

```env
# JSONBin.io
NEXT_PUBLIC_JSONBIN_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_JSONBIN_BIN_ID=tu_bin_id_aqui

# Resend
RESEND_API_KEY=tu_api_key_aqui
```

### 3. Deploy

```bash
# Local development
npm install
npm run dev

# Production build
npm run build
```

## 📁 Estructura del Proyecto

```
morfi-plan/
├── app/
│   ├── page.tsx              # Dashboard/Calendario
│   ├── menus/page.tsx        # Biblioteca de menús
│   ├── asignar/page.tsx      # Asignar menús
│   ├── api/send-email/       # API para emails
│   └── layout.tsx            # Layout principal
├── components/
│   ├── Navigation.tsx        # Navegación responsive
│   └── ui/                   # Componentes shadcn/ui
├── lib/
│   ├── types.ts              # Tipos TypeScript
│   ├── jsonbin.ts            # Cliente JSONBin.io
│   └── email.ts              # Cliente Resend
└── .env.example              # Variables de entorno
```

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **Storage**: JSONBin.io (free tier)
- **Email**: Resend (free tier: 100 emails/día)
- **Icons**: Lucide React
- **Types**: TypeScript

## 📱 Uso

1. **Menús**: Crea tus recetas con ingredientes e imágenes
2. **Asignar**: Planifica tu semana asignando menús a días
3. **Dashboard**: Ve el calendario semanal y la próxima comida
4. **Email**: Envía la lista de compras desde la página "Asignar"

## 🔒 Notas de Seguridad

- Las claves API deben mantenerse privadas
- `NEXT_PUBLIC_*` son accesibles desde el cliente
- `RESEND_API_KEY` es solo del servidor (sin NEXT*PUBLIC*)

## 📄 Licencia

MIT
