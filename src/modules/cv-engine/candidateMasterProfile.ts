/**
 * Perfil Maestro del Candidato (Diego Fernando Villanueva Penagos)
 * Utilizado por el motor de IA para matchmaking y por Playwright para rellenar formularios ATS automáticamente.
 */

export interface CandidateSalaryExpectations {
  spainAnnualEur: number;
  colombiaMonthlyCop: number;
  internationalMonthlyUsd: number;
  spainFormatted: string;
  colombiaFormatted: string;
  usdFormatted: string;
}

export interface CandidateFormAnswers {
  legalAuthorizationSpain: string;
  legalAuthorizationColombia: string;
  requiresVisaSponsorship: boolean;
  disabilityCertified: boolean;
  disabilityPercentage: number;
  availabilityInterviews: string;
  availabilityStart: string;
  yearsOfExperience: number;
  englishLevel: string;
  dealBreakers: string[];
  preferredModalities: string[];
}

export const CANDIDATE_MASTER_PROFILE = {
  fullName: "Diego Fernando Villanueva Penagos",
  shortName: "Diego Villanueva",
  title: "Ingeniero de Sistemas y Computación | Senior Frontend & Full Stack Developer",
  email: "dv270992@gmail.com",
  portfolioUrl: "https://cabuweb.com",
  linkedInUrl: "https://www.linkedin.com/in/diego-villa-dev/",
  gitHubUrl: "https://github.com/DiegoVilla27",
  
  // Contact by Region
  spain: {
    phone: "+34658074821",
    formattedPhone: "+34 658 07 48 21",
    city: "Valencia",
    country: "España",
    fullLocation: "Valencia, España",
    dni: "26943391H",
    documentType: "DNI",
    pdfFilename: "Diego_Villanueva_CV_Espana.pdf",
    targetCurrencies: ["EUR"],
    annualSalaryEur: 30000,
    salaryLabel: "30.000 € / año bruto",
  },
  colombia: {
    phone: "+573114780189",
    formattedPhone: "+57 311 478 0189",
    city: "Armenia",
    department: "Quindío",
    country: "Colombia",
    fullLocation: "Armenia, Quindío, Colombia",
    cedula: "1094930706",
    documentType: "Cédula de Ciudadanía (CC)",
    pdfFilename: "Diego_Villanueva_CV_Colombia.pdf",
    targetCurrencies: ["COP", "USD"],
    monthlySalaryCop: 5000000,
    monthlySalaryUsd: 2000,
    salaryCopLabel: "5.000.000 COP / mes",
    salaryUsdLabel: "2.000 USD / mes",
  },

  // Condición de Inclusión / Bonificaciones
  disability: {
    hasDisability: true,
    percentage: 77,
    label: "Certificado de Discapacidad del 77%",
    spainBenefitsInfo: "Aplica a cuotas de inclusión laboral (LGD) y bonificaciones de contratación en España.",
  },

  // Respuestas maestras para formularios ATS
  formAnswers: {
    yearsOfExperienceTotal: 8,
    yearsOfFrontend: 8,
    availabilityInterviews: "Inmediata",
    availabilityStart: "Inmediata (sin periodo de preaviso requerido)",
    requiresSponsorship: "No",
    authorizedToWorkSpain: "Sí (Permiso de trabajo y residencia legal vigente)",
    authorizedToWorkColombia: "Sí (Ciudadanía colombiana / Cédula)",
    dniSpain: "26943391H",
    cedulaColombia: "1094930706",
    dealBreakers: [
      "100% Presencial (No aceptado)",
      "Presencial obligatorio sin flexibilidad",
      "Ofertas en inglés o que exijan inglés fluido/avanzado (El candidato no sabe inglés, 100% en español)",
    ],
    languages: {
      spanish: "Nativo",
      english: "No habla inglés (Requisito excluyente: vacantes únicamente en español)",
    },
    acceptedModalities: ["100% Remoto", "Híbrido"],
  },

  // Tecnologías Clave (Core Skills)
  skills: {
    frontend: [
      "Angular",
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "HTML5",
      "CSS/SCSS",
      "RxJS",
      "NgRx",
      "Signals",
      "Redux",
      "Zustand",
      "Tailwind CSS",
      "Angular Material",
      "PrimeNG",
    ],
    backend: [
      "Express",
      "Node.js",
      "Spring Boot",
      "Java",
      "REST APIs",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "RabbitMQ",
      "JWT",
      "OAuth",
    ],
    mobile: ["Flutter", "React Native", "Ionic"],
    architecture: [
      "Clean Architecture",
      "Hexagonal Architecture",
      "Microfrontends",
      "Atomic Design",
      "Design Systems",
      "SOLID",
      "DRY",
      "KISS",
    ],
    testing: ["Jest", "React Testing Library", "Playwright", "Karma", "Jasmine", "JUnit", "Mockito"],
    devops: ["Git", "Docker", "GitHub Actions", "Vite", "Webpack", "ESLint", "Sonar"],
  },

  // Carta de Presentación Oficial
  masterCoverLetter: `¡Hola!

Mi nombre es Diego Villanueva, soy Ingeniero de Sistemas y Computación y Desarrollador de Software, con más de 8 años de experiencia en el desarrollo de aplicaciones web y móviles.

Mi especialización principal es el Frontend, con amplia experiencia en Angular y React, participando en el diseño de arquitecturas escalables, sistemas de componentes, aplicaciones empresariales y plataformas de alto rendimiento. También cuento con experiencia en desarrollo Full Stack y Backend, trabajando con Node.js, Express.js, Laravel, Spring Boot, PostgreSQL y MongoDB, además de tecnologías móviles como Ionic, React Native y Flutter.

A lo largo de mi trayectoria he participado en proyectos para sectores como transporte, seguros, agricultura, e-commerce y gestión empresarial, trabajando tanto en el desarrollo de producto como en arquitectura, integración de APIs, optimización de rendimiento y definición de buenas prácticas técnicas.

Me considero una persona orientada a la calidad, el aprendizaje continuo y la resolución de problemas, con capacidad para transformar requisitos de negocio en soluciones técnicas mantenibles y escalables.

Atentamente,
Diego Villanueva`,
};
