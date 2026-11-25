import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CentinelaDataService } from '../services/centinela-data.service';
import { IncidentReviewModalComponent } from '../../shared/components/incident-review-modal/incident-review-modal.component';
import { Incident } from '../models/database.models';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IncidentReviewModalComponent
  ],
  template: `
    <div class="monitoring-app">
      <!-- Persistent M3 Left Sidebar matching MonitoringDashboard base screen -->
      <aside class="monitoring-sidebar" [class.is-open]="mobileNavOpen()">
        <div class="monitoring-brand">
          <span class="brand-mark">
            <span class="material-icons-outlined">videocam</span>
          </span>
          <span class="brand-copy">
            <strong>centinela</strong>
            <small>SEGURIDAD CON IA</small>
          </span>
          <button class="icon-button sidebar-close" aria-label="Cerrar menú" (click)="mobileNavOpen.set(false)">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <button class="review-fab" type="button" (click)="openPriorityReview()">
          <span class="material-icons-outlined">error_outline</span>
          <span>Revisar alertas</span>
          @if (data.pendingIncidents().length > 0) {
            <span class="fab-count">{{ data.pendingIncidents().length }}</span>
          }
        </button>

        <div class="nav-caption">CENTRO DE CONTROL</div>
        <nav class="monitoring-nav" aria-label="Navegación principal">
          <a routerLink="/monitoreo" routerLinkActive="selected" class="nav-item" (click)="mobileNavOpen.set(false)">
            <span class="material-icons-outlined">grid_view</span>
            <span>Panel General</span>
          </a>
          <a routerLink="/incidentes" routerLinkActive="selected" class="nav-item" (click)="mobileNavOpen.set(false)">
            <span class="material-icons-outlined">history</span>
            <span>Historial</span>
            @if (data.pendingIncidents().length > 0) {
              <span class="nav-pill-count">{{ data.pendingIncidents().length }}</span>
            }
          </a>
          <a routerLink="/infraestructura" routerLinkActive="selected" class="nav-item" (click)="mobileNavOpen.set(false)">
            <span class="material-icons-outlined">router</span>
            <span>Infraestructura</span>
          </a>
          <a routerLink="/configuracion-ia" routerLinkActive="selected" class="nav-item" (click)="mobileNavOpen.set(false)">
            <span class="material-icons-outlined">settings</span>
            <span>Configuración</span>
          </a>
          <a routerLink="/usuarios" routerLinkActive="selected" class="nav-item" (click)="mobileNavOpen.set(false)">
            <span class="material-icons-outlined">admin_panel_settings</span>
            <span>Usuarios y Legal</span>
          </a>
        </nav>

        <div class="sidebar-bottom">
          <div class="system-status">
            <div class="system-heading">
              <span class="material-icons-outlined">check_circle</span>
              <strong>Sistema operativo</strong>
            </div>
            <span>IA activa · 120 ms</span>
            <span>{{ data.cameras().length }} cámaras · {{ data.sirens().length }} sirenas</span>
          </div>
          <div class="campus-name">Campus Central</div>
          <div class="operator-session">
            Sesión · {{ data.currentUser().name }} ({{ data.currentUser().role }})
          </div>
        </div>
      </aside>

      @if (mobileNavOpen()) {
        <button class="nav-scrim" aria-label="Cerrar menú" (click)="mobileNavOpen.set(false)"></button>
      }

      <!-- Main Workspace -->
      <div class="monitoring-main">
        <header class="topbar">
          <button class="icon-button mobile-menu" aria-label="Abrir menú" (click)="mobileNavOpen.set(true)">
            <span class="material-icons-outlined">menu</span>
          </button>

          <div class="breadcrumb">
            <span>Organización</span>
            <span class="breadcrumb-slash">/</span>
            <span>Campus Central</span>
            <span class="breadcrumb-slash">/</span>
            <strong>Monitoreo en vivo</strong>
          </div>

          <div class="topbar-actions">
            <button class="simulate-alert-btn" type="button" (click)="triggerSimulatedAlert()" title="Simular nueva detección de violencia por IA">
              <span class="material-icons-outlined">bolt</span>
              <span>Simular alerta IA</span>
            </button>

            <span class="live-pill"><i class="dot"></i> EN VIVO</span>

            <div class="current-time">
              <strong>18 nov 2026</strong>
              <span>14:32 · UTC−5</span>
            </div>

            <button class="icon-button" type="button" aria-label="Cambiar tema claro/oscuro" (click)="data.toggleDarkMode()" [title]="data.darkMode() ? 'Modo claro' : 'Modo oscuro'">
              <span class="material-icons-outlined">{{ data.darkMode() ? 'light_mode' : 'dark_mode' }}</span>
            </button>

            <button class="notification-button" type="button" aria-label="Notificaciones" (click)="openPriorityReview()">
              <span class="material-icons-outlined">notifications</span>
              @if (data.pendingIncidents().length > 0) {
                <span class="notif-dot">{{ data.pendingIncidents().length }}</span>
              }
            </button>

            <button class="operator-chip" type="button" (click)="router.navigate(['/login'])" title="Cambiar operador o cerrar sesión">
              {{ data.currentUser().name.split(' ')[0] }} · {{ data.currentUser().role }}
            </button>
          </div>
        </header>

        @if (data.noticeMessage()) {
          <div class="global-notice-wrapper">
            <div class="notice-banner" role="status">
              <div class="notice-content">
                <span class="material-icons-outlined">info</span>
                <span>{{ data.noticeMessage() }}</span>
              </div>
              <button aria-label="Cerrar aviso" (click)="data.clearNotice()">
                <span class="material-icons-outlined">close</span>
              </button>
            </div>
          </div>
        }

        <router-outlet />
      </div>

      <!-- Shared Incident Review Dialog -->
      <app-incident-review-modal
        [incident]="activeReviewIncident()"
        (closed)="activeReviewIncident.set(null)" />

      <!-- Mandatory Terms & Conditions Acceptance Modal (if current user hasn't accepted current terms_and_conditions) -->
      @if (!data.hasCurrentUserAcceptedTerms()) {
        <div class="m3-dialog-backdrop">
          <section class="m3-dialog" role="dialog" aria-modal="true">
            <div class="terms-modal-header">
              <span class="terms-icon">
                <span class="material-icons-outlined">gavel</span>
              </span>
              <div>
                <p class="terms-eyebrow">CUMPLIMIENTO OBLIGATORIO · VERSIÓN {{ data.currentTerms().version }}</p>
                <h2>{{ data.currentTerms().title }}</h2>
              </div>
            </div>
            <p class="terms-intro">
              Hola <strong>{{ data.currentUser().name }}</strong>, antes de operar el Centro de Control Centinela debes leer y aceptar la versión vigente de los términos y condiciones de uso.
            </p>
            <div class="terms-scroll-box">
              <pre>{{ data.currentTerms().content }}</pre>
            </div>
            <div class="terms-actions">
              <button class="m3-outlined-btn" type="button" (click)="router.navigate(['/login'])">
                Cambiar de usuario
              </button>
              <button class="m3-primary-btn" type="button" (click)="data.acceptCurrentTerms()">
                <span class="material-icons-outlined">task_alt</span>
                Acepto los términos y condiciones ({{ data.currentTerms().version }})
              </button>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .monitoring-app {
      display: flex;
      min-height: 100dvh;
      color: var(--m3-ink);
      background: var(--m3-surface);
    }
    .monitoring-sidebar {
      position: sticky;
      top: 0;
      display: flex;
      flex: 0 0 236px;
      flex-direction: column;
      width: 236px;
      height: 100dvh;
      min-height: 680px;
      padding: 30px 16px 24px;
      background: var(--m3-low);
      z-index: 15;
    }
    .monitoring-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 4px;
    }
    .brand-mark {
      display: grid;
      width: 40px;
      height: 40px;
      flex: 0 0 40px;
      place-items: center;
      color: white;
      border-radius: 12px;
      background: var(--m3-primary);
    }
    .brand-copy {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .brand-copy strong {
      color: var(--m3-brand-deep);
      font-size: 22px;
      font-weight: 500;
      line-height: 27px;
    }
    .brand-copy small {
      color: var(--m3-muted);
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.65px;
    }
    .review-fab {
      display: flex;
      min-height: 56px;
      align-items: center;
      justify-content: center;
      gap: 9px;
      margin-top: 32px;
      border: 0;
      border-radius: 16px;
      background: var(--m3-blue-container);
      color: var(--m3-brand-deep);
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
      transition: box-shadow 0.18s, transform 0.18s;
    }
    .review-fab:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 9px rgba(0, 0, 0, 0.18);
    }
    .fab-count {
      padding: 2px 7px;
      border-radius: 100px;
      background: var(--m3-error);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
    }
    .nav-caption {
      margin: 30px 8px 12px;
      color: var(--m3-muted);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.65px;
    }
    .monitoring-nav {
      display: grid;
      gap: 6px;
    }
    .nav-item {
      display: flex;
      height: 50px;
      align-items: center;
      gap: 14px;
      padding: 0 16px;
      border: 0;
      border-radius: 100px;
      background: transparent;
      color: var(--m3-muted);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover {
      background: rgba(121, 116, 126, 0.12);
    }
    .nav-item.selected {
      color: var(--m3-blue-ink);
      background: var(--m3-blue-soft);
      font-weight: 600;
    }
    .nav-pill-count {
      margin-left: auto;
      padding: 2px 8px;
      border-radius: 100px;
      background: var(--m3-error-container);
      color: var(--m3-error-ink);
      font-size: 11px;
      font-weight: 700;
    }
    .sidebar-bottom {
      margin-top: auto;
      padding-top: 16px;
    }
    .system-status {
      display: flex;
      min-height: 108px;
      flex-direction: column;
      gap: 5px;
      padding: 15px;
      border-radius: 16px;
      background: var(--m3-blue-soft);
      color: var(--m3-muted);
      font-size: 11px;
    }
    .system-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      color: var(--m3-blue-ink);
      font-size: 13px;
    }
    .system-heading .material-icons-outlined {
      color: var(--m3-primary);
      font-size: 20px;
    }
    .campus-name {
      margin: 22px 8px 4px;
      color: var(--m3-ink);
      font-size: 14px;
      font-weight: 500;
    }
    .operator-session {
      margin: 0 8px;
      color: var(--m3-muted);
      font-size: 11px;
    }
    .monitoring-main {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      display: flex;
      height: 80px;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 0 32px;
      border-bottom: 1px solid var(--m3-outline);
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 9px;
      color: var(--m3-muted);
      font-size: 13px;
      white-space: nowrap;
    }
    .breadcrumb strong {
      color: var(--m3-ink);
      font-weight: 500;
    }
    .breadcrumb-slash {
      color: #8a8490;
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .simulate-alert-btn {
      display: inline-flex;
      height: 34px;
      align-items: center;
      gap: 6px;
      padding: 0 12px;
      border: 1px solid var(--m3-error);
      border-radius: 100px;
      background: var(--m3-error-container);
      color: var(--m3-error-ink);
      font-size: 11.5px;
      font-weight: 600;
      white-space: nowrap;
      transition: transform 0.15s;
    }
    .simulate-alert-btn:hover {
      transform: translateY(-1px);
    }
    .simulate-alert-btn .material-icons-outlined {
      font-size: 16px;
    }
    .live-pill {
      display: inline-flex;
      height: 32px;
      align-items: center;
      gap: 7px;
      padding: 0 13px;
      border-radius: 100px;
      background: var(--m3-success-container);
      color: var(--m3-success);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .live-pill i.dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }
    .current-time {
      display: flex;
      min-width: 95px;
      flex-direction: column;
      gap: 2px;
      color: var(--m3-muted);
      font-size: 11px;
      white-space: nowrap;
    }
    .current-time strong {
      color: var(--m3-ink);
      font-size: 13px;
      font-weight: 500;
    }
    .icon-button {
      display: grid;
      width: 40px;
      height: 40px;
      place-items: center;
      border: 0;
      border-radius: 12px;
      background: transparent;
      color: var(--m3-muted);
    }
    .icon-button:hover {
      background: rgba(121, 116, 126, 0.14);
    }
    .notification-button {
      position: relative;
      display: grid;
      width: 44px;
      height: 44px;
      place-items: center;
      border: 0;
      border-radius: 12px;
      background: var(--m3-primary);
      color: white;
    }
    .notif-dot {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 19px;
      height: 19px;
      padding: 0 5px;
      border-radius: 100px;
      background: var(--m3-error);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: grid;
      place-items: center;
    }
    .operator-chip {
      min-height: 34px;
      padding: 0 14px;
      border: 1px solid var(--m3-outline);
      border-radius: 8px;
      background: transparent;
      color: var(--m3-ink);
      font-size: 12.5px;
      font-weight: 500;
      white-space: nowrap;
    }
    .operator-chip:hover {
      background: var(--m3-low);
    }
    .global-notice-wrapper {
      width: min(100%, 1440px);
      margin: 14px auto -8px;
      padding: 0 32px;
    }
    .notice-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      border: 1px solid #bcc9e6;
      border-radius: 12px;
      background: var(--m3-blue-soft);
      color: var(--m3-blue-ink);
      font-size: 13px;
    }
    .notice-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .notice-banner button {
      display: grid;
      width: 28px;
      height: 28px;
      place-items: center;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: inherit;
    }
    .mobile-menu, .sidebar-close, .nav-scrim {
      display: none;
    }
    /* Terms mandatory dialog */
    .terms-modal-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .terms-icon {
      display: grid;
      width: 48px;
      height: 48px;
      place-items: center;
      border-radius: 14px;
      background: var(--m3-blue-container);
      color: var(--m3-brand-deep);
    }
    .terms-eyebrow {
      margin: 0 0 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.75px;
      color: var(--m3-primary);
    }
    .terms-modal-header h2 {
      margin: 0;
      font-size: 19px;
      font-weight: 500;
    }
    .terms-intro {
      margin: 14px 0;
      font-size: 13px;
      color: var(--m3-muted);
      line-height: 1.5;
    }
    .terms-scroll-box {
      max-height: 230px;
      overflow-y: auto;
      padding: 14px;
      border-radius: 12px;
      background: var(--m3-low);
      border: 1px solid var(--m3-outline-soft);
    }
    .terms-scroll-box pre {
      margin: 0;
      white-space: pre-wrap;
      font-family: inherit;
      font-size: 12.5px;
      line-height: 1.55;
      color: var(--m3-ink);
    }
    .terms-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 18px;
    }
    @media (max-width: 900px) {
      .monitoring-sidebar {
        position: fixed;
        inset: 0 auto 0 0;
        width: min(290px, calc(100vw - 54px));
        transform: translateX(-105%);
        transition: transform 0.22s ease;
        box-shadow: 8px 0 24px rgba(0, 0, 0, 0.12);
      }
      .monitoring-sidebar.is-open {
        transform: translateX(0);
      }
      .mobile-menu {
        display: grid;
      }
      .sidebar-close {
        display: grid;
        margin-left: auto;
      }
      .nav-scrim {
        position: fixed;
        inset: 0;
        z-index: 12;
        display: block;
        border: 0;
        background: rgba(23, 21, 34, 0.45);
      }
      .topbar {
        padding-inline: 18px;
      }
      .current-time, .operator-chip {
        display: none;
      }
    }
  `]
})
export class MainLayoutComponent {
  readonly data = inject(CentinelaDataService);
  readonly router = inject(Router);

  readonly mobileNavOpen = signal<boolean>(false);
  readonly activeReviewIncident = signal<Incident | null>(null);

  openPriorityReview(): void {
    const priority = this.data.priorityIncident() ?? this.data.incidents()[0] ?? null;
    this.activeReviewIncident.set(priority);
  }

  triggerSimulatedAlert(): void {
    const created = this.data.simulateNewViolenceAlert();
    this.activeReviewIncident.set(created);
  }
}
