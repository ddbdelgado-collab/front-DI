import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CentinelaDataService } from '../../core/services/centinela-data.service';
import { Camera, Incident } from '../../core/models/database.models';
import { IncidentReviewModalComponent } from '../../shared/components/incident-review-modal/incident-review-modal.component';

@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, IncidentReviewModalComponent],
  template: `
    <main class="m3-page">
      <section class="welcome-row">
        <div>
          <h1>Tu operación, bajo control.</h1>
          <p>Detecta a tiempo. Revisa con contexto. Actúa con criterio.</p>
        </div>
        <div class="welcome-actions">
          <div class="zone-filter-chips">
            <button
              type="button"
              class="zone-chip"
              [class.active]="selectedZoneId() === null"
              (click)="selectedZoneId.set(null)">
              Todas las zonas ({{ data.cameras().length }})
            </button>
            @for (z of data.zones(); track z.id) {
              <button
                type="button"
                class="zone-chip"
                [class.active]="selectedZoneId() === z.id"
                (click)="selectedZoneId.set(z.id)">
                {{ z.name.split('·')[0].trim() }}
              </button>
            }
          </div>
          <span class="date-chip">
            <span class="material-icons-outlined">schedule</span>
            Hoy, 18 de noviembre
          </span>
        </div>
      </section>

      <!-- 4 M3 Operational Metric Cards -->
      <section class="metrics-grid" aria-label="Resumen de operación">
        <article class="metric-card">
          <div class="metric-top">
            <span>Cámaras conectadas</span>
            <span class="material-icons-outlined">videocam</span>
          </div>
          <strong class="metric-value">{{ onlineCamerasCount() }} / {{ data.cameras().length }}</strong>
          <small>{{ activeZonesCount() }} zonas activas supervisadas</small>
        </article>

        <article class="metric-card metric-primary">
          <div class="metric-top">
            <span>Alertas de hoy</span>
            <span class="material-icons-outlined">notifications_active</span>
          </div>
          <strong class="metric-value">{{ data.incidents().length }}</strong>
          <small>{{ data.pendingIncidents().length }} pendientes de revisión humana</small>
        </article>

        <article class="metric-card">
          <div class="metric-top">
            <span>Incidentes confirmados</span>
            <span class="material-icons-outlined">check_circle</span>
          </div>
          <strong class="metric-value">{{ confirmedCount() | number:'2.0-0' }}</strong>
          <small>Verificados por un operador</small>
        </article>

        <article class="metric-card">
          <div class="metric-top">
            <span>Sirenas y Tiempo IA</span>
            <span class="material-icons-outlined">campaign</span>
          </div>
          <strong class="metric-value">120 ms</strong>
          <small>
            @if (soundingSirensCount() > 0) {
              <b class="siren-active-text">{{ soundingSirensCount() }} sirena(s) sonando ahora</b>
            } @else {
              {{ onlineSirensCount() }} sirenas listas en línea
            }
          </small>
        </article>
      </section>

      <!-- Priority Incident Banner (from incidents table) -->
      @if (data.priorityIncident(); as prio) {
        <section class="priority-alert" aria-label="Alerta prioritaria">
          <span class="material-icons-outlined priority-icon">error_outline</span>
          <div class="priority-copy">
            <strong>
              Posible {{ data.getCategoryById(prio.category_id)?.name | lowercase }} en {{ data.getCameraById(prio.camera_id)?.name }}
            </strong>
            <span>
              {{ data.getCameraById(prio.camera_id)?.code }} · {{ prio.occurred_at | date:'HH:mm:ss' }} ·
              Confianza {{ (prio.confidence * 100).toFixed(1) }} % ·
              {{ prio.alarm_active ? 'Sirena activa en zona' : 'Alarma silenciada' }} · Requiere revisión humana
            </span>
          </div>
          <div class="priority-btns">
            @if (prio.alarm_active) {
              <button class="m3-danger-btn" type="button" (click)="data.silenceIncidentAlarm(prio.id)">
                <span class="material-icons-outlined">volume_off</span>
                Silenciar sirena
              </button>
            }
            <button class="m3-primary-btn priority-action" type="button" (click)="selectedIncident.set(prio)">
              Revisar incidente
              <span class="material-icons-outlined">arrow_forward</span>
            </button>
          </div>
        </section>
      }

      <!-- Live Camera Feeds + Recent Activity Column -->
      <section class="monitoring-grid">
        <div class="camera-section">
          <div class="section-heading">
            <div>
              <h2>Cámaras en vivo</h2>
              <p>
                Vista prioritaria · {{ filteredCameras().length }} de {{ data.cameras().length }} cámaras ·
                Fuente RTSP / ONVIF / HTTP
              </p>
            </div>
            <div class="m3-segmented" role="group" aria-label="Vista de cámaras">
              <button type="button" [class.active]="cameraMode() === 'live'" (click)="cameraMode.set('live')">
                En vivo
              </button>
              <button type="button" [class.active]="cameraMode() === 'history'" (click)="cameraMode.set('history')">
                Historial
              </button>
            </div>
          </div>

          @if (cameraMode() === 'history') {
            <div class="history-note">
              Mostrando las últimas transmisiones registradas con evidencia en la tabla <code>evidence</code>. Selecciona “En vivo” para volver al stream en tiempo real.
            </div>
          }

          <div class="camera-grid">
            @for (cam of filteredCameras(); track cam.id) {
              @let camAlert = getPendingIncidentForCamera(cam.id);
              <article class="camera-card">
                <div
                  class="camera-feed"
                  (click)="openLiveCamera(cam)"
                  [title]="'Ver ' + cam.name + ' en vivo'"
                  [style.backgroundImage]="'linear-gradient(180deg, rgba(18, 20, 28, .14), rgba(18, 20, 28, .48)), url(' + cam.preview_image + ')'">
                  <span class="camera-status" [class.camera-status-alert]="!!camAlert" [class.camera-status-warn]="cam.status !== 'ONLINE'">
                    <i class="dot"></i>
                    @if (camAlert) {
                      Posible {{ data.getCategoryById(camAlert.category_id)?.name | lowercase }}
                    } @else if (cam.status === 'ONLINE') {
                      Sin anomalías
                    } @else {
                      {{ cam.status }}
                    }
                  </span>

                  <span class="camera-live">
                    {{ cam.source_type }} · {{ cam.fps }} FPS {{ cam.captures_audio ? '· AUDIO' : '' }}
                  </span>

                  @if (camAlert && camAlert.bounding_box) {
                    <span
                      class="detection-box"
                      [style.top.%]="camAlert.bounding_box.top"
                      [style.left.%]="camAlert.bounding_box.left"
                      [style.width.%]="camAlert.bounding_box.width"
                      [style.height.%]="camAlert.bounding_box.height">
                      <b>{{ data.getCategoryById(camAlert.category_id)?.name }} · {{ (camAlert.confidence * 100).toFixed(1) }} %</b>
                    </span>
                  }

                  <span class="camera-timestamp">{{ cam.code }} · 18/11/2026 14:32:08</span>
                </div>

                <div class="camera-info">
                  <div>
                    <strong>{{ cam.name }}</strong>
                    <span>
                      {{ data.getZoneById(cam.zone_id)?.name }} ·
                      {{ camAlert ? 'Alerta #' + camAlert.id + ' por revisar' : 'IA analizando stream' }}
                    </span>
                  </div>
                  <button
                    class="camera-open"
                    type="button"
                    [attr.aria-label]="'Abrir ' + cam.name"
                    (click)="openCameraOrIncident(cam, camAlert)">
                    <span class="material-icons-outlined">arrow_forward</span>
                  </button>
                </div>
              </article>
            }
          </div>
        </div>

        <!-- Right column: Recent Activity & Active Sirens -->
        <aside class="side-stack">
          <div class="activity-card">
            <h2>Actividad reciente</h2>
            <div class="activity-list">
              @for (inc of data.incidents().slice(0, 5); track inc.id) {
                <div class="activity-item" (click)="selectedIncident.set(inc)">
                  <span
                    class="activity-icon"
                    [class.activity-alert]="inc.review_status === 'PENDING'"
                    [class.activity-confirmed]="inc.review_status === 'CONFIRMED'"
                    [class.activity-dismissed]="inc.review_status === 'DISMISSED'">
                    <span class="material-icons-outlined">
                      {{ inc.review_status === 'PENDING' ? 'error_outline' : inc.review_status === 'CONFIRMED' ? 'check' : 'remove_circle_outline' }}
                    </span>
                  </span>
                  <div class="activity-copy">
                    <strong>{{ data.getCategoryById(inc.category_id)?.name }}</strong>
                    <span>
                      {{ data.getCameraById(inc.camera_id)?.code }} · {{ data.getCameraById(inc.camera_id)?.name }} ·
                      {{ (inc.confidence * 100).toFixed(1) }}%
                    </span>
                  </div>
                  <time>{{ inc.occurred_at | date:'HH:mm' }}</time>
                </div>
              }
            </div>
            <button class="m3-primary-btn history-button" type="button" (click)="router.navigate(['/incidentes'])">
              <span class="material-icons-outlined">history</span>
              Ver historial completo
            </button>
          </div>

          <div class="siren-quick-card">
            <div class="siren-header">
              <strong>Sirenas por zona (<code>sirens</code>)</strong>
              <button class="link-btn" type="button" (click)="router.navigate(['/infraestructura'])">Gestionar</button>
            </div>
            <div class="siren-mini-list">
              @for (s of data.sirens(); track s.id) {
                <div class="siren-mini-row" [class.sounding]="s.is_sounding">
                  <div>
                    <strong>{{ s.name }}</strong>
                    <small>{{ s.connection_type }} · {{ s.port || s.bluetooth_address }}</small>
                  </div>
                  <button
                    type="button"
                    class="siren-toggle-pill"
                    [class.active]="s.is_sounding"
                    [disabled]="!s.is_active"
                    (click)="data.toggleSirenTest(s.id)">
                    {{ s.is_sounding ? 'Silenciar' : 'Probar' }}
                  </button>
                </div>
              }
            </div>
          </div>
        </aside>
      </section>

      <!-- Bottom Row: Hourly Bar Chart + Human Control Principle Card -->
      <section class="bottom-grid">
        <article class="chart-card">
          <div class="chart-heading">
            <strong>Alertas durante el día</strong>
            <span>
              {{ data.incidents().length }} registradas · {{ confirmedCount() }} confirmadas ·
              {{ dismissedCount() }} descartadas · {{ data.pendingIncidents().length }} pendientes
            </span>
          </div>
          <div class="bar-chart" role="img" aria-label="Gráfico de alertas por hora">
            @for (count of data.hourlyAlerts(); track $index) {
              <span
                [class.peak]="$index === 14"
                [style.height.px]="count * 8 > 8 ? count * 8 : 8"
                [title]="($index < 10 ? '0' + $index : $index) + ':00 — ' + count + ' alertas'"></span>
            }
          </div>
          <div class="chart-labels">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </article>

        <article class="human-control-card">
          <span class="material-icons-outlined human-check">verified_user</span>
          <strong>La IA alerta. Tú decides.</strong>
          <p>Cada detección es una señal sujeta al umbral de confianza y persistencia, no una confirmación automática. Revisa la evidencia antes de actuar.</p>
          <button class="m3-outlined-btn" type="button" (click)="router.navigate(['/configuracion-ia'])">
            <span class="material-icons-outlined">tune</span>
            Ajustar umbrales de detección
          </button>
        </article>
      </section>
    </main>

    <app-incident-review-modal
      [incident]="selectedIncident()"
      (closed)="selectedIncident.set(null)" />
  `,
  styles: [`
    .welcome-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .welcome-row h1 {
      margin: 0;
      color: var(--m3-ink);
      font-size: clamp(24px, 2.1vw, 28px);
      font-weight: 400;
      letter-spacing: -0.35px;
      line-height: 1.3;
    }
    .welcome-row p {
      margin: 5px 0 0;
      color: var(--m3-muted);
      font-size: 14px;
      letter-spacing: 0.15px;
    }
    .welcome-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .zone-filter-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .zone-chip {
      min-height: 32px;
      padding: 0 12px;
      border: 1px solid var(--m3-outline);
      border-radius: 100px;
      background: var(--m3-card);
      color: var(--m3-muted);
      font-size: 12px;
      font-weight: 500;
      transition: all 0.15s;
    }
    .zone-chip.active {
      background: var(--m3-blue-container);
      border-color: var(--m3-primary);
      color: var(--m3-brand-deep);
      font-weight: 600;
    }
    .date-chip {
      display: inline-flex;
      min-height: 34px;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      border: 1px solid var(--m3-outline);
      border-radius: 8px;
      color: var(--m3-ink);
      font-size: 12px;
      white-space: nowrap;
    }
    .date-chip .material-icons-outlined {
      color: var(--m3-primary);
      font-size: 18px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }
    .metric-card {
      position: relative;
      display: flex;
      min-height: 120px;
      flex-direction: column;
      padding: 16px 20px 14px;
      border-radius: 16px;
      background: var(--m3-card);
    }
    .metric-card.metric-primary {
      background: var(--m3-blue-container);
    }
    .metric-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      color: var(--m3-muted);
      font-size: 13px;
      font-weight: 500;
    }
    .metric-top .material-icons-outlined {
      color: var(--m3-primary);
      font-size: 22px;
    }
    .metric-value {
      margin-top: 5px;
      color: var(--m3-ink);
      font-size: 27px;
      font-weight: 500;
      line-height: 1.25;
    }
    .metric-primary .metric-value {
      color: var(--m3-primary);
    }
    .metric-card small {
      margin-top: auto;
      color: var(--m3-muted);
      font-size: 11px;
      line-height: 1.3;
    }
    .siren-active-text {
      color: var(--m3-error);
    }
    .priority-alert {
      display: flex;
      min-height: 76px;
      align-items: center;
      gap: 14px;
      margin-top: 20px;
      padding: 12px 16px 12px 20px;
      border-radius: 16px;
      background: var(--m3-error-container);
      flex-wrap: wrap;
    }
    .priority-icon {
      color: var(--m3-error-ink);
      font-size: 26px;
    }
    .priority-copy {
      display: flex;
      min-width: 220px;
      flex: 1;
      flex-direction: column;
      gap: 3px;
      color: var(--m3-error-ink);
    }
    .priority-copy strong {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
    }
    .priority-copy span {
      font-size: 11.5px;
      line-height: 1.4;
    }
    .priority-btns {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .monitoring-grid {
      display: grid;
      grid-template-columns: minmax(0, 2.2fr) minmax(290px, 1fr);
      gap: 24px;
      margin-top: 28px;
    }
    .section-heading {
      display: flex;
      min-height: 56px;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
    }
    .section-heading h2, .activity-card h2 {
      margin: 0;
      font-size: 21px;
      font-weight: 400;
      line-height: 1.35;
    }
    .section-heading p {
      margin: 3px 0 0;
      color: var(--m3-muted);
      font-size: 11px;
    }
    .history-note {
      margin: 0 0 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--m3-blue-soft);
      color: var(--m3-blue-ink);
      font-size: 12px;
    }
    .camera-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .camera-card {
      overflow: hidden;
      min-width: 0;
      border-radius: 16px;
      background: var(--m3-card);
    }
    .camera-feed {
      position: relative;
      display: flex;
      min-height: 202px;
      align-items: flex-start;
      justify-content: space-between;
      padding: 12px;
      overflow: hidden;
      border-radius: 16px 16px 0 0;
      background-color: #2c2e38;
      background-position: center;
      background-size: cover;
      cursor: pointer;
    }
    .camera-status, .camera-live {
      display: inline-flex;
      min-height: 27px;
      align-items: center;
      gap: 6px;
      padding: 0 9px;
      border-radius: 7px;
      background: var(--m3-success);
      color: white;
      font-size: 10px;
      font-weight: 600;
    }
    .camera-status i.dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }
    .camera-status-alert {
      background: var(--m3-error);
    }
    .camera-status-warn {
      background: var(--m3-warning);
    }
    .camera-live {
      background: #322f35;
      color: #f5eff7;
      font-size: 9px;
      letter-spacing: 0.45px;
    }
    .camera-timestamp {
      position: absolute;
      bottom: 11px;
      left: 12px;
      color: #fff;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.3px;
      text-shadow: 0 1px 3px #000;
    }
    .detection-box {
      position: absolute;
      border: 2px solid var(--m3-error);
      border-radius: 6px;
    }
    .detection-box b {
      position: absolute;
      top: -22px;
      left: -2px;
      padding: 3px 5px;
      border-radius: 5px;
      background: var(--m3-error);
      color: #fff;
      font-size: 9px;
      font-weight: 500;
      white-space: nowrap;
    }
    .camera-info {
      display: flex;
      min-height: 64px;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 12px 9px 16px;
    }
    .camera-info > div {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 3px;
    }
    .camera-info strong {
      overflow: hidden;
      color: var(--m3-ink);
      font-size: 13px;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .camera-info span {
      overflow: hidden;
      color: var(--m3-muted);
      font-size: 10.5px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .camera-open {
      display: grid;
      width: 38px;
      height: 38px;
      flex: 0 0 auto;
      place-items: center;
      border: 0;
      border-radius: 11px;
      background: var(--m3-primary);
      color: white;
    }
    .camera-open:hover {
      background: var(--m3-primary-hover);
    }
    .side-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .activity-card {
      min-width: 0;
      padding: 20px;
      border-radius: 16px;
      background: var(--m3-low);
    }
    .activity-card h2 {
      margin-bottom: 16px;
    }
    .activity-list {
      display: grid;
      gap: 14px;
    }
    .activity-item {
      display: flex;
      min-width: 0;
      align-items: flex-start;
      gap: 10px;
      padding: 6px;
      margin: -6px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .activity-item:hover {
      background: rgba(24, 84, 202, 0.06);
    }
    .activity-icon {
      display: grid;
      width: 26px;
      height: 26px;
      flex: 0 0 26px;
      place-items: center;
    }
    .activity-alert {
      color: var(--m3-error);
    }
    .activity-confirmed {
      color: var(--m3-primary);
    }
    .activity-dismissed {
      color: var(--m3-muted);
    }
    .activity-copy {
      display: flex;
      min-width: 0;
      flex: 1;
      flex-direction: column;
      gap: 2px;
    }
    .activity-copy strong {
      overflow: hidden;
      color: var(--m3-ink);
      font-size: 12.5px;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .activity-copy span {
      overflow: hidden;
      color: var(--m3-muted);
      font-size: 10.5px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .activity-item time {
      padding-top: 2px;
      color: var(--m3-muted);
      font-size: 10.5px;
    }
    .history-button {
      margin-top: 18px;
      width: 100%;
    }
    .siren-quick-card {
      padding: 16px 18px;
      border-radius: 16px;
      background: var(--m3-card);
    }
    .siren-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .link-btn {
      border: 0;
      background: transparent;
      color: var(--m3-primary);
      font-size: 12px;
      font-weight: 600;
    }
    .siren-mini-list {
      display: grid;
      gap: 8px;
    }
    .siren-mini-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 10px;
      background: var(--m3-low);
    }
    .siren-mini-row.sounding {
      background: var(--m3-error-container);
      color: var(--m3-error-ink);
    }
    .siren-mini-row strong {
      display: block;
      font-size: 11.5px;
    }
    .siren-mini-row small {
      font-size: 10px;
      color: var(--m3-muted);
    }
    .siren-toggle-pill {
      padding: 4px 10px;
      border-radius: 100px;
      border: 1px solid var(--m3-outline);
      background: var(--m3-card);
      font-size: 11px;
      font-weight: 600;
    }
    .siren-toggle-pill.active {
      background: var(--m3-error);
      border-color: var(--m3-error);
      color: #fff;
    }
    .bottom-grid {
      display: grid;
      grid-template-columns: minmax(0, 2.2fr) minmax(290px, 1fr);
      gap: 24px;
      margin-top: 22px;
    }
    .chart-card {
      min-width: 0;
      min-height: 190px;
      padding: 16px 20px 12px;
      border-radius: 16px;
      background: var(--m3-card);
    }
    .chart-heading {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .chart-heading strong {
      font-size: 14px;
      font-weight: 500;
    }
    .chart-heading span {
      color: var(--m3-muted);
      font-size: 10.5px;
    }
    .bar-chart {
      display: flex;
      height: 92px;
      align-items: flex-end;
      justify-content: space-between;
      gap: 7px;
      padding: 0 4px;
      margin-top: 12px;
    }
    .bar-chart span {
      width: 14px;
      max-width: 3.2%;
      min-width: 5px;
      border-radius: 8px;
      background: var(--m3-blue-container);
    }
    .bar-chart span.peak {
      background: var(--m3-primary);
    }
    .chart-labels {
      display: flex;
      justify-content: space-between;
      margin: 6px -3px 0;
      color: var(--m3-muted);
      font-size: 9.5px;
    }
    .human-control-card {
      display: flex;
      min-height: 190px;
      flex-direction: column;
      align-items: flex-start;
      padding: 18px 20px;
      border-radius: 16px;
      background: var(--m3-blue-container);
      color: var(--m3-brand-deep);
    }
    .human-check {
      margin-bottom: 8px;
      color: var(--m3-primary);
      font-size: 26px;
    }
    .human-control-card > strong {
      font-size: 14px;
      font-weight: 600;
    }
    .human-control-card p {
      max-width: 320px;
      margin: 6px 0 14px;
      font-size: 12px;
      line-height: 1.45;
    }
    @media (max-width: 1024px) {
      .metrics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .monitoring-grid, .bottom-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 640px) {
      .camera-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MonitoringDashboardComponent {
  readonly data = inject(CentinelaDataService);
  readonly router = inject(Router);

  readonly cameraMode = signal<'live' | 'history'>('live');
  readonly selectedZoneId = signal<number | null>(null);
  readonly selectedIncident = signal<Incident | null>(null);

  readonly filteredCameras = computed(() => {
    const zId = this.selectedZoneId();
    const all = this.data.cameras();
    return zId === null ? all : all.filter((c) => c.zone_id === zId);
  });

  readonly onlineCamerasCount = computed(
    () => this.data.cameras().filter((c) => c.status === 'ONLINE' && c.is_active).length
  );

  readonly activeZonesCount = computed(
    () => this.data.zones().filter((z) => z.is_active).length
  );

  readonly confirmedCount = computed(
    () => this.data.incidents().filter((i) => i.review_status === 'CONFIRMED').length
  );

  readonly dismissedCount = computed(
    () => this.data.incidents().filter((i) => i.review_status === 'DISMISSED').length
  );

  readonly soundingSirensCount = computed(
    () => this.data.sirens().filter((s) => s.is_sounding).length
  );

  readonly onlineSirensCount = computed(
    () => this.data.sirens().filter((s) => s.status === 'ONLINE' && s.is_active).length
  );

  getPendingIncidentForCamera(cameraId: number): Incident | undefined {
    return this.data
      .incidents()
      .find((i) => i.camera_id === cameraId && i.review_status === 'PENDING');
  }

  openLiveCamera(cam: Camera): void {
    this.router.navigate(['/camara-en-vivo'], { queryParams: { cameraId: cam.id } });
  }

  openCameraOrIncident(cam: Camera, alert?: Incident): void {
    if (alert) {
      this.selectedIncident.set(alert);
      return;
    }
    const anyForCam = this.data.incidents().find((i) => i.camera_id === cam.id);
    if (anyForCam) {
      this.selectedIncident.set(anyForCam);
    } else {
      this.data.showNotice(
        `${cam.code} (${cam.name}) transmitiendo a ${cam.fps} FPS (${cam.source_type}) sin incidentes pendientes.`
      );
    }
  }
}
