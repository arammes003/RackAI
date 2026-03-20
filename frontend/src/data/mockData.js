// ===== MOCK DATA — RackAI Spain Powerlifting Dashboard =====

// --- Athletes ---
export const athletes = [
  { id: '1', name: 'Iván Campano Díaz', slug: 'ivan-campano', sex: 'M', country: 'Spain', weightClass: '74', division: 'Open', bestDots: 546.94, bestTotal: 642.5, competitions: 17, imageUrl: null },
  { id: '2', name: 'Andres Fernández Arévalo', slug: 'andres-fernandez', sex: 'M', country: 'Spain', weightClass: '120+', division: 'Open', bestDots: 538.15, bestTotal: 785.5, competitions: 7, imageUrl: null },
  { id: '3', name: 'Antonio Pérez Barros', slug: 'antonio-perez', sex: 'M', country: 'Spain', weightClass: '120+', division: 'Open', bestDots: 537.61, bestTotal: 889.0, competitions: 18, imageUrl: null },
  { id: '4', name: 'Víctor Vázquez Hernández-Carrillo', slug: 'victor-vazquez', sex: 'M', country: 'Spain', weightClass: '120+', division: 'Open', bestDots: 534.34, bestTotal: 930.0, competitions: 22, imageUrl: null },
  { id: '5', name: 'Alberto Herraiz Francés', slug: 'alberto-herraiz', sex: 'M', country: 'Spain', weightClass: '93', division: 'Open', bestDots: 529.57, bestTotal: 724.0, competitions: 14, imageUrl: null },
  { id: '6', name: 'Carlos Martín López', slug: 'carlos-martin', sex: 'M', country: 'Spain', weightClass: '83', division: 'Open', bestDots: 518.42, bestTotal: 625.0, competitions: 11, imageUrl: null },
  { id: '7', name: 'Pablo García Ruiz', slug: 'pablo-garcia', sex: 'M', country: 'Spain', weightClass: '93', division: 'Open', bestDots: 510.88, bestTotal: 712.5, competitions: 9, imageUrl: null },
  { id: '8', name: 'Javier Moreno Sánchez', slug: 'javier-moreno', sex: 'M', country: 'Spain', weightClass: '105', division: 'Open', bestDots: 498.73, bestTotal: 775.0, competitions: 6, imageUrl: null },
  { id: '9', name: 'Diego Torres Blanco', slug: 'diego-torres', sex: 'M', country: 'Spain', weightClass: '74', division: 'Juniors', bestDots: 485.21, bestTotal: 565.0, competitions: 5, imageUrl: null },
  { id: '10', name: 'Alejandro Romero Gil', slug: 'alejandro-romero', sex: 'M', country: 'Spain', weightClass: '66', division: 'Open', bestDots: 478.90, bestTotal: 520.0, competitions: 8, imageUrl: null },
  { id: '11', name: 'Maiara Da Silva Días', slug: 'maiara-dasilva', sex: 'F', country: 'Spain', weightClass: '63', division: 'Open', bestDots: 552.22, bestTotal: 480.0, competitions: 10, imageUrl: null },
  { id: '12', name: 'Inmaculada Soto Ruiz', slug: 'inmaculada-soto', sex: 'F', country: 'Spain', weightClass: '84', division: 'Open', bestDots: 550.22, bestTotal: 510.5, competitions: 15, imageUrl: null },
  { id: '13', name: 'Sara Sanchez-Manjavacas Ruiz', slug: 'sara-sanchez', sex: 'F', country: 'Spain', weightClass: '76', division: 'Open', bestDots: 522.05, bestTotal: 537.5, competitions: 7, imageUrl: null },
  { id: '14', name: 'Milena Salichs Cotrina', slug: 'milena-salichs', sex: 'F', country: 'Spain', weightClass: '84', division: 'Open', bestDots: 511.57, bestTotal: 497.5, competitions: 4, imageUrl: null },
  { id: '15', name: 'Carla Sanchez Jorge', slug: 'carla-sanchez', sex: 'F', country: 'Spain', weightClass: '76', division: 'Open', bestDots: 509.12, bestTotal: 542.5, competitions: 3, imageUrl: null },
  { id: '16', name: 'Laura Fernández Díaz', slug: 'laura-fernandez', sex: 'F', country: 'Spain', weightClass: '57', division: 'Open', bestDots: 495.33, bestTotal: 385.0, competitions: 12, imageUrl: null },
  { id: '17', name: 'Elena Morales Vega', slug: 'elena-morales', sex: 'F', country: 'Spain', weightClass: '63', division: 'Juniors', bestDots: 482.68, bestTotal: 410.0, competitions: 6, imageUrl: null },
  { id: '18', name: 'Ana García Torres', slug: 'ana-garcia', sex: 'F', country: 'Spain', weightClass: '52', division: 'Open', bestDots: 471.20, bestTotal: 340.0, competitions: 9, imageUrl: null },
  { id: '19', name: 'Roberto Díaz Navarro', slug: 'roberto-diaz', sex: 'M', country: 'Spain', weightClass: '83', division: 'Masters 1', bestDots: 462.15, bestTotal: 580.0, competitions: 13, imageUrl: null },
  { id: '20', name: 'Marta Ruiz Gómez', slug: 'marta-ruiz', sex: 'F', country: 'Spain', weightClass: '69', division: 'Open', bestDots: 458.44, bestTotal: 420.0, competitions: 5, imageUrl: null },
];

