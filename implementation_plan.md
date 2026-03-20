# 🏋️ Plan de Auditoría Analítica — RackAI Powerlifting

Plan exhaustivo para sacar el máximo partido a los datos de Powerlifting, basado en la auditoría completa del sistema actual.

---

## 📊 Estado Actual (Auditoría)

| Capa | Detalle |
|---|---|
| **Datos brutos** | ~780 MB CSVs OpenPowerlifting + Calendario AEP 2026 |
| **MongoDB** | Colecciones [results](file:///e:/RackAI/app/server/src/use_cases/mongo_to_postgresql.py#36-52), [competitions](file:///e:/RackAI/app/server/main.py#307-314), [athletes_profiles](file:///e:/RackAI/app/server/main.py#321-326), `federations`, `records` |
| **PostgreSQL (Supabase)** | Star schema: `dim_athlete`, `dim_competition`, `fact_results`, `kpi_dashboard_athletes`, `etl_sync_logs` |
| **Backend** | FastAPI con 11 endpoints activos, [DashboardAnalytics](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#6-1321) (Mongo) + [HomeRepository](file:///e:/RackAI/app/server/src/infrastructure/repositories/home_repository.py#9-713) (Postgres) |
| **Frontend** | React + ECharts, 2 páginas (`/` Home, `/atletas`), 6 cards, 2 stats components |

### Funcionalidades Existentes
- ✅ KPI: Atletas activos YTD con sparkline
- ✅ KPI: Promedio atletas por competición
- ✅ Highlight Card: Top mensual por disciplina (SQ/BP/DL/Total/GL)
- ✅ Ranking Histórico (Leaderboard por GL/Dots/Wilks)
- ✅ Próximas Competiciones (scraping + calendario)
- ✅ Evolución de Récords por categoría de peso (solo en [DashboardAnalytics](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#6-1321), **no integrado en frontend**)
- ✅ Página de Atletas con filtros y paginación

### Funcionalidades Backend NO Expuestas al Frontend
- ⚠️ [get_market_trends()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#195-230) — Tendencias de federaciones
- ⚠️ [get_equipment_trends()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#231-263) — Raw vs Equipado
- ⚠️ [get_strength_benchmarks()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#268-317) — Media vs Top 10% vs Récord
- ⚠️ [get_peak_age_curve()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#318-345) — Edad pico de rendimiento
- ⚠️ [get_avg_yearly_progress()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#346-398) — Progresión de novatos
- ⚠️ [get_geo_hotspots()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#403-437) — Mapa de potencias
- ⚠️ [get_dq_rates()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#438-484) — Tasa de descalificación
- ⚠️ [get_athlete_retention_rate()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#485-503) — Fidelización
- ⚠️ [get_lift_ratios()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#508-554) — Proporción áurea SQ/BP/DL
- ⚠️ [get_federation_performance_index()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#555-593) — Índice de rendimiento por federación
- ⚠️ [get_weight_efficiency_scatter()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#594-627) — Peso corporal vs DOTS
- ⚠️ [get_country_champions()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#866-921) — Campeones por país
- ⚠️ [get_top10_by_country()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#922-972) — Top 10 por país

---

## 🎯 Plan de Implementación (3 Fases)

---

### FASE 1 — Nuevas Vistas PostgreSQL (Golden Layer)

Crear vistas materializadas/SQL Views en Supabase para tener KPIs pre-calculados y rápidos.

#### [NEW] Vista `v_gender_growth_trend`
> **Insight**: ¿Cómo evoluciona la ratio hombre/mujer en el Powerlifting español?

```sql
-- Atletas únicos por año y sexo
SELECT year, sex, COUNT(DISTINCT athlete_id), porcentaje_femenino
```
**KPI derivado**: % Crecimiento femenino YoY, Ratio M/F actual

---

#### [NEW] Vista `v_weight_class_popularity`
> **Insight**: ¿Qué categorías de peso concentran más competidores? ¿Cuáles están sobrepobladas?

```sql
-- Distribución de atletas por weight_class y sexo (últimos 3 años)
```
**KPI derivado**: Categoría más popular, Categoría con más crecimiento

---

#### [NEW] Vista `v_athlete_career_stats`
> **Insight**: Perfil completo de carrera de cada atleta (para página de detalle)

```sql
-- Primer meet, último meet, total competiciones, mejor total, mejor GL,
-- progresión (total primer meet vs último), años activo, streak actual
```

---

#### [NEW] Vista `v_competition_quality_index`
> **Insight**: ¿Qué competiciones atraen a los mejores atletas? Índice de calidad

```sql
-- Por competición: num_atletas, avg_GL, max_GL, % DQ, diversidad de categorías
```

---

#### [NEW] Vista `v_seasonal_patterns`
> **Insight**: ¿En qué meses se compite más? ¿Hay estacionalidad?

```sql
-- Distribución mensual de competiciones y atletas (heatmap de calendario)
```

---

#### [NEW] Vista `v_newcomer_funnel`
> **Insight**: ¿Cuántos novatos vuelven a competir? Funnel de retención

```sql
-- Año de debut, % que compite 2ª vez, 3ª vez, etc.
```
**KPI derivado**: Tasa de retención a 1 año, tasa de abandono

---

#### [NEW] Vista `v_records_timeline`
> **Insight**: ¿Cuándo se batieron los récords nacionales? ¿Se van rompiendo más rápido?

```sql
-- Fecha de cada récord, categoría, anterior poseedor vs nuevo, delta
```

---

### FASE 2 — Nuevas Páginas Frontend

---

#### [NEW] Página `/analytics` — Dashboard Analítico Premium

Dashboard tipo "modo auditoría" con gráficos interactivos para cada insight. Layout con grid de cards tipo Notion Analytics.

| Componente | Tipo de gráfico | Datos |
|---|---|---|
| **Crecimiento por Género** | Áreas apiladas (ECharts) | `v_gender_growth_trend` |
| **Distribución de Categorías** | Treemap o Barras horizontales | `v_weight_class_popularity` |
| **Estacionalidad** | Heatmap de calendario | `v_seasonal_patterns` |
| **Proporción Áurea** | Donut chart con comparador | [get_lift_ratios()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#508-554) |
| **Edad Pico** | Curva de campana | [get_peak_age_curve()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#318-345) |
| **Raw vs Equipado** | Áreas apiladas con % | [get_equipment_trends()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#231-263) |
| **Funnel de Retención** | Funnel chart | `v_newcomer_funnel` |
| **Índice de Federaciones** | Radar chart o ranking | [get_federation_performance_index()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#555-593) |
| **Tasa de DQ** | Barras horizontales | [get_dq_rates()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#438-484) |
| **Eficiencia por Peso** | Scatter plot | [get_weight_efficiency_scatter()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#594-627) |

---

#### [NEW] Página `/atleta/:id` — Perfil de Atleta Individual

Página de detalle con:

| Sección | Contenido |
|---|---|
| **Hero Card** | Foto, nombre, país, categoría, años activo, total comps |
| **Personal Records** | Tarjetas para SQ/BP/DL/Total/GL con fecha y comp |
| **Historial de Competiciones** | Tabla cronológica con todas las actuaciones |
| **Gráfico de Evolución** | Línea temporal del Total y GL a lo largo de la carrera |
| **Radar de Fortalezas** | SQ/BP/DL ratios vs media de la categoría |
| **Posición en Rankings** | Percentil dentro de su categoría de peso |

---

#### [NEW] Página `/competiciones` — Explorador de Competiciones

| Sección | Contenido |
|---|---|
| **Calendario** | Vista calendario con próximas competiciones |
| **Histórico** | Tabla filtrable por año, federación, ubicación |
| **Detalle** | Click para ver resultados completos de una comp |
| **Índice de Calidad** | Badge/score calculado desde `v_competition_quality_index` |

---

### FASE 3 — Nuevos KPIs y Endpoints API

---

#### Nuevos Endpoints FastAPI

| Endpoint | Método | Descripción |
|---|---|---|
| `/analytics/gender-growth` | GET | Crecimiento por género YoY |
| `/analytics/weight-class-distribution` | GET | Distribución por categorías |
| `/analytics/seasonal-heatmap` | GET | Estacionalidad mensual |
| `/analytics/lift-ratios` | GET | Proporción SQ/BP/DL |
| `/analytics/peak-age` | GET | Curva de edad pico |
| `/analytics/equipment-trends` | GET | Raw vs Equipado |
| `/analytics/retention-funnel` | GET | Funnel de novatos |
| `/analytics/federation-index` | GET | Índice de rendimiento por fed |
| `/analytics/dq-rates` | GET | Tasas de descalificación |
| `/analytics/efficiency-scatter` | GET | Peso vs eficiencia |
| `/athlete/:id/career` | GET | Perfil de carrera completo |
| `/athlete/:id/evolution` | GET | Evolución temporal de marcas |
| `/competitions/calendar` | GET | Calendario de competiciones |
| `/competitions/:slug/results` | GET | Resultados de una competición |

---

#### Nuevos KPIs para Home (Cards Adicionales)

| KPI | Descripción | Objetivo |
|---|---|---|
| **Nuevos Atletas este Año** | Debut en competición | Medir crecimiento real |
| **Récords Rotos YTD** | Récords nacionales batidos | Engagement |
| **% Crecimiento Femenino** | Ratio F del año vs anterior | Inclusividad |
| **Tasa de Retención** | % atletas que repiten | Salud del deporte |
| **Competidor Más Activo** | Atleta con más meets YTD | Gamificación |

---

## User Review Required

> [!IMPORTANT]
> **Priorización**: ¿Qué fase quieres atacar primero? Recomiendo empezar con **Fase 1** (vistas SQL) + los endpoints de la Fase 3 para los 13 análisis ya programados en [dashboard_analytics.py](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py) que NO están expuestos al frontend.

> [!WARNING]
> **Decisión clave**: Las queries de [DashboardAnalytics](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#6-1321) usan **MongoDB directo**. ¿Prefieres:
> 1. **Migrarlas a PostgreSQL** (más rápido, joins pre-calculados, vistas materializadas) — Recomendado
> 2. **Mantener MongoDB** y crear endpoints que las expongan tal cual
> 3. **Híbrido**: Exponer las de Mongo como están + nuevas en Postgres

> [!IMPORTANT]
> **Página de Atleta Individual**: Para la evolución temporal necesitamos acceso a TODO el historial de un atleta (ya está en `fact_results`). ¿Quieres esta página con ruta dinámica `/atleta/:slug`?

> [!NOTE]
> **Datos disponibles**: La tabla `fact_results` contiene: `squat`, [bench](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#268-317), `deadlift`, [total](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#84-148), `bodyweight`, [age](file:///e:/RackAI/app/client/src/pages/Athletes.jsx#121-130), `dots`, `wilks`, `goodlift`, `glossbrenner`, [equipment](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#231-263), `event_type`, `tested`, `weight_class`, `division`, `age_class`, `place`. Esto es **extremadamente rico** y permite todos los análisis propuestos sin necesidad de datos externos.

---

## Verification Plan

### Visual / Manual
- Abrir cada nueva página y verificar que los gráficos cargan correctamente
- Comprobar responsividad en móvil (Chrome DevTools)
- Verificar que los filtros interactivos (sexo, categoría, año) funcionan
- Cross-check KPIs numéricos con queries directas a PostgreSQL

### Automated
- Test de cada nuevo endpoint API con `curl` o Postman para validar respuesta 200 y estructura JSON
- Validar que las vistas SQL devuelven datos razonables (no vacíos, no negativos donde no deben)
- Comprobar que las vistas materializadas se actualizan correctamente tras nueva ingestión
