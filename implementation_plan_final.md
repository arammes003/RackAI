# 🏋️ RackAI — Plan de Implementación Definitivo

## Filosofía de Diseño
- **Home limpia**: KPIs compactos + protagonismo a los atletas. Nada denso.
- **Analytics separado**: Todos los gráficos complejos van a `/analytics`.
- **Atleta individual**: Perfil con evolución y contexto en `/atleta/:slug`.

---

## FASE 1 — Rediseño del Home

### Layout aprobado

```
┌──────────────────────────────────────────────────────┐
│ [Atletas YTD] [Comps YTD] [% Femenino] [Retención]  │  ← 4 KPIs compactos
├──────────────────────────────────────────────────────┤
│ ★ DESTACADOS DEL MES                                 │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ...     │  ← Cards de atleta
│ │  Foto  │ │  Foto  │ │  Foto  │ │  Foto  │         │     individuales
│ │ 280 SQ │ │ 127 GL │ │ 210 DL │ │ 730 T  │         │
│ └────────┘ └────────┘ └────────┘ └────────┘         │
├──────────────────────────────────────────────────────┤
│ [Leaderboard Top 10]          [Próximas Comps]       │
└──────────────────────────────────────────────────────┘
```

### Tareas Home

#### 1.1 — Nuevo KPI: Competiciones YTD
- **Backend**: Nuevo endpoint `GET /analytics/competitions-ytd` 
- Query: contar competiciones YTD actual vs mismo periodo año anterior
- **Frontend**: Nueva card `CompetitionsYtdCard.jsx` usando [StatCard](file:///e:/RackAI/app/client/src/components/cards/StatCard.jsx#5-84) con barras violeta
- **Esfuerzo**: ⚡ Bajo (endpoint similar ya existe)

#### 1.2 — Nuevo KPI: % Participación Femenina
- **Backend**: Nuevo endpoint `GET /analytics/gender-ratio`
- Query: `COUNT(DISTINCT athlete_id) WHERE sex='F'` / total, YTD actual vs anterior
- Retorna: `{ current_pct, prev_pct, history: [{year, pct}] }`
- **Frontend**: Nueva card `GenderRatioCard.jsx` usando [StatCard](file:///e:/RackAI/app/client/src/components/cards/StatCard.jsx#5-84) con línea rosa
- **Esfuerzo**: 🟡 Medio

#### 1.3 — Nuevo KPI: Tasa de Retención
- **Backend**: Nuevo endpoint `GET /analytics/retention-rate`
- Query: % de atletas del año anterior que han competido este año
- Retorna: `{ current_rate, prev_rate, history: [{year, rate}] }`
- **Frontend**: Nueva card `RetentionCard.jsx` usando [StatCard](file:///e:/RackAI/app/client/src/components/cards/StatCard.jsx#5-84) con gauge verde
- **Esfuerzo**: 🟡 Medio

#### 1.4 — Rediseño Highlight Card → Cards Individuales de Atleta
- **Cambio**: Eliminar carrusel rotativo. Convertir en **grid de cards individuales** con foto, nombre, marca, disciplina y categoría
- **Backend**: Mismo endpoint `monthly-top5-general` (ya devuelve foto)
- **Frontend**: Nuevo componente `MonthlyHighlightsGrid.jsx`, cards tipo perfil
- **Esfuerzo**: 🟡 Medio (solo frontend)

#### 1.5 — Layout CSS: 4 columnas fila superior
- Cambiar `.stats-grid` para soportar 4 KPIs en primera fila
- Zona de highlights ocupa `grid-column: span 4` (o el ancho completo)
- Leaderboard + Upcoming en fila inferior
- **Esfuerzo**: ⚡ Bajo

---

## FASE 2 — Nueva Página `/analytics`

Aquí van **todos los gráficos complejos y análisis densos**, lejos de la Home.

### Layout

```
┌──────────────────────────────────────────────────────┐
│ ANALÍTICA DEL POWERLIFTING ESPAÑOL                   │
├──────────────────────────────────────────────────────┤
│ [═══ Evolución de Récords por Categoría (líneas) ══] │  ← EvolutionChart
├──────────────────────────────────────────────────────┤
│ [Crecimiento Histórico]  [Raw vs Equipado]           │  ← Áreas/líneas
├──────────────────────────────────────────────────────┤
│ [Curva Edad Pico]        [Proporción SQ/BP/DL]       │  ← Campana + Donut
├──────────────────────────────────────────────────────┤
│ [Eficiencia Peso vs GL]  [Tasa DQ por Federación]    │  ← Scatter + Barras
├──────────────────────────────────────────────────────┤
│ [Funnel Retención]       [Índice de Federaciones]    │  ← Funnel + Radar
└──────────────────────────────────────────────────────┘
```

### Tareas Analytics

#### 2.1 — Crear página y ruta
- **Frontend**: `pages/Analytics.jsx`, ruta `/analytics` en [App.jsx](file:///e:/RackAI/app/client/src/App.jsx)
- Añadir enlace en [Sidebar.jsx](file:///e:/RackAI/app/client/src/components/Sidebar.jsx)
- **Esfuerzo**: ⚡ Bajo

#### 2.2 — Mover EvolutionChart a Analytics
- Ya existe [EvolutionChart.jsx](file:///e:/RackAI/app/client/src/components/stats/EvolutionChart.jsx) + endpoint `year-max-totals`
- Solo importar en la nueva página
- **Esfuerzo**: ⚡ Bajo

#### 2.3 — Gráfico de Crecimiento Histórico (Atletas + Comps por año)
- **Backend**: Ya existen [get_athlete_growth_stats()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#973-1012) y [get_competition_growth_stats()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#1017-1041)
- Crear endpoints: `GET /analytics/growth-athletes` y `GET /analytics/growth-competitions`
- **Frontend**: `GrowthChart.jsx` — Línea dual (atletas + comps)
- **Esfuerzo**: 🟡 Medio

#### 2.4 — Raw vs Equipado (Tendencia temporal)
- **Backend**: Ya existe [get_equipment_trends()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#231-263) → crear endpoint `GET /analytics/equipment-trends`
- **Frontend**: `EquipmentTrendsChart.jsx` — Áreas apiladas con %
- **Esfuerzo**: 🟡 Medio

#### 2.5 — Curva de Edad Pico
- **Backend**: Ya existe [get_peak_age_curve()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#318-345) → endpoint `GET /analytics/peak-age`
- **Frontend**: `PeakAgeChart.jsx` — Curva de campana (edad vs GL medio)
- **Esfuerzo**: 🟡 Medio

#### 2.6 — Proporción Áurea SQ/BP/DL
- **Backend**: Ya existe [get_lift_ratios()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#508-554) → endpoint `GET /analytics/lift-ratios`
- **Frontend**: `LiftRatiosChart.jsx` — Donut chart con comparador M vs F
- **Esfuerzo**: 🟡 Medio

#### 2.7 — Scatter: Peso Corporal vs Eficiencia (GL)
- **Backend**: Ya existe [get_weight_efficiency_scatter()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#594-627) → endpoint `GET /analytics/efficiency-scatter`
- **Frontend**: `EfficiencyScatter.jsx` — Scatter plot con tooltip
- **Esfuerzo**: 🟡 Medio

#### 2.8 — Tasa de DQ por Federación
- **Backend**: Ya existe [get_dq_rates()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#438-484) → endpoint `GET /analytics/dq-rates`
- **Frontend**: `DqRatesChart.jsx` — Barras horizontales
- **Esfuerzo**: ⚡ Bajo

#### 2.9 — Funnel de Retención de Novatos
- **Backend**: Nuevo endpoint `GET /analytics/retention-funnel`
- Query: Año debut → % que compite 2ª, 3ª, 4ª vez
- **Frontend**: `RetentionFunnel.jsx` — Barras escalonadas
- **Esfuerzo**: 🟡 Medio

#### 2.10 — Índice de Rendimiento por Federación
- **Backend**: Ya existe [get_federation_performance_index()](file:///e:/RackAI/app/server/src/infrastructure/repositories/dashboard_analytics.py#555-593) → endpoint `GET /analytics/federation-index`
- **Frontend**: `FederationIndex.jsx` — Ranking con GL medio + num atletas
- **Esfuerzo**: ⚡ Bajo

---

## FASE 3 — Página `/atleta/:slug` (Perfil Individual)

### Layout

```
┌──────────────────────────────────────────────────┐
│ [Foto]  Nombre  |  País  |  Categoría  |  Años  │  ← Hero card
├──────────────────────────────────────────────────┤
│ [PR SQ] [PR BP] [PR DL] [PR Total] [PR GL]      │  ← Records con fecha
├──────────────────────────────────────────────────┤
│ [════ Evolución del Total y GL ════════════════] │  ← Línea temporal
├──────────────────────────────────────────────────┤
│ [Radar: SQ/BP/DL vs media categoría]             │  ← Radar chart
├──────────────────────────────────────────────────┤
│ [Historial de competiciones]                     │  ← Tabla cronológica
└──────────────────────────────────────────────────┘
```

### Tareas Atleta

#### 3.1 — Backend: Career stats por atleta
- Nuevo endpoint `GET /athlete/:slug/career`
- Query a `fact_results` + `dim_athlete`: PRs, total comps, primer/último meet, progresión
- **Esfuerzo**: 🟡 Medio

#### 3.2 — Backend: Historial de resultados
- Nuevo endpoint `GET /athlete/:slug/results`
- Todos los resultados ordenados cronológicamente
- **Esfuerzo**: ⚡ Bajo

#### 3.3 — Frontend: Página de perfil
- `pages/AthleteDetail.jsx`, ruta `/atleta/:slug` en [App.jsx](file:///e:/RackAI/app/client/src/App.jsx)
- Hero card, PR cards, gráfico de evolución, radar, tabla historial
- Links desde Leaderboard y AthleteCard para navegar al perfil
- **Esfuerzo**: 🔴 Alto (componente más complejo)

---

## Resumen de Esfuerzo

| Fase | Tasks | Endpoints nuevos | Componentes nuevos | Esfuerzo |
|---|---|---|---|---|
| **F1: Home** | 5 | 3 | 4 | 🟡 Medio |
| **F2: Analytics** | 10 | 8 (6 ya existen en backend) | 9 | 🟡 Medio-Alto |
| **F3: Atleta** | 3 | 2 | 1 (grande) | 🟡 Medio |
| **Total** | **18** | **13** | **14** | — |

> [!IMPORTANT]
> **Orden recomendado**: F1 (Home) → F3 (Atleta, da visibilidad) → F2 (Analytics, más denso).
> F1 es la de mayor impacto inmediato. F3 da el protagonismo a los atletas que buscas. F2 es para el usuario avanzado.

---

## Verification Plan

### Cada nuevo endpoint
- `curl` para validar JSON correcto, 200 OK, sin campos null inesperados

### Home rediseñada
- Visual check en Chrome + Chrome DevTools responsive (375px, 768px, 1280px, 1920px)
- Verificar que los 4 KPIs cargan en paralelo sin bloqueo
- Verificar highlights con foto real vs avatar fallback

### Analytics
- Cada gráfico con filtros interactivos funcionales
- Cross-check valores numéricos con queries SQL directas

### Perfil Atleta
- Navegar desde Leaderboard → Perfil → verificar datos coherentes
- Probar con atletas con muchos meets vs atletas con 1 solo meet