// --- Athlete result history (for detail view) ---
export const athleteHistory = {
  '1': [
    { date: '2019-03-15', competition: 'Campeonato Nacional AEP', squat: 195, bench: 120, deadlift: 250, total: 565.0, dots: 488.12, bodyweight: 73.5, place: '3', weightClass: '74' },
    { date: '2019-11-22', competition: 'Copa de España', squat: 200, bench: 125, deadlift: 255, total: 580.0, dots: 501.45, bodyweight: 73.8, place: '2', weightClass: '74' },
    { date: '2020-10-10', competition: 'Campeonato Autonómico Madrid', squat: 207.5, bench: 127.5, deadlift: 260, total: 595.0, dots: 514.88, bodyweight: 73.2, place: '1', weightClass: '74' },
    { date: '2021-04-17', competition: 'Campeonato Nacional AEP', squat: 210, bench: 130, deadlift: 262.5, total: 602.5, dots: 520.33, bodyweight: 73.6, place: '2', weightClass: '74' },
    { date: '2021-11-06', competition: 'EPF European Classic', squat: 215, bench: 132.5, deadlift: 267.5, total: 615.0, dots: 531.72, bodyweight: 73.4, place: '5', weightClass: '74' },
    { date: '2022-05-21', competition: 'Copa de España', squat: 217.5, bench: 135, deadlift: 270, total: 622.5, dots: 537.18, bodyweight: 73.7, place: '1', weightClass: '74' },
    { date: '2022-11-19', competition: 'Campeonato Nacional AEP', squat: 220, bench: 135, deadlift: 272.5, total: 627.5, dots: 541.52, bodyweight: 73.5, place: '1', weightClass: '74' },
    { date: '2023-06-10', competition: 'EPF European Classic', squat: 222.5, bench: 137.5, deadlift: 275, total: 635.0, dots: 544.87, bodyweight: 74.0, place: '4', weightClass: '74' },
    { date: '2023-11-25', competition: 'Campeonato Nacional AEP', squat: 225, bench: 137.5, deadlift: 280, total: 642.5, dots: 546.94, bodyweight: 73.8, place: '1', weightClass: '74' },
    { date: '2024-03-16', competition: 'Copa de España', squat: 222.5, bench: 140, deadlift: 277.5, total: 640.0, dots: 545.21, bodyweight: 74.1, place: '1', weightClass: '74' },
  ],
  '11': [
    { date: '2021-05-15', competition: 'Campeonato Autonómico Andalucía', squat: 140, bench: 72.5, deadlift: 170, total: 382.5, dots: 478.11, bodyweight: 62.1, place: '1', weightClass: '63' },
    { date: '2021-11-20', competition: 'Campeonato Nacional AEP', squat: 150, bench: 77.5, deadlift: 180, total: 407.5, dots: 509.38, bodyweight: 62.5, place: '2', weightClass: '63' },
    { date: '2022-06-11', competition: 'Copa de España', squat: 157.5, bench: 80, deadlift: 185, total: 422.5, dots: 528.12, bodyweight: 62.3, place: '1', weightClass: '63' },
    { date: '2022-11-26', competition: 'Campeonato Nacional AEP', squat: 160, bench: 82.5, deadlift: 190, total: 432.5, dots: 540.63, bodyweight: 62.0, place: '1', weightClass: '63' },
    { date: '2023-04-22', competition: 'EPF European Classic', squat: 162.5, bench: 82.5, deadlift: 192.5, total: 437.5, dots: 546.88, bodyweight: 62.4, place: '6', weightClass: '63' },
    { date: '2023-11-18', competition: 'Campeonato Nacional AEP', squat: 165, bench: 85, deadlift: 195, total: 445.0, dots: 548.45, bodyweight: 63.0, place: '1', weightClass: '63' },
    { date: '2024-05-11', competition: 'Copa de España', squat: 167.5, bench: 85, deadlift: 197.5, total: 450.0, dots: 550.11, bodyweight: 62.8, place: '1', weightClass: '63' },
    { date: '2024-10-19', competition: 'EPF European Classic', squat: 170, bench: 87.5, deadlift: 200, total: 457.5, dots: 551.87, bodyweight: 63.1, place: '4', weightClass: '63' },
    { date: '2025-03-22', competition: 'Campeonato Nacional AEP', squat: 170, bench: 87.5, deadlift: 202.5, total: 460.0, dots: 551.22, bodyweight: 63.5, place: '2', weightClass: '63' },
    { date: '2025-11-15', competition: 'Copa de España', squat: 172.5, bench: 90, deadlift: 205, total: 467.5, dots: 552.22, bodyweight: 62.9, place: '1', weightClass: '63' },
  ],
};

