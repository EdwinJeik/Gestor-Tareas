import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService, Estado, Prioridad, Tarea, TareaService } from './services';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
  <header class="top">
    <h1>Hola, {{ auth.usuario()?.nombre }}</h1>
    <div>
      <button class="primary" (click)="nueva()">Nueva tarea</button>
      <button class="ghost" (click)="auth.salir()">Cerrar sesión</button>
    </div>
  </header>

  <section class="filtros" aria-label="Buscar y filtrar">
    <input type="search" placeholder="Buscar por título o descripción" [ngModel]="q()" (ngModelChange)="q.set($event)">
    <select [ngModel]="fEstado()" (ngModelChange)="fEstado.set($event)" aria-label="Filtrar por estado">
      <option value="">Todos los estados</option>
      @for (e of estados; track e.v) { <option [value]="e.v">{{ e.t }}</option> }
    </select>
    <select [ngModel]="fPrio()" (ngModelChange)="fPrio.set($event)" aria-label="Filtrar por prioridad">
      <option value="">Todas las prioridades</option>
      <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
    </select>
  </section>

  @if (editando()) {
    <form class="editor" (ngSubmit)="guardar()" #f="ngForm">
      <h2>{{ editando()!.id ? 'Editar tarea' : 'Nueva tarea' }}</h2>
      <label>Título <input name="titulo" [(ngModel)]="form.titulo" required maxlength="80"></label>
      <label>Descripción <textarea name="descripcion" rows="3" [(ngModel)]="form.descripcion"></textarea></label>
      <div class="fila">
        <label>Vence <input name="vencimiento" type="date" [(ngModel)]="form.vencimiento" required></label>
        <label>Prioridad
          <select name="prioridad" [(ngModel)]="form.prioridad">
            <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
          </select>
        </label>
      </div>
      <div class="fila">
        <button class="primary" [disabled]="f.invalid">Guardar tarea</button>
        <button type="button" class="ghost" (click)="editando.set(null)">Cancelar</button>
      </div>
    </form>
  }

  <div class="tablero">
    @for (e of estados; track e.v) {
      <section class="col">
        <h2>{{ e.t }} <span class="n">{{ porEstado(e.v).length }}</span></h2>
        @for (t of porEstado(e.v); track t.id) {
          <article class="tarea" [class.hecha]="t.estado === 'completada'">
            <span class="prio {{ t.prioridad }}">Prioridad {{ t.prioridad }}</span>
            <h3>{{ t.titulo }}</h3>
            @if (t.descripcion) { <p>{{ t.descripcion }}</p> }
            <p class="fecha" [class.vencida]="vencida(t)">Vence {{ t.vencimiento | date:'d MMM y' }}</p>
            <div class="acciones">
              @if (t.estado !== 'completada') {
                <button class="ok" (click)="mover(t, 'completada')">Marcar completada</button>
              }
              <select [ngModel]="t.estado" (ngModelChange)="mover(t, $event)" aria-label="Cambiar estado">
                @for (x of estados; track x.v) { <option [value]="x.v">{{ x.t }}</option> }
              </select>
              <button class="ghost" (click)="editar(t)">Editar</button>
              <button class="ghost peligro" (click)="eliminar(t)">Eliminar</button>
            </div>
          </article>
        } @empty {
          <p class="vacio">{{ hayFiltros() ? 'Ninguna tarea coincide con los filtros.' : 'Sin tareas aquí todavía.' }}</p>
        }
      </section>
    }
  </div>`,
})
export class TareasComponent {
  estados: { v: Estado; t: string }[] = [
    { v: 'pendiente', t: 'Pendientes' }, { v: 'en-progreso', t: 'En progreso' }, { v: 'completada', t: 'Completadas' },
  ];
  q = signal(''); fEstado = signal(''); fPrio = signal('');
  editando = signal<{ id?: string } | null>(null);
  form = { titulo: '', descripcion: '', vencimiento: '', prioridad: 'media' as Prioridad };

  filtradas = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.tareas.mias().filter(t =>
      (!q || t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q)) &&
      (!this.fEstado() || t.estado === this.fEstado()) &&
      (!this.fPrio() || t.prioridad === this.fPrio()));
  });

  constructor(public auth: AuthService, private tareas: TareaService) {}

  porEstado(e: Estado) { return this.filtradas().filter(t => t.estado === e); }
  hayFiltros() { return !!(this.q() || this.fEstado() || this.fPrio()); }
  vencida(t: Tarea) { return t.estado !== 'completada' && t.vencimiento < new Date().toISOString().slice(0, 10); }

  nueva() { this.form = { titulo: '', descripcion: '', vencimiento: '', prioridad: 'media' }; this.editando.set({}); }
  editar(t: Tarea) {
    this.form = { titulo: t.titulo, descripcion: t.descripcion, vencimiento: t.vencimiento, prioridad: t.prioridad };
    this.editando.set({ id: t.id });
  }
  guardar() {
    const id = this.editando()?.id;
    id ? this.tareas.actualizar(id, this.form) : this.tareas.crear(this.form);
    this.editando.set(null);
  }
  mover(t: Tarea, estado: Estado) { this.tareas.actualizar(t.id, { estado }); }
  eliminar(t: Tarea) { if (confirm(`¿Eliminar "${t.titulo}"?`)) this.tareas.eliminar(t.id); }
}
