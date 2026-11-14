import { Injectable, signal } from '@angular/core';

export type Estado = 'pendiente' | 'en-progreso' | 'completada';
export type Prioridad = 'alta' | 'media' | 'baja';
export interface Tarea {
  id: string; userId: string; titulo: string; descripcion: string;
  vencimiento: string; prioridad: Prioridad; estado: Estado;
}
interface Usuario { id: string; nombre: string; email: string; hash: string; }

const read = <T>(k: string, d: T): T => {
  try { return JSON.parse(localStorage.getItem(k) ?? '') as T; } catch { return d; }
};
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
const sha = async (s: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))))
    .map(b => b.toString(16).padStart(2, '0')).join('');

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuario = signal<{ id: string; nombre: string } | null>(read('tm_session', null));

  async registrar(nombre: string, email: string, clave: string): Promise<string | null> {
    const users = read<Usuario[]>('tm_users', []);
    email = email.trim().toLowerCase();
    if (users.some(u => u.email === email)) return 'Ese correo ya tiene una cuenta. Inicia sesión.';
    const u: Usuario = { id: crypto.randomUUID(), nombre: nombre.trim(), email, hash: await sha(clave) };
    write('tm_users', [...users, u]);
    this.abrir(u);
    return null;
  }

  async entrar(email: string, clave: string): Promise<string | null> {
    const u = read<Usuario[]>('tm_users', []).find(x => x.email === email.trim().toLowerCase());
    if (!u || u.hash !== await sha(clave)) return 'Correo o contraseña incorrectos.';
    this.abrir(u);
    return null;
  }

  salir() { localStorage.removeItem('tm_session'); this.usuario.set(null); }
  private abrir(u: Usuario) {
    const s = { id: u.id, nombre: u.nombre };
    write('tm_session', s); this.usuario.set(s);
  }
}

@Injectable({ providedIn: 'root' })
export class TareaService {
  private todas = signal<Tarea[]>(read('tm_tasks', []));
  constructor(private auth: AuthService) {}

  mias() { return this.todas().filter(t => t.userId === this.auth.usuario()?.id); }
  private guardar(l: Tarea[]) { this.todas.set(l); write('tm_tasks', l); }

  crear(d: Omit<Tarea, 'id' | 'userId' | 'estado'>) {
    this.guardar([...this.todas(), { ...d, id: crypto.randomUUID(), userId: this.auth.usuario()!.id, estado: 'pendiente' }]);
  }
  actualizar(id: string, cambios: Partial<Tarea>) {
    this.guardar(this.todas().map(t => t.id === id ? { ...t, ...cambios } : t));
  }
  eliminar(id: string) { this.guardar(this.todas().filter(t => t.id !== id)); }
}