// --- Competitions ---
export const competitions = [
  { id: 'c1', name: 'Campeonato Nacional AEP 2025', date: '2025-11-15', federation: 'AEP', country: 'Spain', state: 'Madrid', town: 'Madrid', status: 'completed', participants: 245, weightClasses: 14 },
  { id: 'c2', name: 'Copa de España 2025', date: '2025-06-14', federation: 'AEP', country: 'Spain', state: 'Cataluña', town: 'Barcelona', status: 'completed', participants: 198, weightClasses: 14 },
  { id: 'c3', name: 'Campeonato Autonómico Madrid', date: '2025-09-20', federation: 'AEP', country: 'Spain', state: 'Madrid', town: 'Alcorcón', status: 'completed', participants: 87, weightClasses: 14 },
  { id: 'c4', name: 'Campeonato Autonómico Cataluña', date: '2025-05-17', federation: 'AEP', country: 'Spain', state: 'Cataluña', town: 'Sabadell', status: 'completed', participants: 112, weightClasses: 14 },
  { id: 'c5', name: 'Campeonato Autonómico Andalucía', date: '2025-04-12', federation: 'AEP', country: 'Spain', state: 'Andalucía', town: 'Sevilla', status: 'completed', participants: 95, weightClasses: 14 },
  { id: 'c6', name: 'Copa Vasca', date: '2025-03-08', federation: 'AEP', country: 'Spain', state: 'País Vasco', town: 'Bilbao', status: 'completed', participants: 64, weightClasses: 12 },
  { id: 'c7', name: 'Campeonato Autonómico Valencia', date: '2025-07-19', federation: 'AEP', country: 'Spain', state: 'C. Valenciana', town: 'Valencia', status: 'completed', participants: 88, weightClasses: 14 },
  { id: 'c8', name: 'Campeonato Autonómico Galicia', date: '2025-08-23', federation: 'AEP', country: 'Spain', state: 'Galicia', town: 'Vigo', status: 'completed', participants: 52, weightClasses: 10 },
  { id: 'c9', name: 'EPF European Classic Championships', date: '2025-06-02', federation: 'EPF', country: 'Finland', state: null, town: 'Helsinki', status: 'completed', participants: 580, weightClasses: 14 },
  { id: 'c10', name: 'IPF World Classic Championships', date: '2025-10-15', federation: 'IPF', country: 'South Africa', state: null, town: 'Cape Town', status: 'completed', participants: 820, weightClasses: 14 },
  { id: 'c11', name: 'Campeonato Nacional AEP 2026', date: '2026-03-22', federation: 'AEP', country: 'Spain', state: 'Madrid', town: 'Madrid', status: 'upcoming', participants: null, weightClasses: 14 },
  { id: 'c12', name: 'Copa de España 2026', date: '2026-06-20', federation: 'AEP', country: 'Spain', state: 'Andalucía', town: 'Málaga', status: 'upcoming', participants: null, weightClasses: 14 },
  { id: 'c13', name: 'Campeonato Autonómico Canarias', date: '2026-04-18', federation: 'AEP', country: 'Spain', state: 'Canarias', town: 'Las Palmas', status: 'upcoming', participants: null, weightClasses: 12 },
  { id: 'c14', name: 'EPF European Classic 2026', date: '2026-06-01', federation: 'EPF', country: 'Sweden', state: null, town: 'Malmö', status: 'upcoming', participants: null, weightClasses: 14 },
  { id: 'c15', name: 'Campeonato Autonómico Aragón', date: '2025-10-04', federation: 'AEP', country: 'Spain', state: 'Aragón', town: 'Zaragoza', status: 'completed', participants: 41, weightClasses: 10 },
];

