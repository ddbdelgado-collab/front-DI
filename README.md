# Centinela · Seguridad con IA (Frontend Angular M3)

Frontend del sistema de videovigilancia y detección de violencia mediante Inteligencia Artificial, desarrollado con **Angular 19 (Standalone Components)**, **Lazy Loading**, **Formularios Reactivos** y **Material Design 3 (M3)** siguiendo la línea gráfica **Centinela Control Room** (`--m3-primary: #1854ca`, `--m3-surface: #fef7ff`, `--m3-low: #f7f2fa`).

## Arquitectura del Proyecto

```text
src/app/
├── core/
│   ├── models/database.models.ts          # Interfaces TypeScript 1:1 con las 11 tablas SQL
│   ├── services/centinela-data.service.ts # Estado reactivo con Signals y Mock Data
│   └── layout/main-layout.component.ts    # Shell M3 (Sidebar + Topbar + Modal de Términos)
├── shared/
│   └── components/incident-review-modal/  # Modal de revisión de incidente, evidencia y protocolo
├── features/
│   ├── auth/login.component.ts            # Login y selector rápido de operadores (users)
│   ├── monitoring/                        # Centro de Monitoreo en vivo (cámaras, sirenas, métricas)
│   ├── incidents/                         # Historial de incidentes, filtros, evidencia y correo
│   ├── infrastructure/                    # CRUD de Cámaras, Sirenas y Zonas
│   ├── alerts-config/                     # Categorías IA (umbrales), Protocolos, Contactos y Envíos
│   └── users-terms/                       # CRUD de Usuarios, Versiones de Términos y Aceptaciones
├── app.routes.ts
└── app.config.ts
```

## Ejecución en Desarrollo

```bash
npm install
npm start
```
