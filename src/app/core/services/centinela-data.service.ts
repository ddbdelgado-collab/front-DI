import { Injectable, computed, signal } from '@angular/core';
import {
  Camera,
  EmergencyContact,
  Evidence,
  Incident,
  IncidentCategory,
  NotificationLog,
  Protocol,
  ReviewStatus,
  Siren,
  TermsAcceptance,
  TermsAndConditions,
  User,
  Zone
} from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class CentinelaDataService {
  // UI Theme & Banner Notice State
  readonly darkMode = signal<boolean>(false);
  readonly noticeMessage = signal<string>('');

  // --- 4. USERS & TERMS ---
  readonly users = signal<User[]>([
    {
      id: 1,
      name: 'Carlos Mendoza',
      email: 'cmendoza@centinela.edu.pe',
      password_hash: '$2b$12$9vK...a8F',
      role: 'SUPERVISOR',
      is_active: true,
      created_at: '2026-08-10T09:00:00-05:00'
    },
    {
      id: 2,
      name: 'Valeria Salazar',
      email: 'vsalazar@centinela.edu.pe',
      password_hash: '$2b$12$7xM...e1P',
      role: 'OPERATOR',
      is_active: true,
      created_at: '2026-09-01T14:20:00-05:00'
    },
    {
      id: 3,
      name: 'Ing. Roberto Quispe',
      email: 'rquispe@centinela.edu.pe',
      password_hash: '$2b$12$3pL...q9Z',
      role: 'ADMIN',
      is_active: true,
      created_at: '2026-07-15T08:00:00-05:00'
    },
    {
      id: 4,
      name: 'Luis Paredes',
      email: 'lparedes@centinela.edu.pe',
      password_hash: '$2b$12$5tR...w4K',
      role: 'OPERATOR',
      is_active: false,
      created_at: '2026-09-12T10:15:00-05:00'
    }
  ]);

  readonly currentUser = signal<User>({
    id: 1,
    name: 'Carlos Mendoza',
    email: 'cmendoza@centinela.edu.pe',
    password_hash: '$2b$12$9vK...a8F',
    role: 'SUPERVISOR',
    is_active: true,
    created_at: '2026-08-10T09:00:00-05:00'
  });

  readonly termsList = signal<TermsAndConditions[]>([
    {
      id: 1,
      version: 'v1.0',
      title: 'Política inicial de monitoreo y privacidad de video',
      content: '1. Todo operador debe resguardar la confidencialidad de las transmisiones.\n2. Queda prohibida la grabación con dispositivos externos.\n3. Las alertas generadas por IA son preliminares.',
      is_current: false,
      published_at: '2026-07-01T08:00:00-05:00',
      created_at: '2026-06-28T16:00:00-05:00'
    },
    {
      id: 2,
      version: 'v2.1',
      title: 'Protocolo Ético de Videovigilancia con IA y Protección de Datos Personales',
      content:
        '1. PRINCIPIO DE SUPERVISIÓN HUMANA ("La IA alerta, tú decides"): Ninguna detección automática del modelo de visión artificial constituye confirmación de falta o delito sin verificación visual de un operador autorizado.\n' +
        '2. CADENA DE CUSTODIA DE EVIDENCIA: Los clips de video e imágenes almacenados en la tabla evidence están protegidos y su acceso queda registrado por usuario y marca de tiempo.\n' +
        '3. USO DE SIRENAS DISUASORIAS: La activación o silenciamiento de alarmas sonoras debe justificarse en la revisión del incidente.\n' +
        '4. PRIVACIDAD Y CONFIDENCIALIDAD: Está estrictamente prohibido difundir capturas de cámaras fuera de los canales establecidos en los protocolos de emergencia.',
      is_current: true,
      published_at: '2026-11-01T09:00:00-05:00',
      created_at: '2026-10-29T11:30:00-05:00'
    }
  ]);

  readonly termsAcceptances = signal<TermsAcceptance[]>([
    {
      id: 1,
      user_id: 1,
      terms_id: 2,
      accepted: true,
      accepted_at: '2026-11-02T08:15:22-05:00'
    },
    {
      id: 2,
      user_id: 3,
      terms_id: 2,
      accepted: true,
      accepted_at: '2026-11-01T09:30:00-05:00'
    }
  ]);

  // --- 1. INFRASTRUCTURE ---
  readonly zones = signal<Zone[]>([
    { id: 1, name: 'Edificio A · Acceso Principal', description: 'Vestíbulo, torniquetes de ingreso peatonal y recepción central.', is_active: true },
    { id: 2, name: 'Estacionamiento Norte', description: 'Zona vehicular exterior, bahía de buses y rampa norte.', is_active: true },
    { id: 3, name: 'Patio de Carga y Logística', description: 'Área posterior de descarga de proveedores y almacén general.', is_active: true },
    { id: 4, name: 'Pabellón Central y Cafetería', description: 'Pasillos del primer nivel, comedor estudiantil y terraza.', is_active: true }
  ]);

  readonly cameras = signal<Camera[]>([
    {
      id: 1,
      code: 'CAM-01',
      zone_id: 1,
      name: 'Acceso principal',
      source_type: 'RTSP',
      source: 'rtsp://10.20.1.11:554/stream1',
      fps: 30,
      captures_audio: true,
      status: 'ONLINE',
      is_active: true,
      preview_image: 'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 2,
      code: 'CAM-02',
      zone_id: 2,
      name: 'Estacionamiento norte',
      source_type: 'RTSP',
      source: 'rtsp://10.20.2.14:554/stream1',
      fps: 25,
      captures_audio: false,
      status: 'ONLINE',
      is_active: true,
      preview_image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 3,
      code: 'CAM-07',
      zone_id: 3,
      name: 'Patio de carga',
      source_type: 'ONVIF',
      source: 'http://10.20.3.21:8080/onvif/media',
      fps: 30,
      captures_audio: true,
      status: 'ONLINE',
      is_active: true,
      preview_image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 4,
      code: 'CAM-12',
      zone_id: 4,
      name: 'Pasillo Cafetería Central',
      source_type: 'RTSP',
      source: 'rtsp://10.20.4.08:554/stream1',
      fps: 30,
      captures_audio: true,
      status: 'ONLINE',
      is_active: true,
      preview_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 5,
      code: 'CAM-15',
      zone_id: 2,
      name: 'Perímetro Vehicular Este',
      source_type: 'HTTP',
      source: 'http://10.20.2.19:8090/video.mjpg',
      fps: 15,
      captures_audio: false,
      status: 'CONNECTING',
      is_active: true,
      preview_image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 6,
      code: 'CAM-19',
      zone_id: 1,
      name: 'Recepción Torre A',
      source_type: 'USB',
      source: '/dev/video0',
      fps: 30,
      captures_audio: true,
      status: 'ONLINE',
      is_active: true,
      preview_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80'
    }
  ]);

  readonly sirens = signal<Siren[]>([
    {
      id: 1,
      zone_id: 1,
      name: 'Sirena Estroboscópica Acceso A',
      connection_type: 'SERIAL',
      port: 'COM3',
      bluetooth_address: null,
      status: 'ONLINE',
      is_active: true,
      is_sounding: true
    },
    {
      id: 2,
      zone_id: 2,
      name: 'Alarma Exterior Estacionamiento',
      connection_type: 'NETWORK',
      port: '10.20.2.99:4000',
      bluetooth_address: null,
      status: 'ONLINE',
      is_active: true,
      is_sounding: false
    },
    {
      id: 3,
      zone_id: 3,
      name: 'Bocina Disuasoria Patio Carga',
      connection_type: 'BLUETOOTH',
      port: null,
      bluetooth_address: 'A4:C1:38:9F:12:0B',
      status: 'ONLINE',
      is_active: true,
      is_sounding: false
    },
    {
      id: 4,
      zone_id: 4,
      name: 'Módulo Sonoro Pabellón Central',
      connection_type: 'USB',
      port: 'USB-HID-02',
      bluetooth_address: null,
      status: 'OFFLINE',
      is_active: false,
      is_sounding: false
    }
  ]);

  // --- 2. INCIDENTS & EVIDENCE ---
  readonly categories = signal<IncidentCategory[]>([
    {
      id: 1,
      code: 'PHYS_ASSAULT',
      name: 'Agresión física / Pelea',
      severity_level: 'CRITICAL',
      confidence_threshold: 0.85,
      persistence_ms: 1200,
      is_active: true
    },
    {
      id: 2,
      code: 'WEAPON_DETECT',
      name: 'Porte de objeto contundente o arma',
      severity_level: 'CRITICAL',
      confidence_threshold: 0.90,
      persistence_ms: 800,
      is_active: true
    },
    {
      id: 3,
      code: 'CROWD_BRAWL',
      name: 'Altercado grupal / Tumulto violento',
      severity_level: 'HIGH',
      confidence_threshold: 0.80,
      persistence_ms: 2000,
      is_active: true
    },
    {
      id: 4,
      code: 'VANDALISM',
      name: 'Vandalismo o daño a infraestructura',
      severity_level: 'MEDIUM',
      confidence_threshold: 0.78,
      persistence_ms: 2500,
      is_active: true
    }
  ]);

  readonly incidents = signal<Incident[]>([
    {
      id: 1042,
      camera_id: 1,
      category_id: 1,
      confidence: 0.9420,
      occurred_at: '2026-11-18T14:31:42-05:00',
      alarm_active: true,
      silenced_by: null,
      silenced_at: null,
      review_status: 'PENDING',
      reviewed_by: null,
      operator_notes: null,
      bounding_box: { top: 31, left: 42, width: 27, height: 47 }
    },
    {
      id: 1041,
      camera_id: 3,
      category_id: 3,
      confidence: 0.8915,
      occurred_at: '2026-11-18T14:24:10-05:00',
      alarm_active: false,
      silenced_by: 1,
      silenced_at: '2026-11-18T14:24:45-05:00',
      review_status: 'CONFIRMED',
      reviewed_by: 1,
      reviewed_at: '2026-11-18T14:25:12-05:00',
      operator_notes: 'Altercado entre dos repartidores en zona de descarga. Se envió patrulla interna y se separó a los involucrados.',
      bounding_box: { top: 28, left: 35, width: 32, height: 50 }
    },
    {
      id: 1040,
      camera_id: 4,
      category_id: 1,
      confidence: 0.8640,
      occurred_at: '2026-11-18T13:52:19-05:00',
      alarm_active: false,
      silenced_by: null,
      silenced_at: null,
      review_status: 'PENDING',
      reviewed_by: null,
      operator_notes: null,
      bounding_box: { top: 34, left: 48, width: 24, height: 44 }
    },
    {
      id: 1039,
      camera_id: 2,
      category_id: 4,
      confidence: 0.8120,
      occurred_at: '2026-11-18T12:15:04-05:00',
      alarm_active: false,
      silenced_by: 2,
      silenced_at: '2026-11-18T12:15:30-05:00',
      review_status: 'DISMISSED',
      reviewed_by: 2,
      reviewed_at: '2026-11-18T12:16:00-05:00',
      operator_notes: 'Falso positivo: personal de mantenimiento moviendo vallas metálicas rápidamente.'
    },
    {
      id: 1038,
      camera_id: 1,
      category_id: 2,
      confidence: 0.9180,
      occurred_at: '2026-11-18T11:08:51-05:00',
      alarm_active: false,
      silenced_by: 1,
      silenced_at: '2026-11-18T11:09:12-05:00',
      review_status: 'CONFIRMED',
      reviewed_by: 1,
      reviewed_at: '2026-11-18T11:10:05-05:00',
      operator_notes: 'Individuo con objeto contundente retenido en control de acceso principal.'
    },
    {
      id: 1037,
      camera_id: 6,
      category_id: 3,
      confidence: 0.8530,
      occurred_at: '2026-11-18T09:41:33-05:00',
      alarm_active: false,
      silenced_by: null,
      silenced_at: null,
      review_status: 'PENDING',
      reviewed_by: null,
      operator_notes: null
    }
  ]);

  readonly evidenceList = signal<Evidence[]>([
    {
      id: 501,
      incident_id: 1042,
      type: 'VIDEO_CLIP',
      file_path: '/storage/evidence/2026-11-18/INC-1042_cam01_clip.mp4',
      created_at: '2026-11-18T14:31:43-05:00',
      duration_seconds: 15,
      thumbnail_url: 'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 502,
      incident_id: 1042,
      type: 'SNAPSHOT',
      file_path: '/storage/evidence/2026-11-18/INC-1042_cam01_frame_peak.jpg',
      created_at: '2026-11-18T14:31:42-05:00',
      thumbnail_url: 'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 503,
      incident_id: 1042,
      type: 'AUDIO_CLIP',
      file_path: '/storage/evidence/2026-11-18/INC-1042_cam01_ambient.wav',
      created_at: '2026-11-18T14:31:44-05:00',
      duration_seconds: 15
    },
    {
      id: 504,
      incident_id: 1041,
      type: 'VIDEO_CLIP',
      file_path: '/storage/evidence/2026-11-18/INC-1041_cam07_clip.mp4',
      created_at: '2026-11-18T14:24:12-05:00',
      duration_seconds: 20,
      thumbnail_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 505,
      incident_id: 1040,
      type: 'SNAPSHOT',
      file_path: '/storage/evidence/2026-11-18/INC-1040_cam12_frame.jpg',
      created_at: '2026-11-18T13:52:20-05:00',
      thumbnail_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
    }
  ]);

  // --- 3. ALERTS & PROTOCOLS ---
  readonly protocols = signal<Protocol[]>([
    {
      id: 1,
      category_id: 1,
      title: 'Protocolo P-01: Intervención ante Agresión Física en Campus',
      steps:
        '1. Verificar visualmente el clip de evidencia y transmisión en vivo de la cámara durante al menos 5 segundos.\n' +
        '2. Si se confirma violencia activa, mantener o activar la sirena disuasoria de la zona correspondiente.\n' +
        '3. Despachar por radio a la cuadrilla de Seguridad Interna más cercana al sector.\n' +
        '4. Si existen heridos visibles, notificar inmediatamente al Tópico Médico del Campus.\n' +
        '5. Registrar en notas del incidente la identidad o descripción de los involucrados antes de cerrar la alerta.',
      is_active: true
    },
    {
      id: 2,
      category_id: 2,
      title: 'Protocolo P-02: Bloqueo de Accesos por Objeto Peligroso / Arma',
      steps:
        '1. Confirmar visualmente la presencia del objeto de riesgo en el cuadro demarcado por la IA.\n' +
        '2. Activar bloqueo remoto de torniquetes y puertas electromagnéticas de la zona.\n' +
        '3. Emitir alerta automática a Policía Nacional y Jefatura de Seguridad.\n' +
        '4. Evitar confrontación directa sin equipamiento de protección.',
      is_active: true
    },
    {
      id: 3,
      category_id: 3,
      title: 'Protocolo P-03: Disuasión de Altercado Grupal',
      steps:
        '1. Evaluar cantidad de personas involucradas mediante cámara principal y cámaras adyacentes.\n' +
        '2. Activar pulso sonoro disuasorio de 10 segundos en la sirena de la zona.\n' +
        '3. Coordinar presencia de al menos 2 agentes de campo.',
      is_active: true
    },
    {
      id: 4,
      category_id: 4,
      title: 'Protocolo P-04: Resguardo Patrimonial y Vandalismo',
      steps:
        '1. Capturar snapshot de alta resolución para respaldo legal.\n' +
        '2. Notificar a supervisión de infraestructura y seguridad.',
      is_active: true
    }
  ]);

  readonly emergencyContacts = signal<EmergencyContact[]>([
    {
      id: 1,
      name: 'Central Seguridad Interna · Campus Central',
      type: 'INTERNAL_SECURITY',
      phone: '+51 1 610-4400 Anexo 110',
      email: 'seguridad.campus@centinela.edu.pe',
      receives_email: true,
      is_active: true
    },
    {
      id: 2,
      name: 'Comisaría Sectorial PNP · Patrullaje Integrado',
      type: 'POLICE',
      phone: '105 / +51 1 431-2290',
      email: 'alertas.comisaria@pnp.gob.pe',
      receives_email: true,
      is_active: true
    },
    {
      id: 3,
      name: 'Unidad Médica y Ambulancia Campus',
      type: 'MEDICAL',
      phone: '+51 1 610-4400 Anexo 911',
      email: 'topico.emergencias@centinela.edu.pe',
      receives_email: true,
      is_active: true
    },
    {
      id: 4,
      name: 'Dirección de Operaciones y Bienestar',
      type: 'ADMINISTRATOR',
      phone: '+51 998 412 005',
      email: 'direccion.operaciones@centinela.edu.pe',
      receives_email: false,
      is_active: true
    }
  ]);

  readonly notifications = signal<NotificationLog[]>([
    {
      id: 901,
      incident_id: 1042,
      contact_id: 1,
      recipient_email: 'seguridad.campus@centinela.edu.pe',
      status: 'SENT',
      error: null,
      sent_at: '2026-11-18T14:31:44-05:00'
    },
    {
      id: 902,
      incident_id: 1042,
      contact_id: 3,
      recipient_email: 'topico.emergencias@centinela.edu.pe',
      status: 'SENT',
      error: null,
      sent_at: '2026-11-18T14:31:45-05:00'
    },
    {
      id: 903,
      incident_id: 1041,
      contact_id: 1,
      recipient_email: 'seguridad.campus@centinela.edu.pe',
      status: 'SENT',
      error: null,
      sent_at: '2026-11-18T14:24:12-05:00'
    },
    {
      id: 904,
      incident_id: 1038,
      contact_id: 2,
      recipient_email: 'alertas.comisaria@pnp.gob.pe',
      status: 'FAILED',
      error: 'SMTP Timeout: servidor externo tardó más de 10000ms en responder.',
      sent_at: '2026-11-18T11:08:55-05:00'
    }
  ]);

  readonly hourlyAlerts = signal<number[]>([
    1, 1, 1, 1, 1, 1, 1, 3, 2, 1, 3, 3, 5, 3, 9, 3, 3, 1, 1, 1, 1, 1, 1, 1
  ]);

  // --- COMPUTED SELECTORS ---
  readonly pendingIncidents = computed(() =>
    this.incidents().filter((i) => i.review_status === 'PENDING')
  );

  readonly priorityIncident = computed(() => {
    const pending = this.pendingIncidents();
    return pending.length > 0 ? pending[0] : null;
  });

  readonly activeAlarmsCount = computed(() =>
    this.incidents().filter((i) => i.alarm_active).length
  );

  readonly currentTerms = computed(() =>
    this.termsList().find((t) => t.is_current) ?? this.termsList()[0]
  );

  readonly hasCurrentUserAcceptedTerms = computed(() => {
    const user = this.currentUser();
    const current = this.currentTerms();
    if (!user || !current) return true;
    return this.termsAcceptances().some(
      (a) => a.user_id === user.id && a.terms_id === current.id && a.accepted
    );
  });

  // --- HELPERS & MUTATIONS ---
  showNotice(msg: string): void {
    this.noticeMessage.set(msg);
  }

  clearNotice(): void {
    this.noticeMessage.set('');
  }

  toggleDarkMode(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-mode', next);
    }
  }

  getZoneById(id: number | null): Zone | undefined {
    if (id === null) return undefined;
    return this.zones().find((z) => z.id === id);
  }

  getCameraById(id: number): Camera | undefined {
    return this.cameras().find((c) => c.id === id);
  }

  getCategoryById(id: number): IncidentCategory | undefined {
    return this.categories().find((c) => c.id === id);
  }

  getUserById(id: number | null): User | undefined {
    if (id === null) return undefined;
    return this.users().find((u) => u.id === id);
  }

  getProtocolByCategoryId(categoryId: number): Protocol | undefined {
    return this.protocols().find((p) => p.category_id === categoryId && p.is_active);
  }

  getEvidenceByIncidentId(incidentId: number): Evidence[] {
    return this.evidenceList().filter((e) => e.incident_id === incidentId);
  }

  getNotificationsByIncidentId(incidentId: number): NotificationLog[] {
    return this.notifications().filter((n) => n.incident_id === incidentId);
  }

  reviewIncident(incidentId: number, status: ReviewStatus, notes?: string): void {
    const now = new Date().toISOString();
    const reviewerId = this.currentUser().id;
    this.incidents.update((list) =>
      list.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              review_status: status,
              reviewed_by: reviewerId,
              reviewed_at: now,
              alarm_active: status === 'DISMISSED' ? false : inc.alarm_active,
              operator_notes: notes !== undefined ? notes : inc.operator_notes
            }
          : inc
      )
    );
    const label = status === 'CONFIRMED' ? 'CONFIRMADO' : status === 'DISMISSED' ? 'DESCARTADO (Falso positivo)' : 'PENDIENTE';
    this.showNotice(`Incidente #${incidentId} actualizado a estado: ${label}.`);
  }

  silenceIncidentAlarm(incidentId: number): void {
    const now = new Date().toISOString();
    const userId = this.currentUser().id;
    const target = this.incidents().find((i) => i.id === incidentId);
    this.incidents.update((list) =>
      list.map((inc) =>
        inc.id === incidentId
          ? { ...inc, alarm_active: false, silenced_by: userId, silenced_at: now }
          : inc
      )
    );
    if (target) {
      const cam = this.getCameraById(target.camera_id);
      if (cam) {
        this.sirens.update((sirens) =>
          sirens.map((s) => (s.zone_id === cam.zone_id ? { ...s, is_sounding: false } : s))
        );
      }
    }
    this.showNotice(`Sirena silenciada para el incidente #${incidentId} por ${this.currentUser().name}.`);
  }

  simulateNewViolenceAlert(): Incident {
    const cams = this.cameras().filter((c) => c.is_active);
    const cats = this.categories().filter((c) => c.is_active);
    const randomCam = cams[Math.floor(Math.random() * cams.length)] ?? this.cameras()[0];
    const randomCat = cats[Math.floor(Math.random() * cats.length)] ?? this.categories()[0];
    const newId = Math.max(...this.incidents().map((i) => i.id), 1000) + 1;
    const now = new Date().toISOString();
    const confidence = Number((0.86 + Math.random() * 0.12).toFixed(4));

    const newIncident: Incident = {
      id: newId,
      camera_id: randomCam.id,
      category_id: randomCat.id,
      confidence,
      occurred_at: now,
      alarm_active: true,
      silenced_by: null,
      silenced_at: null,
      review_status: 'PENDING',
      reviewed_by: null,
      operator_notes: null,
      bounding_box: { top: 26, left: 38, width: 29, height: 48 }
    };

    this.incidents.update((list) => [newIncident, ...list]);
    this.evidenceList.update((list) => [
      {
        id: Math.max(...list.map((e) => e.id), 500) + 1,
        incident_id: newId,
        type: 'VIDEO_CLIP',
        file_path: `/storage/evidence/live/INC-${newId}_${randomCam.code?.toLowerCase() || 'cam'}.mp4`,
        created_at: now,
        duration_seconds: 12,
        thumbnail_url: randomCam.preview_image
      },
      ...list
    ]);

    // Trigger notification logs for active email contacts
    const activeEmailContacts = this.emergencyContacts().filter((c) => c.is_active && c.receives_email && c.email);
    activeEmailContacts.forEach((contact, idx) => {
      this.notifications.update((nList) => [
        {
          id: Math.max(...nList.map((n) => n.id), 900) + 1 + idx,
          incident_id: newId,
          contact_id: contact.id,
          recipient_email: contact.email!,
          status: 'SENT',
          error: null,
          sent_at: now
        },
        ...nList
      ]);
    });

    // Sound zone siren
    this.sirens.update((sList) =>
      sList.map((s) => (s.zone_id === randomCam.zone_id && s.is_active ? { ...s, is_sounding: true } : s))
    );

    this.showNotice(
      `¡Alerta IA en tiempo real! ${randomCat.name} detectada en ${randomCam.code} (${randomCam.name}) con ${(confidence * 100).toFixed(1)}% de confianza.`
    );
    return newIncident;
  }

  // Infrastructure CRUD
  saveZone(zone: Omit<Zone, 'id'> & { id?: number }): void {
    if (zone.id) {
      this.zones.update((list) => list.map((z) => (z.id === zone.id ? (zone as Zone) : z)));
      this.showNotice(`Zona "${zone.name}" actualizada.`);
    } else {
      const nextId = Math.max(...this.zones().map((z) => z.id), 0) + 1;
      this.zones.update((list) => [...list, { ...zone, id: nextId }]);
      this.showNotice(`Zona "${zone.name}" creada.`);
    }
  }

  saveCamera(camera: Omit<Camera, 'id'> & { id?: number }): void {
    if (camera.id) {
      this.cameras.update((list) => list.map((c) => (c.id === camera.id ? (camera as Camera) : c)));
      this.showNotice(`Cámara "${camera.name}" actualizada.`);
    } else {
      const nextId = Math.max(...this.cameras().map((c) => c.id), 0) + 1;
      const code = camera.code || `CAM-${String(nextId).padStart(2, '0')}`;
      const preview =
        camera.preview_image ||
        'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=900&q=80';
      this.cameras.update((list) => [...list, { ...camera, id: nextId, code, preview_image: preview }]);
      this.showNotice(`Cámara "${camera.name}" (${code}) registrada.`);
    }
  }

  saveSiren(siren: Omit<Siren, 'id'> & { id?: number }): void {
    if (siren.id) {
      this.sirens.update((list) => list.map((s) => (s.id === siren.id ? (siren as Siren) : s)));
      this.showNotice(`Sirena "${siren.name}" actualizada.`);
    } else {
      const nextId = Math.max(...this.sirens().map((s) => s.id), 0) + 1;
      this.sirens.update((list) => [...list, { ...siren, id: nextId, is_sounding: false }]);
      this.showNotice(`Sirena "${siren.name}" registrada.`);
    }
  }

  toggleSirenTest(sirenId: number): void {
    this.sirens.update((list) =>
      list.map((s) => (s.id === sirenId ? { ...s, is_sounding: !s.is_sounding } : s))
    );
  }

  // Categories, Protocols & Contacts CRUD
  saveCategory(cat: Omit<IncidentCategory, 'id'> & { id?: number }): void {
    if (cat.id) {
      this.categories.update((list) => list.map((c) => (c.id === cat.id ? (cat as IncidentCategory) : c)));
      this.showNotice(`Categoría IA "${cat.name}" actualizada.`);
    } else {
      const nextId = Math.max(...this.categories().map((c) => c.id), 0) + 1;
      this.categories.update((list) => [...list, { ...cat, id: nextId }]);
      this.showNotice(`Categoría IA "${cat.name}" creada.`);
    }
  }

  saveProtocol(protocol: Omit<Protocol, 'id'> & { id?: number }): void {
    if (protocol.id) {
      this.protocols.update((list) => list.map((p) => (p.id === protocol.id ? (protocol as Protocol) : p)));
      this.showNotice(`Protocolo "${protocol.title}" actualizado.`);
    } else {
      const nextId = Math.max(...this.protocols().map((p) => p.id), 0) + 1;
      this.protocols.update((list) => [...list, { ...protocol, id: nextId }]);
      this.showNotice(`Protocolo "${protocol.title}" creado.`);
    }
  }

  saveEmergencyContact(contact: Omit<EmergencyContact, 'id'> & { id?: number }): void {
    if (contact.id) {
      this.emergencyContacts.update((list) =>
        list.map((c) => (c.id === contact.id ? (contact as EmergencyContact) : c))
      );
      this.showNotice(`Contacto "${contact.name}" actualizado.`);
    } else {
      const nextId = Math.max(...this.emergencyContacts().map((c) => c.id), 0) + 1;
      this.emergencyContacts.update((list) => [...list, { ...contact, id: nextId }]);
      this.showNotice(`Contacto de emergencia "${contact.name}" agregado.`);
    }
  }

  // Users & Terms CRUD
  saveUser(user: Omit<User, 'id' | 'created_at' | 'password_hash'> & { id?: number }): void {
    if (user.id) {
      this.users.update((list) =>
        list.map((u) => (u.id === user.id ? { ...u, ...user } : u))
      );
      if (this.currentUser().id === user.id) {
        this.currentUser.update((curr) => ({ ...curr, ...user }));
      }
      this.showNotice(`Usuario "${user.name}" actualizado.`);
    } else {
      const nextId = Math.max(...this.users().map((u) => u.id), 0) + 1;
      const newUser: User = {
        ...user,
        id: nextId,
        password_hash: '$2b$12$mockHashGenerated9912',
        created_at: new Date().toISOString()
      };
      this.users.update((list) => [...list, newUser]);
      this.showNotice(`Usuario "${user.name}" registrado.`);
    }
  }

  switchActiveUser(userId: number): void {
    const found = this.users().find((u) => u.id === userId);
    if (found) {
      this.currentUser.set(found);
      this.showNotice(`Sesión cambiada a: ${found.name} (${found.role})`);
    }
  }

  acceptCurrentTerms(): void {
    const user = this.currentUser();
    const terms = this.currentTerms();
    if (!user || !terms) return;
    const exists = this.termsAcceptances().some((a) => a.user_id === user.id && a.terms_id === terms.id);
    if (!exists) {
      const nextId = Math.max(...this.termsAcceptances().map((a) => a.id), 0) + 1;
      this.termsAcceptances.update((list) => [
        ...list,
        {
          id: nextId,
          user_id: user.id,
          terms_id: terms.id,
          accepted: true,
          accepted_at: new Date().toISOString()
        }
      ]);
      this.showNotice(`Términos y condiciones (${terms.version}) aceptados por ${user.name}.`);
    }
  }

  publishNewTermsVersion(version: string, title: string, content: string): void {
    const now = new Date().toISOString();
    const nextId = Math.max(...this.termsList().map((t) => t.id), 0) + 1;
    this.termsList.update((list) => [
      ...list.map((t) => ({ ...t, is_current: false })),
      {
        id: nextId,
        version,
        title,
        content,
        is_current: true,
        published_at: now,
        created_at: now
      }
    ]);
    this.showNotice(`Nueva versión ${version} publicada como vigente. Los operadores deberán aceptarla.`);
  }
}