// --- Growth Trends (Spain by year) ---
export const growthTrends = [
  { year: 2015, athletes: 221, results: 309, competitions: 18 },
  { year: 2016, athletes: 328, results: 531, competitions: 19 },
  { year: 2017, athletes: 362, results: 637, competitions: 16 },
  { year: 2018, athletes: 474, results: 771, competitions: 19 },
  { year: 2019, athletes: 612, results: 918, competitions: 18 },
  { year: 2020, athletes: 288, results: 288, competitions: 7 },
  { year: 2021, athletes: 642, results: 929, competitions: 17 },
  { year: 2022, athletes: 1089, results: 1458, competitions: 24 },
  { year: 2023, athletes: 1691, results: 2226, competitions: 28 },
  { year: 2024, athletes: 1583, results: 2159, competitions: 39 },
  { year: 2025, athletes: 2440, results: 3572, competitions: 57 },
];

// --- Weight Class Distribution ---
export const weightClassDistribution = {
  M: [
    { weightClass: '59', count: 181 },
    { weightClass: '66', count: 810 },
    { weightClass: '74', count: 1873 },
    { weightClass: '83', count: 2835 },
    { weightClass: '93', count: 2241 },
    { weightClass: '105', count: 1349 },
    { weightClass: '120', count: 526 },
    { weightClass: '120+', count: 398 },
  ],
  F: [
    { weightClass: '47', count: 172 },
    { weightClass: '52', count: 476 },
    { weightClass: '57', count: 782 },
    { weightClass: '63', count: 1005 },
    { weightClass: '69', count: 621 },
    { weightClass: '76', count: 409 },
    { weightClass: '84', count: 232 },
    { weightClass: '84+', count: 147 },
  ],
};

// --- Retention Distribution ---
export const retentionDistribution = [
  { competitions: '1', athletes: 3062, pct: 50.5 },
  { competitions: '2', athletes: 1305, pct: 21.5 },
  { competitions: '3', athletes: 663, pct: 10.9 },
  { competitions: '4-5', athletes: 577, pct: 9.5 },
  { competitions: '6-10', athletes: 360, pct: 5.9 },
  { competitions: '11+', athletes: 94, pct: 1.6 },
];

// --- Retention Year over Year ---
export const retentionByYear = [
  { year: 2017, rate: 38.2 },
  { year: 2018, rate: 41.5 },
  { year: 2019, rate: 44.8 },
  { year: 2020, rate: 22.1 },
  { year: 2021, rate: 39.7 },
  { year: 2022, rate: 46.3 },
  { year: 2023, rate: 49.1 },
  { year: 2024, rate: 51.8 },
  { year: 2025, rate: 53.2 },
];

