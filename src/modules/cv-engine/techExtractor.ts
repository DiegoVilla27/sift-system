/**
 * Diccionario de tecnologías reconocidas para extracción automática de CVs.
 */
export const KNOWN_TECHNOLOGIES: { name: string; patterns: RegExp[] }[] = [
  // Frameworks & Librerías Frontend
  { name: "React", patterns: [/\breact(\.js|js)?\b/i] },
  { name: "React Native", patterns: [/\breact[\s-]native\b/i] },
  { name: "Angular", patterns: [/\bangular(\.js|js|\s*\d+)?\b/i] },
  { name: "Next.js", patterns: [/\bnext(\.js|js)?\b/i] },
  { name: "Vue.js", patterns: [/\bvue(\.js|js|\s*\d+)?\b/i] },
  { name: "Nuxt.js", patterns: [/\bnuxt(\.js|js)?\b/i] },
  { name: "Ionic", patterns: [/\bionic\b/i] },
  { name: "Flutter", patterns: [/\bflutter\b/i] },
  { name: "Svelte", patterns: [/\bsvelte\b/i] },
  { name: "Solid.js", patterns: [/\bsolid(\.js|js)?\b/i] },

  // Lenguajes
  { name: "TypeScript", patterns: [/\btypescript\b/i, /\bts\b/i] },
  { name: "JavaScript", patterns: [/\bjavascript\b/i, /\bjs\b/i, /\bes6\b/i] },
  { name: "HTML5", patterns: [/\bhtml5?\b/i] },
  { name: "CSS3", patterns: [/\bcss3?\b/i] },
  { name: "SCSS", patterns: [/\bscss\b/i, /\bsass\b/i] },
  { name: "Dart", patterns: [/\bdart\b/i] },
  { name: "Node.js", patterns: [/\bnode(\.js|js)?\b/i] },
  { name: "Python", patterns: [/\bpython\b/i] },
  { name: "Java", patterns: [/\bjava\b(?!script)/i] },
  { name: "PHP", patterns: [/\bphp\b/i] },

  // Estilos & UI Kits
  { name: "Tailwind CSS", patterns: [/\btailwind(\s*css)?\b/i] },
  { name: "Bootstrap", patterns: [/\bbootstrap\b/i] },
  { name: "Material UI", patterns: [/\bmaterial[\s-]ui\b/i, /\bmui\b/i] },
  { name: "Angular Material", patterns: [/\bangular\s*material\b/i] },
  { name: "Chakra UI", patterns: [/\bchakra[\s-]ui\b/i] },
  { name: "Shadcn UI", patterns: [/\bshadcn(\/ui)?\b/i] },
  { name: "PrimeNG", patterns: [/\bprimeng\b/i] },
  { name: "Styled Components", patterns: [/\bstyled[\s-]components\b/i] },

  // Gestión de Estado & Reactividad
  { name: "Redux", patterns: [/\bredux\b/i, /\bredux[\s-]toolkit\b/i] },
  { name: "Zustand", patterns: [/\bzustand\b/i] },
  { name: "RxJS", patterns: [/\brxjs\b/i] },
  { name: "NgRx", patterns: [/\bngrx\b/i] },
  { name: "Signals", patterns: [/\bsignals\b/i] },
  { name: "MobX", patterns: [/\bmobx\b/i] },
  { name: "TanStack Query", patterns: [/\b(tanstack[\s-]query|react[\s-]query)\b/i] },

  // APIs & Backend
  { name: "REST APIs", patterns: [/\brest(ful)?\s*api(s)?\b/i] },
  { name: "GraphQL", patterns: [/\bgraphql\b/i, /\bapollo\b/i] },
  { name: "Express.js", patterns: [/\bexpress(\.js|js)?\b/i] },
  { name: "NestJS", patterns: [/\bnest(\.js|js)?\b/i] },
  { name: "Spring Boot", patterns: [/\bspring\s*boot\b/i] },
  { name: "PostgreSQL", patterns: [/\bpostgres(ql)?\b/i] },
  { name: "MongoDB", patterns: [/\bmongo(db)?\b/i] },
  { name: "Redis", patterns: [/\bredis\b/i] },
  { name: "Firebase", patterns: [/\bfirebase\b/i] },
  { name: "Supabase", patterns: [/\bsupabase\b/i] },

  // Testing
  { name: "Jest", patterns: [/\bjest\b/i] },
  { name: "React Testing Library", patterns: [/\breact[\s-]testing[\s-]library\b/i, /\brtl\b/i] },
  { name: "Cypress", patterns: [/\bcypress\b/i] },
  { name: "Playwright", patterns: [/\bplaywright\b/i] },
  { name: "Vitest", patterns: [/\bvitest\b/i] },
  { name: "Karma", patterns: [/\bkarma\b/i] },
  { name: "Jasmine", patterns: [/\bjasmine\b/i] },

  // Build Tools & DevOps
  { name: "Vite", patterns: [/\bvite\b/i] },
  { name: "Webpack", patterns: [/\bwebpack\b/i] },
  { name: "Git", patterns: [/\bgit\b/i, /\bgithub\b/i, /\bgitlab\b/i] },
  { name: "Docker", patterns: [/\bdocker\b/i] },
  { name: "CI/CD", patterns: [/\bci[\s/]?cd\b/i] },

  // Arquitectura
  { name: "Microfrontends", patterns: [/\bmicro[\s-]?frontends?\b/i] },
  { name: "Clean Architecture", patterns: [/\bclean\s*architecture\b/i] },
  { name: "Atomic Design", patterns: [/\batomic\s*design\b/i] },
  { name: "Design Systems", patterns: [/\bdesign\s*systems?\b/i] },
];

/**
 * Extrae de forma determinista todas las tecnologías presentes en el texto del CV.
 */
export function extractTechnologiesFromText(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const found = new Set<string>();

  for (const tech of KNOWN_TECHNOLOGIES) {
    for (const pattern of tech.patterns) {
      if (pattern.test(text)) {
        found.add(tech.name);
        break;
      }
    }
  }

  return Array.from(found);
}
