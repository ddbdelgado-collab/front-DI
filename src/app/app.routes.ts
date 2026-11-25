import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Centinela · Acceso de Operadores'
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'camara-en-vivo'
      },
      {
        path: 'camara-en-vivo',
        loadComponent: () =>
          import('./features/live-camera/live-camera.component').then(
            (m) => m.LiveCameraComponent
          ),
        title: 'Centinela · Monitoreo en Vivo'
      },
      {
        path: 'monitoreo',
        loadComponent: () =>
          import('./features/monitoring/monitoring-dashboard.component').then(
            (m) => m.MonitoringDashboardComponent
          ),
        title: 'Centinela · Panel General de Cámaras'
      },
      {
        path: 'incidentes',
        loadComponent: () =>
          import('./features/incidents/incidents-history.component').then(
            (m) => m.IncidentsHistoryComponent
          ),
        title: 'Centinela · Historial y Evidencia de Incidentes'
      },
      {
        path: 'infraestructura',
        loadComponent: () =>
          import('./features/infrastructure/infrastructure.component').then(
            (m) => m.InfrastructureComponent
          ),
        title: 'Centinela · Cámaras, Sirenas y Zonas'
      },
      {
        path: 'configuracion-ia',
        loadComponent: () =>
          import('./features/alerts-config/alerts-config.component').then(
            (m) => m.AlertsConfigComponent
          ),
        title: 'Centinela · Motor IA, Protocolos y Alertas'
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/users-terms/users-terms.component').then(
            (m) => m.UsersTermsComponent
          ),
        title: 'Centinela · Usuarios y Términos Legales'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'camara-en-vivo'
  }
];