// --- Gender Parity Trend ---
export const genderParityTrend = [
  { year: 2015, femalePct: 18.5 },
  { year: 2016, femalePct: 19.2 },
  { year: 2017, femalePct: 20.8 },
  { year: 2018, femalePct: 22.1 },
  { year: 2019, femalePct: 23.5 },
  { year: 2020, femalePct: 25.0 },
  { year: 2021, femalePct: 25.8 },
  { year: 2022, femalePct: 26.4 },
  { year: 2023, femalePct: 27.0 },
  { year: 2024, femalePct: 27.2 },
  { year: 2025, femalePct: 28.8 },
];

// --- Regional Data (by Comunidad Autónoma) ---
export const regionalData = [
  { region: 'Madrid', athletes: 820, competitions: 14, growth: 72 },
  { region: 'Cataluña', athletes: 685, competitions: 11, growth: 58 },
  { region: 'Andalucía', athletes: 520, competitions: 9, growth: 85 },
  { region: 'C. Valenciana', athletes: 380, competitions: 7, growth: 64 },
  { region: 'País Vasco', athletes: 295, competitions: 6, growth: 45 },
  { region: 'Galicia', athletes: 210, competitions: 4, growth: 92 },
  { region: 'Castilla y León', athletes: 165, competitions: 3, growth: 38 },
  { region: 'Aragón', athletes: 140, competitions: 3, growth: 55 },
  { region: 'Canarias', athletes: 115, competitions: 2, growth: 120 },
  { region: 'Murcia', athletes: 95, competitions: 2, growth: 78 },
  { region: 'Asturias', athletes: 72, competitions: 1, growth: 34 },
  { region: 'Extremadura', athletes: 48, competitions: 1, growth: 110 },
];

// --- Pipeline (age class funnel) ---
export const pipelineData = [
  { stage: 'Sub-Junior (16-17)', athletes: 285, pct: 100 },
  { stage: 'Sub-Junior (18-19)', athletes: 412, pct: 100 },
  { stage: 'Junior (20-23)', athletes: 680, pct: 72 },
  { stage: 'Open (24-34)', athletes: 1850, pct: 54 },
  { stage: 'Masters 1 (40-44)', athletes: 320, pct: 38 },
  { stage: 'Masters 2 (50-54)', athletes: 145, pct: 22 },
  { stage: 'Masters 3 (60+)', athletes: 62, pct: 12 },
];

// --- Division Distribution ---
export const divisionDistribution = [
  { division: 'Open', equipment: 'Raw', count: 6887 },
  { division: 'SNR', equipment: 'Raw', count: 2769 },
  { division: 'JUN', equipment: 'Raw', count: 2160 },
  { division: 'SBJ', equipment: 'Raw', count: 774 },
  { division: 'M1', equipment: 'Raw', count: 394 },
  { division: 'M2', equipment: 'Raw', count: 193 },
  { division: 'M3', equipment: 'Raw', count: 67 },
  { division: 'Open', equipment: 'Single-ply', count: 220 },
];

// --- Platform Stats ---
export const platformStats = {
  dataFreshness: 18, // hours since last sync
  totalAthletes: 6065,
  totalResults: 14284,
  totalCompetitions: 242,
  avgResultsPerAthlete: 2.4,
  athletesWithImage: 342,
  athletesWithImagePct: 5.6,
  coveredCompetitions: 242,
  totalAEPCompetitions: 268,
  coveragePct: 90.3,
  etlLogs: [
    { date: '2026-03-19', scraper: 'openpowerlifting', rows: 658, status: 'success', duration: '4m 12s' },
    { date: '2026-03-12', scraper: 'openpowerlifting', rows: 1204, status: 'success', duration: '6m 45s' },
    { date: '2026-03-05', scraper: 'openpowerlifting', rows: 892, status: 'success', duration: '5m 18s' },
    { date: '2026-02-26', scraper: 'openpowerlifting', rows: 1560, status: 'success', duration: '7m 02s' },
    { date: '2026-02-19', scraper: 'openpowerlifting', rows: 445, status: 'success', duration: '3m 33s' },
    { date: '2026-02-12', scraper: 'aep-scraper', rows: 0, status: 'error', duration: '0m 45s', error: 'Connection timeout' },
    { date: '2026-02-05', scraper: 'openpowerlifting', rows: 2103, status: 'success', duration: '8m 11s' },
  ],
  dbGrowth: [
    { month: '2025-01', cumulative: 8200 },
    { month: '2025-02', cumulative: 8650 },
    { month: '2025-03', cumulative: 9100 },
    { month: '2025-04', cumulative: 9480 },
    { month: '2025-05', cumulative: 9920 },
    { month: '2025-06', cumulative: 10450 },
    { month: '2025-07', cumulative: 10890 },
    { month: '2025-08', cumulative: 11320 },
    { month: '2025-09', cumulative: 11780 },
    { month: '2025-10', cumulative: 12340 },
    { month: '2025-11', cumulative: 12950 },
    { month: '2025-12', cumulative: 13480 },
    { month: '2026-01', cumulative: 13720 },
    { month: '2026-02', cumulative: 13980 },
    { month: '2026-03', cumulative: 14284 },
  ],
};

