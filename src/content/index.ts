import { rawPacks } from './packs';
import {
  contentPackSchema,
  type ContentPack,
  type Domain,
  type Lesson,
  type Question,
} from './schema';

let cache: ContentPack[] | null = null;

/** Parse et met en cache tous les packs embarqués (validation Zod au premier accès). */
export function getPacks(): ContentPack[] {
  if (!cache) cache = rawPacks.map((raw) => contentPackSchema.parse(raw));
  return cache;
}

export function getDefaultPack(): ContentPack {
  return getPacks()[0];
}

export function getDomain(pack: ContentPack, domainId: string): Domain | undefined {
  return pack.domains.find((d) => d.id === domainId);
}

export function lessonsByDomain(pack: ContentPack, domainId: string): Lesson[] {
  return pack.lessons
    .filter((l) => l.domainId === domainId)
    .sort((a, b) => a.order - b.order);
}

export function questionsByDomain(pack: ContentPack, domainId: string): Question[] {
  return pack.questions.filter((q) => q.domainId === domainId);
}

export type { ContentPack, Domain, Lesson, LessonBlock, MockExam, Question } from './schema';
