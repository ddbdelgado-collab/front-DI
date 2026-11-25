import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentinelaDataService } from '../../core/services/centinela-data.service';
import { Incident, ReviewStatus } from '../../core/models/database.models';
import { IncidentReviewModalComponent } from '../../shared/components/incident-review-modal/incident-review-modal.component';

@Component({
  selector: 'app-incidents-history',
  standalone: true,
  imports: [CommonModule, FormsModule, IncidentReviewModalComponent],
  template: `
    <main class="m3-page">
      <header class="m3-page-header">
        <div>
          <h1>Historial y revisión de incidentes</h1>
          <p>
            Registro consolidado de detecciones IA (<code>incidents</code>), archivos multimedia (<code>evidence</code>) y auditoría de revisión humana.
          </p>
        </div>

        <div class="m3-segmented">
          <button type="button" [class.active]="statusFilter() === 'ALL'" (click)="statusFilter.set('ALL')">
            Todos ({{ data.incidents().length }})
          </button>
          <button type="button" [class.active]="statusFilter() === 'PENDING'" (click)="statusFilter.set('PENDING')">
            Pendientes ({{ data.pendingIncidents().length }})
          </button>
          <button type="button" [class.active]="statusFilter() === 'CONFIRMED'" (click)="statusFilter.set('CONFIRMED')">
            Confirmados
          </button>
          <button type="button" [class.active]="statusFilter() === 'DISMISSED'" (click)="statusFilter.set('DISMISSED')">
            Descartados
          </button>
        </div>
      </header>

      <!-- Filters bar -->
      <section class="filters-bar m3-card">
        <div class="m3-field">
          <label for="searchInc">Buscar por ID, cámara o notas</label>
          <input
            id="searchInc"
            type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Ej. #1042, CAM-01, repartidores..." />
        </div>

        <div class="m3-field">
          <label for="catFilter">Categoría (<code>incident_categories</code>)</label>
          <select id="catFilter" [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set(+$event)">
            <option [value]="0">Todas las categorías</option>
            @for (cat of data.categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }} ({{ cat.severity_level }})</option>
            }
          </select>
        </div>

        <div class="m3-field">
          <label for="camFilter">Cámara (<code>cameras</code>)</label>
          <select id="camFilter" [ngModel]="cameraFilter()" (ngModelChange)="cameraFilter.set(+$event)">
            <option [value]="0">Todas las cámaras</option>
            @for (cam of data.cameras(); track cam.id) {
              <option [value]="cam.id">{{ cam.code }} · {{ cam.name }}</option>
            }
          </select>
        </div>
      </section>

      <!-- Incidents Table -->
      <section class="m3-table-wrapper">
        <table class="m3-table">
          <thead>
            <tr>
              <th>ID / Fecha</th>
              <th>Cámara y Zona</th>
              <th>Categoría y Severidad</th>
              <th>Confianza IA</th>
              <th>Evidencia y Correo</th>
              <th>Alarma / Silenciada por</th>
              <th>Estado Revisión</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (inc of filteredIncidents(); track inc.id) {
              @let cam = data.getCameraById(inc.camera_id);
              @let cat = data.getCategoryById(inc.category_id);
              @let evs = data.getEvidenceByIncidentId(inc.id);
              @let notifs = data.getNotificationsByIncidentId(inc.id);
              <tr>
                <td>
                  <strong>#{{ inc.id }}</strong>
                  <div class="cell-sub">{{ inc.occurred_at | date:'dd/MM/yyyy HH:mm:ss' }}</div>
                </td>
                <td>
                  <strong>{{ cam?.code }} · {{ cam?.name }}</strong>
                  <div class="cell-sub">{{ data.getZoneById(cam?.zone_id ?? null)?.name }}</div>
                </td>
                <td>
                  <strong>{{ cat?.name }}</strong>
                  <div class="cell-sub">
                    <span class="m3-badge"
                      [class.badge-error]="cat?.severity_level === 'CRITICAL'"
                      [class.badge-warning]="cat?.severity_level === 'HIGH'"
                      [class.badge-info]="cat?.severity_level === 'MEDIUM' || cat?.severity_level === 'LOW'">
                      {{ cat?.severity_level }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="confidence-pill">
                    <strong>{{ (inc.confidence * 100).toFixed(1) }} %</strong>
                    <div class="conf-bar">
                      <span [style.width.%]="inc.confidence * 100"></span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="chips-stack">
                    <span class="m3-badge badge-info" title="Archivos en tabla evidence">
                      <span class="material-icons-outlined" style="font-size:14px">perm_media</span>
                      {{ evs.length }} archivo(s)
                    </span>
                    <span class="m3-badge badge-neutral" title="Registros en tabla notifications">
                      <span class="material-icons-outlined" style="font-size:14px">mail_outline</span>
                      {{ notifs.length }} alerta(s)
                    </span>
                  </div>
                </td>
                <td>
                  @if (inc.alarm_active) {
                    <span class="m3-badge badge-error">
                      <i class="dot"></i> SONANDO AHORA
                    </span>
                  } @else if (inc.silenced_by) {
                    <div class="cell-sub">
                      Silenciada por <strong>{{ data.getUserById(inc.silenced_by)?.name }}</strong>
                      <br />{{ inc.silenced_at | date:'HH:mm:ss' }}
                    </div>
                  } @else {
                    <span class="cell-sub">En reposo</span>
                  }
                </td>
                <td>
                  <span class="m3-badge"
                    [class.badge-warning]="inc.review_status === 'PENDING'"
                    [class.badge-success]="inc.review_status === 'CONFIRMED'"
                    [class.badge-neutral]="inc.review_status === 'DISMISSED'">
                    <i class="dot"></i>
                    {{ inc.review_status === 'PENDING' ? 'PENDIENTE' : inc.review_status === 'CONFIRMED' ? 'CONFIRMADO' : 'DESCARTADO' }}
                  </span>
                  @if (inc.reviewed_by) {
                    <div class="cell-sub">por {{ data.getUserById(inc.reviewed_by)?.name }}</div>
                  }
                </td>
                <td>
                  <div class="row-actions">
                    <button class="m3-tonal-btn" type="button" (click)="selectedIncident.set(inc)">
                      <span class="material-icons-outlined" style="font-size:17px">visibility</span>
                      Revisar
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-cell">
                  No se encontraron incidentes con los filtros seleccionados.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </main>

    <app-incident-review-modal
      [incident]="selectedIncident()"
      (closed)="selectedIncident.set(null)" />
  `,
  styles: [`
    .filters-bar {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .cell-sub {
      margin-top: 3px;
      color: var(--m3-muted);
      font-size: 11.5px;
    }
    .confidence-pill {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 85px;
    }
    .conf-bar {
      height: 6px;
      border-radius: 100px;
      background: var(--m3-blue-container);
      overflow: hidden;
    }
    .conf-bar span {
      display: block;
      height: 100%;
      border-radius: 100px;
      background: var(--m3-primary);
    }
    .chips-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .row-actions {
      display: flex;
      gap: 8px;
    }
    .empty-cell {
      padding: 36px !important;
      text-align: center;
      color: var(--m3-muted);
    }
    @media (max-width: 860px) {
      .filters-bar {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class IncidentsHistoryComponent {
  readonly data = inject(CentinelaDataService);

  readonly statusFilter = signal<'ALL' | ReviewStatus>('ALL');
  readonly categoryFilter = signal<number>(0);
  readonly cameraFilter = signal<number>(0);
  readonly searchTerm = signal<string>('');
  readonly selectedIncident = signal<Incident | null>(null);

  readonly filteredIncidents = computed(() => {
    const status = this.statusFilter();
    const catId = this.categoryFilter();
    const camId = this.cameraFilter();
    const term = this.searchTerm().trim().toLowerCase();

    return this.data.incidents().filter((inc) => {
      if (status !== 'ALL' && inc.review_status !== status) return false;
      if (catId !== 0 && inc.category_id !== catId) return false;
      if (camId !== 0 && inc.camera_id !== camId) return false;
      if (term) {
        const cam = this.data.getCameraById(inc.camera_id);
        const cat = this.data.getCategoryById(inc.category_id);
        const haystack = `#${inc.id} ${cam?.code} ${cam?.name} ${cat?.name} ${inc.operator_notes || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  });
}