// --- Competitiveness by category (DOTS range in top 10) ---
export const competitivenessByCategory = [
  { category: '-59 M', minDots: 380, maxDots: 485, avgDots: 432 },
  { category: '-66 M', minDots: 395, maxDots: 498, avgDots: 445 },
  { category: '-74 M', minDots: 420, maxDots: 547, avgDots: 488 },
  { category: '-83 M', minDots: 430, maxDots: 530, avgDots: 478 },
  { category: '-93 M', minDots: 415, maxDots: 538, avgDots: 472 },
  { category: '-105 M', minDots: 400, maxDots: 535, avgDots: 465 },
  { category: '-120 M', minDots: 385, maxDots: 510, avgDots: 445 },
  { category: '+120 M', minDots: 370, maxDots: 538, avgDots: 448 },
  { category: '-47 F', minDots: 340, maxDots: 445, avgDots: 388 },
  { category: '-52 F', minDots: 355, maxDots: 472, avgDots: 412 },
  { category: '-57 F', minDots: 370, maxDots: 498, avgDots: 435 },
  { category: '-63 F', minDots: 390, maxDots: 552, avgDots: 468 },
  { category: '-69 F', minDots: 375, maxDots: 510, avgDots: 448 },
  { category: '-76 F', minDots: 380, maxDots: 522, avgDots: 452 },
  { category: '-84 F', minDots: 365, maxDots: 550, avgDots: 445 },
  { category: '+84 F', minDots: 345, maxDots: 495, avgDots: 415 },
];

// --- At-risk athletes (no competition in last 18 months) ---
export const atRiskAthletes = [
  { name: 'Miguel Ángel Torres', sex: 'M', lastComp: '2024-06-15', totalComps: 8, bestDots: 445.22, weightClass: '93' },
  { name: 'Patricia Gómez', sex: 'F', lastComp: '2024-05-20', totalComps: 5, bestDots: 412.88, weightClass: '57' },
  { name: 'Fernando López Ríos', sex: 'M', lastComp: '2024-04-12', totalComps: 12, bestDots: 478.33, weightClass: '83' },
  { name: 'Cristina Herrera', sex: 'F', lastComp: '2024-03-08', totalComps: 3, bestDots: 398.55, weightClass: '69' },
  { name: 'Sergio Blanco Ruiz', sex: 'M', lastComp: '2024-02-17', totalComps: 6, bestDots: 425.10, weightClass: '105' },
  { name: 'Lucía Martín Soto', sex: 'F', lastComp: '2024-01-20', totalComps: 4, bestDots: 388.92, weightClass: '63' },
  { name: 'Raúl Jiménez Castro', sex: 'M', lastComp: '2023-12-09', totalComps: 7, bestDots: 455.67, weightClass: '74' },
  { name: 'Carmen Navarro', sex: 'F', lastComp: '2023-11-18', totalComps: 2, bestDots: 365.43, weightClass: '52' },
];

// --- Summary stats ---
export const summaryStats = {
  totalAthletes: 6065,
  maleAthletes: 4418,
  femaleAthletes: 1647,
  totalResults: 14284,
  totalCompetitions: 242,
  avgTotal: 465.8,
  avgDots: 351.3,
  growthYoY: 65.4,
  retentionRate: 49.5,
  churnRate: 50.5,
  avgCompsPerAthlete: 2.4,
  bestDotsM: 546.94,
  bestDotsF: 552.22,
  competitionsYTD2025: 57,
  athletesYTD2025: 2440,
};
