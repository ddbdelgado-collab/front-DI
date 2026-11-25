import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentinelaDataService } from '../../../core/services/centinela-data.service';
import { Incident, ReviewStatus } from '../../../core/models/database.models';

@Component({
  selector: 'app-incident-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (incident) {
      <div class="m3-dialog-backdrop" (mousedown)="onBackdropClick($event)">
        <section class="m3-dialog dialog-lg review-modal" role="dialog" aria-modal="true">
          <button class="dialog-close" aria-label="Cerrar" (click)="closed.emit()">
            <span class="material-icons-outlined">close</span>
          </button>

          <div class="dialog-header-row">
            <span class="dialog-alert-icon" [class.confirmed]="incident.review_status === 'CONFIRMED'" [class.dismissed]="incident.review_status === 'DISMISSED'">
              <span class="material-icons-outlined">
                {{ incident.review_status === 'CONFIRMED' ? 'verified' : incident.review_status === 'DISMISSED' ? 'block' : 'error_outline' }}
              </span>
            </span>
            <div class="dialog-title-block">
              <p class="dialog-eyebrow">
                INCIDENTE #{{ incident.id }} · {{ camera()?.code || 'CAM' }} · {{ zone()?.name || 'Campus Central' }}
              </p>
              <h2>{{ category()?.name || 'Posible incidente detectado' }}</h2>
            </div>
            <span class="m3-badge"
              [class.badge-error]="incident.review_status === 'PENDING'"
              [class.badge-success]="incident.review_status === 'CONFIRMED'"
              [class.badge-neutral]="incident.review_status === 'DISMISSED'">
              <i class="dot"></i>
              {{ incident.review_status === 'PENDING' ? 'PENDIENTE DE REVISIÓN' : incident.review_status === 'CONFIRMED' ? 'CONFIRMADO' : 'DESCARTADO' }}
            </span>
          </div>

          <p class="dialog-description">
            La IA detectó actividad compatible con <strong>{{ category()?.name }}</strong> con una confianza del
            <strong>{{ (incident.confidence * 100).toFixed(1) }} %</strong> (umbral configurado:
            {{ ((category()?.confidence_threshold || 0.85) * 100).toFixed(0) }} % · persistencia
            {{ category()?.persistence_ms || 1200 }} ms). La confirmación final requiere revisión humana.
          </p>

          <div class="review-columns">
            <!-- Left column: Evidence player & metadata -->
            <div class="evidence-column">
              <div class="evidence-preview" [style.backgroundImage]="'linear-gradient(180deg, rgba(18,20,28,0.18), rgba(18,20,28,0.58)), url(' + (camera()?.preview_image || '') + ')'">
                <div class="preview-top">
                  <span class="preview-pill">{{ camera()?.code }} · {{ camera()?.source_type }} ({{ camera()?.fps }} FPS)</span>
                  @if (incident.alarm_active) {
                    <span class="alarm-sounding-pill">
                      <span class="material-icons-outlined">campaign</span> SIRENA ACTIVA
                    </span>
                  }
                </div>

                @if (incident.bounding_box) {
                  <div class="detection-box"
                    [style.top.%]="incident.bounding_box.top"
                    [style.left.%]="incident.bounding_box.left"
                    [style.width.%]="incident.bounding_box.width"
                    [style.height.%]="incident.bounding_box.height">
                    <b>{{ category()?.code }} · {{ (incident.confidence * 100).toFixed(1) }} %</b>
                  </div>
                }

                <div class="preview-bottom">
                  <span>{{ incident.occurred_at | date:'dd MMM yyyy · HH:mm:ss' }}</span>
                  <span>{{ camera()?.captures_audio ? 'Audio capturado' : 'Sin audio' }}</span>
                </div>
              </div>

              <div class="sub-block">
                <h4>Evidencia vinculada (Tabla <code>evidence</code>)</h4>
                <div class="evidence-list">
                  @for (ev of evidenceItems(); track ev.id) {
                    <div class="evidence-chip">
                      <span class="material-icons-outlined">
                        {{ ev.type === 'VIDEO_CLIP' ? 'videocam' : ev.type === 'AUDIO_CLIP' ? 'graphic_eq' : 'photo_camera' }}
                      </span>
                      <div class="ev-meta">
                        <strong>{{ ev.type }}</strong>
                        <small>{{ ev.file_path }}</small>
                      </div>
                      @if (ev.duration_seconds) {
                        <span class="ev-tag">{{ ev.duration_seconds }}s</span>
                      }
                    </div>
                  } @empty {
                    <p class="muted-small">No hay archivos adjuntos adicionales.</p>
                  }
                </div>
              </div>

              <div class="sub-block">
                <h4>Notificaciones disparadas (Tabla <code>notifications</code>)</h4>
                <div class="notif-list">
                  @for (n of notificationItems(); track n.id) {
                    <div class="notif-row">
                      <span class="m3-badge" [class.badge-success]="n.status === 'SENT'" [class.badge-error]="n.status === 'FAILED'">
                        {{ n.status }}
                      </span>
                      <span class="notif-email">{{ n.recipient_email }}</span>
                      <small>{{ n.sent_at | date:'HH:mm:ss' }}</small>
                    </div>
                  } @empty {
                    <p class="muted-small">Sin notificaciones externas registradas para este evento.</p>
                  }
                </div>
              </div>
            </div>

            <!-- Right column: Protocol steps, Alarm control & Operator decision -->
            <div class="protocol-column">
              @if (protocol(); as proto) {
                <div class="protocol-box">
                  <div class="proto-header">
                    <span class="material-icons-outlined">policy</span>
                    <div>
                      <strong>{{ proto.title }}</strong>
                      <small>Protocolo activo para {{ category()?.name }}</small>
                    </div>
                  </div>
                  <ul class="protocol-steps">
                    @for (step of protocolSteps(); track $index) {
                      <li>
                        <label>
                          <input type="checkbox" [checked]="checkedSteps().includes($index)" (change)="toggleStep($index)" />
                          <span>{{ step }}</span>
                        </label>
                      </li>
                    }
                  </ul>
                </div>
              }

              <div class="alarm-control-box" [class.is-active]="incident.alarm_active">
                <div>
                  <strong>Estado de Sirena Disuasoria</strong>
                  <small>
                    @if (incident.alarm_active) {
                      Alarma sonora activa en {{ zone()?.name }}.
                    } @else if (incident.silenced_by) {
                      Silenciada por {{ silencedByUser()?.name || ('Usuario #' + incident.silenced_by) }} ({{ incident.silenced_at | date:'HH:mm:ss' }})
                    } @else {
                      Alarma en reposo.
                    }
                  </small>
                </div>
                @if (incident.alarm_active) {
                  <button class="m3-danger-btn" type="button" (click)="silenceAlarm()">
                    <span class="material-icons-outlined">volume_off</span>
                    Silenciar alarma
                  </button>
                }
              </div>

              <div class="m3-field">
                <label for="opNotes">Dictamen y notas del operador (<code>reviewed_by</code>: {{ data.currentUser().name }})</label>
                <textarea
                  id="opNotes"
                  [(ngModel)]="notesText"
                  placeholder="Describe el contexto verificado en cámara o el motivo de descarte..."></textarea>
              </div>
            </div>
          </div>

          <div class="dialog-meta">
            <span>Severidad: <strong>{{ category()?.severity_level }}</strong></span>
            @if (incident.reviewed_by) {
              <span>Revisado por: <strong>{{ reviewedByUser()?.name }}</strong></span>
            } @else {
              <span>Requiere validación humana antes de cerrar</span>
            }
          </div>

          <div class="dialog-actions">
            <button class="m3-outlined-btn" type="button" (click)="closed.emit()">Cerrar</button>
            <button class="m3-outlined-btn dismiss-btn" type="button" (click)="submitReview('DISMISSED')">
              <span class="material-icons-outlined">close</span>
              Descartar falso positivo
            </button>
            <button class="m3-primary-btn" type="button" (click)="submitReview('CONFIRMED')">
              <span class="material-icons-outlined">check_circle</span>
              Confirmar incidente
            </button>
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    .review-modal {
      max-width: 880px;
    }
    .dialog-close {
      position: absolute;
      top: 18px;
      right: 18px;
      display: grid;
      width: 36px;
      height: 36px;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--m3-muted);
    }
    .dialog-close:hover {
      background: var(--m3-low);
    }
    .dialog-header-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-right: 36px;
      flex-wrap: wrap;
    }
    .dialog-alert-icon {
      display: grid;
      width: 48px;
      height: 48px;
      flex: 0 0 48px;
      place-items: center;
      border-radius: 15px;
      background: var(--m3-error-container);
      color: var(--m3-error-ink);
    }
    .dialog-alert-icon.confirmed {
      background: var(--m3-blue-container);
      color: var(--m3-brand-deep);
    }
    .dialog-alert-icon.dismissed {
      background: var(--m3-low);
      color: var(--m3-muted);
    }
    .dialog-title-block {
      flex: 1;
      min-width: 200px;
    }
    .dialog-eyebrow {
      margin: 0 0 4px;
      color: var(--m3-muted);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .review-modal h2 {
      margin: 0;
      color: var(--m3-ink);
      font-size: 21px;
      font-weight: 500;
      line-height: 1.3;
    }
    .dialog-description {
      margin: 14px 0 18px;
      color: var(--m3-muted);
      font-size: 13px;
      line-height: 1.5;
    }
    .review-columns {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 20px;
    }
    .evidence-preview {
      position: relative;
      height: 220px;
      border-radius: 16px;
      background-size: cover;
      background-position: center;
      padding: 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .preview-top, .preview-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .preview-pill {
      padding: 4px 9px;
      border-radius: 7px;
      background: rgba(25, 24, 32, 0.78);
      color: #fff;
      font-size: 10px;
      font-weight: 600;
    }
    .alarm-sounding-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 7px;
      background: var(--m3-error);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
    }
    .alarm-sounding-pill .material-icons-outlined {
      font-size: 14px;
    }
    .preview-bottom span {
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      text-shadow: 0 1px 3px #000;
    }
    .detection-box {
      position: absolute;
      border: 2px solid var(--m3-error);
      border-radius: 6px;
      pointer-events: none;
    }
    .detection-box b {
      position: absolute;
      top: -22px;
      left: -2px;
      padding: 3px 6px;
      border-radius: 5px;
      background: var(--m3-error);
      color: #fff;
      font-size: 9px;
      font-weight: 600;
      white-space: nowrap;
    }
    .sub-block {
      margin-top: 14px;
    }
    .sub-block h4 {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--m3-muted);
    }
    .evidence-list {
      display: grid;
      gap: 8px;
    }
    .evidence-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 10px;
      background: var(--m3-low);
      font-size: 12px;
    }
    .evidence-chip .material-icons-outlined {
      color: var(--m3-primary);
      font-size: 20px;
    }
    .ev-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }
    .ev-meta strong {
      font-size: 11px;
    }
    .ev-meta small {
      color: var(--m3-muted);
      font-size: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ev-tag {
      padding: 2px 7px;
      border-radius: 6px;
      background: var(--m3-blue-container);
      color: var(--m3-brand-deep);
      font-size: 10px;
      font-weight: 600;
    }
    .notif-list {
      display: grid;
      gap: 6px;
    }
    .notif-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 8px;
      background: var(--m3-low);
      font-size: 11px;
    }
    .notif-email {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .protocol-column {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .protocol-box {
      padding: 14px 16px;
      border-radius: 14px;
      background: var(--m3-blue-soft);
      color: var(--m3-blue-ink);
    }
    .proto-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 10px;
    }
    .proto-header strong {
      display: block;
      font-size: 13px;
    }
    .proto-header small {
      font-size: 11px;
      opacity: 0.85;
    }
    .protocol-steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .protocol-steps label {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      line-height: 1.4;
      cursor: pointer;
    }
    .protocol-steps input {
      margin-top: 2px;
      accent-color: var(--m3-primary);
    }
    .alarm-control-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--m3-low);
      border: 1px solid var(--m3-outline-soft);
    }
    .alarm-control-box.is-active {
      background: var(--m3-error-container);
      color: var(--m3-error-ink);
      border-color: transparent;
    }
    .alarm-control-box strong {
      display: block;
      font-size: 12.5px;
    }
    .alarm-control-box small {
      font-size: 11px;
    }
    .dialog-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      margin-top: 16px;
      border-top: 1px solid var(--m3-outline-soft);
      color: var(--m3-muted);
      font-size: 11.5px;
      flex-wrap: wrap;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .dismiss-btn {
      color: var(--m3-error-ink);
      border-color: var(--m3-error);
    }
    .muted-small {
      margin: 0;
      font-size: 11px;
      color: var(--m3-muted);
    }
    @media (max-width: 760px) {
      .review-columns {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class IncidentReviewModalComponent {
  readonly data = inject(CentinelaDataService);

  private _incident = signal<Incident | null>(null);
  @Input() set incident(value: Incident | null) {
    this._incident.set(value);
    this.notesText = value?.operator_notes || '';
    this.checkedSteps.set([]);
  }
  get incident(): Incident | null {
    return this._incident();
  }

  @Output() closed = new EventEmitter<void>();

  notesText = '';
  readonly checkedSteps = signal<number[]>([]);

  readonly camera = computed(() => {
    const inc = this._incident();
    return inc ? this.data.getCameraById(inc.camera_id) : undefined;
  });

  readonly zone = computed(() => {
    const cam = this.camera();
    return cam ? this.data.getZoneById(cam.zone_id) : undefined;
  });

  readonly category = computed(() => {
    const inc = this._incident();
    return inc ? this.data.getCategoryById(inc.category_id) : undefined;
  });

  readonly protocol = computed(() => {
    const inc = this._incident();
    return inc ? this.data.getProtocolByCategoryId(inc.category_id) : undefined;
  });

  readonly protocolSteps = computed(() => {
    const proto = this.protocol();
    if (!proto) return [];
    return proto.steps.split('\n').filter((s) => s.trim().length > 0);
  });

  readonly evidenceItems = computed(() => {
    const inc = this._incident();
    return inc ? this.data.getEvidenceByIncidentId(inc.id) : [];
  });

  readonly notificationItems = computed(() => {
    const inc = this._incident();
    return inc ? this.data.getNotificationsByIncidentId(inc.id) : [];
  });

  readonly silencedByUser = computed(() => {
    const inc = this._incident();
    return inc ? this.data.getUserById(inc.silenced_by) : undefined;
  });

  readonly reviewedByUser = computed(() => {
    const inc = this._incident();
    return inc ? this.data.getUserById(inc.reviewed_by) : undefined;
  });

  toggleStep(idx: number): void {
    this.checkedSteps.update((arr) =>
      arr.includes(idx) ? arr.filter((i) => i !== idx) : [...arr, idx]
    );
  }

  silenceAlarm(): void {
    const inc = this._incident();
    if (!inc) return;
    this.data.silenceIncidentAlarm(inc.id);
    const updated = this.data.incidents().find((i) => i.id === inc.id) || null;
    this._incident.set(updated);
  }

  submitReview(status: ReviewStatus): void {
    const inc = this._incident();
    if (!inc) return;
    this.data.reviewIncident(inc.id, status, this.notesText);
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
