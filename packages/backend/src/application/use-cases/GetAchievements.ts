import { Achievement } from '../../domain/entities/Achievement.js';
import { LOGROS, computeStatsLogros, logroConseguido, progresoLogro } from '../../domain/logros.js';
import type { AchievementRepository } from '../../domain/repositories/AchievementRepository.js';
import type { ActivityRepository } from '../../domain/repositories/ActivityRepository.js';
import type { StoryRepository } from '../../domain/repositories/StoryRepository.js';
import type { Clock, IdGenerator } from '../ports.js';
import type { AchievementOutput, GetAchievementsRequest } from '../dto.js';

export interface GetAchievementsDeps {
  stories: StoryRepository;
  activities: ActivityRepository;
  achievements: AchievementRepository;
  newId: IdGenerator;
  now: Clock;
}

/**
 * Devuelve el estado del catálogo de logros de un perfil (US-68): para cada logro, su
 * progreso y si está conseguido, calculados en caliente desde los cuentos/actividades.
 *
 * Además **reconcilia la persistencia**: los logros recién conseguidos que aún no
 * estaban registrados se desbloquean (idempotente por `profileId`+`clave`), de modo
 * que queda constancia en BD de cuándo se logró cada uno. La lectura es correcta
 * aunque la persistencia falle: el estado `conseguido` sale siempre del cálculo, y la
 * fecha de desbloqueo, de lo persistido (o de ahora si se acaba de lograr).
 */
export class GetAchievements {
  constructor(private readonly deps: GetAchievementsDeps) {}

  async execute(input: GetAchievementsRequest): Promise<AchievementOutput[]> {
    const [stories, activities, persistidos] = await Promise.all([
      this.deps.stories.findByProfile(input.profileId),
      this.deps.activities.findByProfile(input.profileId),
      this.deps.achievements.findByProfile(input.profileId),
    ]);

    const stats = computeStatsLogros(stories, activities);
    const fechaPorClave = new Map(persistidos.map((a) => [a.clave, a.desbloqueadoEn] as const));
    const ahora = this.deps.now();

    const salida: AchievementOutput[] = [];
    const nuevos: Achievement[] = [];
    for (const logro of LOGROS) {
      const conseguido = logroConseguido(logro, stats);
      let desbloqueadoEn = fechaPorClave.get(logro.clave);
      if (conseguido && desbloqueadoEn === undefined) {
        // Recién conseguido: se sella ahora y se persistirá tras armar la respuesta.
        desbloqueadoEn = ahora;
        nuevos.push(
          new Achievement({
            id: this.deps.newId(),
            profileId: input.profileId,
            clave: logro.clave,
            desbloqueadoEn: ahora,
          }),
        );
      }
      salida.push({
        clave: logro.clave,
        categoria: logro.categoria,
        meta: logro.meta,
        progreso: progresoLogro(logro, stats),
        conseguido,
        desbloqueadoEn: conseguido ? desbloqueadoEn?.toISOString() : undefined,
      });
    }

    await Promise.all(nuevos.map((a) => this.deps.achievements.unlock(a)));
    return salida;
  }
}
