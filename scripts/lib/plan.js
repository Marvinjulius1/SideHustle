// Ordnet jedem Video eine Umgebung und eine Haltung (laufen/sitzen) zu – reproduzierbar.
import { SCENES } from '../../content/scenes.js';

/**
 * Regeln:
 * - Wiederkehrende Orte (Zuhause) etwa jeden 6. Tag, abwechselnd.
 * - Sonst die übrigen Orte der Reihe nach; erst wenn alle dran waren, wiederholen sie sich.
 * - Nie zweimal dieselbe Umgebung hintereinander.
 * - Etwa jedes dritte Video sitzt die Figur (bzw. immer, wenn der Ort nur Sitzen erlaubt);
 *   an wiederkehrenden Orten abwechselnd laufen und sitzen.
 * - Ein Video kann Umgebung/Haltung selbst festlegen (video.scene / video.pose).
 */
export function assignScenes(videos, scenes = SCENES) {
  const byId = new Map(scenes.map((s) => [s.id, s]));
  const recurring = scenes.filter((s) => s.recurring);
  const rotating = scenes.filter((s) => !s.recurring);
  let r = 0;
  let home = 0;
  let prev = null;

  return videos.map((video, i) => {
    let scene;
    let homeVisit = -1;
    if (video.scene) {
      scene = byId.get(video.scene);
      if (!scene) throw new Error(`Tag ${video.day}: unbekannte Umgebung ${video.scene}`);
    } else if (i % 6 === 0 && recurring.length) {
      homeVisit = Math.floor(home / recurring.length);
      scene = recurring[home++ % recurring.length];
    } else {
      scene = rotating[r++ % rotating.length];
      if (scene === prev) scene = rotating[r++ % rotating.length];
    }
    if (scene === prev) throw new Error(`Tag ${video.day}: gleiche Umgebung wie am Vortag`);
    prev = scene;

    let pose = video.pose;
    if (!pose) {
      if (scene.poses.length === 1) pose = scene.poses[0];
      else if (homeVisit >= 0) pose = homeVisit % 2 === 1 ? 'sit' : 'walk'; // Zuhause: abwechselnd
      else pose = i % 3 === 2 ? 'sit' : 'walk';
    }
    if (!scene.poses.includes(pose)) throw new Error(`Tag ${video.day}: Haltung ${pose} passt nicht zu ${scene.id}`);
    return { day: video.day, scene, pose };
  });
}
