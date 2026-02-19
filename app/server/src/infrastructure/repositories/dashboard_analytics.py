from datetime import datetime, timedelta
from src.infrastructure.database import MongoDB
from typing import Dict, List


class DashboardAnalytics:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.results_col = self.db["results"]
        self.competitions_col = self.db["competitions"]

        self._cache_data = None
        self._cache_time = None
        self._cache_ttl = timedelta(minutes=60)  # Los datos se refrescan cada hora

    """ 
        ================================
        1. HOME DASHBOARDS
        ================================
    """

    def get_growth_graphs(self) -> Dict[str, List[Dict]]:
        """
        Devuelve SOLO las dos series temporales: Atletas y Competiciones.
        Tarda 0.001s si está en caché.
        """
        # 1. Si hay caché válida, devolverla y salir
        if self._cache_data and self._cache_time:
            if datetime.now() - self._cache_time < self._cache_ttl:
                return self._cache_data

        # 2. Si no, calcular (Tardará unos 2-3 segundos la primera vez)
        print("📊 Calculando gráficas históricas...")

        data = {
            "athletes": self._get_athlete_history(),
            "competitions": self._get_competition_history(),
        }

        # 3. Guardar en caché
        self._cache_data = data
        self._cache_time = datetime.now()

        return data

    def _get_athlete_history(self) -> List[Dict]:
        """Cuenta atletas únicos por año (Usando índice de results)."""
        pipeline = [
            {
                "$match": {
                    "athlete.country": {"$in": ["Spain", "España", "ESP"]},
                    "category.tested": True,
                    "competition.date": {"$ne": None},
                }
            },
            {
                "$group": {
                    "_id": {"$year": "$competition.date"},
                    "unique_ids": {"$addToSet": "$athlete.id"},
                }
            },
            {"$project": {"_id": 0, "year": "$_id", "count": {"$size": "$unique_ids"}}},
            {"$sort": {"year": 1}},
        ]
        return list(self.results_col.aggregate(pipeline))

    def _get_competition_history(self) -> List[Dict]:
        """Cuenta competiciones por año (Usando colección competitions)."""
        pipeline = [
            {
                "$match": {
                    "country": {"$in": ["Spain", "España", "ESP"]},
                    # Ajusta filtro de federación si es necesario, o quítalo si 'competitions' ya está limpia
                    "federation": {"$in": ["AEP", "EPF", "IPF"]},
                    "date": {"$ne": None},
                }
            },
            {"$group": {"_id": {"$year": "$date"}, "count": {"$sum": 1}}},
            {"$project": {"_id": 0, "year": "$_id", "count": 1}},
            {"$sort": {"year": 1}},
        ]
        return list(self.competitions_col.aggregate(pipeline))

    def get_max_total_by_year(self, sex: str, category_type: str):
        """
        Devuelve [Año, Total, NombreAtleta] del máximo levantamiento anual.
        """

        # 1. Filtros (Igual que antes)
        age_filter = {}
        if category_type == "Junior":
            age_filter = {"athlete.age": {"$gte": 19, "$lte": 23}}
        elif category_type == "Subjunior":
            age_filter = {"athlete.age": {"$gte": 14, "$lte": 18}}
        elif category_type == "Master":
            age_filter = {"athlete.age": {"$gte": 40}}

        pipeline = [
            {
                "$match": {
                    "athlete.country": {"$in": ["Spain", "España", "ESP"]},
                    "competition.federation": {"$in": ["AEP", "IPF", "EPF"]},
                    "category.equipment": "Raw",
                    "athlete.sex": sex,
                    "competition.date": {"$ne": None},
                    **age_filter,
                }
            },
            # 2. ORDENAR: Ponemos los totales más altos PRIMERO
            {"$sort": {"results.total": -1}},
            # 3. AGRUPAR: Al agrupar, cogemos el PRIMER elemento ($first),
            # que gracias al orden anterior, es el récord.
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$competition.date"},
                        "weight_class": "$category.weight_class",
                    },
                    "max_total": {"$first": "$results.total"},
                    "athlete_name": {
                        "$first": "$athlete.name"
                    },  # <--- CAPTURAMOS EL NOMBRE
                }
            },
            {"$sort": {"_id.year": 1}},
        ]

        raw_data = list(self.results_col.aggregate(pipeline))

        # 4. Formatear: Ahora enviamos una tripla: [Año, Total, Nombre]
        formatted_data = {}
        for item in raw_data:
            wc = item["_id"]["weight_class"]
            year = item["_id"]["year"]
            total = item["max_total"]
            name = item["athlete_name"]  # Nuevo campo

            if not wc:
                continue

            if wc not in formatted_data:
                formatted_data[wc] = []

            # Guardamos: [ "2024", 800.5, "Jesus Olivares" ]
            formatted_data[wc].append([str(year), total, name])

        return formatted_data

    def get_upcoming_competitions(self, limit=5):
        """Obtiene las próximas competiciones filtrando por fecha futura."""
        pipeline = [
            {
                "$match": {
                    "date": {"$gte": datetime.now()},  # Fechas mayores o iguales a hoy
                }
            },
            {
                "$sort": {"date": 1}  # Orden ascendente (la más cercana primero)
            },
            {
                "$limit": limit  # Solo las 5 primeras
            },
            {
                "$project": {  # Proyección limpia para tu Frontend
                    "_id": 0,  # Ocultar ID interno si no lo necesitas
                    "name": 1,
                    "date": 1,
                    "town": 1,
                    "federation": 1,
                    "slug": 1,
                }
            },
        ]
        return list(self.competitions_col.aggregate(pipeline))

    # ==========================================
    # 0. SCOPE FILTER
    # ==========================================

    def _get_scope_filter(self):
        """
        Global filter to restrict analysis to:
        - Spanish athletes (Country in Spain, España, ESP)
        - Specific Federations (AEP, IPF, EPF)
        """
        return {
            # "competition.federation": { "$in": ["AEP", "IPF", "EPF"] }, # REMOVED: User wants ALL federations
            "athlete.country": {"$in": ["Spain", "España", "ESP"]}
        }

    # ==========================================
    # 1. TENDENCIAS DE MERCADO Y CRECIMIENTO
    # ==========================================

    def get_market_trends(self):
        """
        Insight: ¿Qué federaciones están creciendo y cuáles muriendo?
        Gráfico: Líneas temporales (Timeline) de volumen de atletas.
        """
        pipeline = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "competition.date": {
                        "$gte": datetime(2010, 1, 1),
                        "$lte": datetime.now(),
                    },
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$competition.date"},
                        "federation": "$competition.federation",
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id.year": 1}},
            {
                "$project": {
                    "_id": 0,
                    "year": "$_id.year",
                    "federation": "$_id.federation",
                    "athletes_count": "$count",
                }
            },
        ]
        return list(self.collection.aggregate(pipeline))

    def get_equipment_trends(self):
        """
        Insight: ¿El Powerlifting Raw ha matado al Equipado?
        Gráfico: Áreas apiladas (Stacked Area) de % de participación.
        """
        pipeline = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "competition.date": {"$gte": datetime(2015, 1, 1)},
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$competition.date"},
                        "equipment": "$category.equipment",
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id.year": 1, "_id.equipment": 1}},
            {
                "$project": {
                    "_id": 0,
                    "year": "$_id.year",
                    "equipment": "$_id.equipment",
                    "count": "$count",
                }
            },
        ]
        return list(self.collection.aggregate(pipeline))

    # ==========================================
    # 2. BENCHMARKING Y FUERZA
    # ==========================================

    def get_strength_benchmarks(self, sex: str, equipment: str, weight_class: str):
        """
        Insight: ¿Soy fuerte para mi peso? (Comparativa Freemium vs Premium).
        Gráfico: Barras (Media vs Top 10% vs Récord).
        """
        pipeline = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "athlete.sex": sex,
                    "category.equipment": equipment,
                    "category.weight_class": weight_class,
                    "results.total": {"$gt": 0},
                }
            },
            {
                "$facet": {
                    "average_stats": [
                        {
                            "$group": {
                                "_id": None,
                                "avg_squat": {"$avg": "$results.squat"},
                                "avg_bench": {"$avg": "$results.bench"},
                                "avg_deadlift": {"$avg": "$results.deadlift"},
                                "avg_total": {"$avg": "$results.total"},
                                "total_lifters": {"$sum": 1},
                            }
                        }
                    ],
                    "top_tier_stats": [
                        {"$sort": {"results.total": -1}},
                        {"$limit": 100},
                        {
                            "$group": {
                                "_id": None,
                                "elite_avg_total": {"$avg": "$results.total"},
                            }
                        },
                    ],
                }
            },
            {
                "$project": {
                    "average": {"$arrayElemAt": ["$average_stats", 0]},
                    "elite": {"$arrayElemAt": ["$top_tier_stats", 0]},
                }
            },
        ]
        return list(self.collection.aggregate(pipeline))

    def get_peak_age_curve(self, sex: str, equipment: str):
        """
        Insight: ¿A qué edad se alcanza el pico físico en Powerlifting?
        Gráfico: Curva de campana (Edad vs DOTS).
        """
        pipeline = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "athlete.sex": sex,
                    "category.equipment": equipment,
                    "athlete.age": {"$gte": 14, "$lte": 70},
                    "points.goodlift": {"$gt": 0},
                }
            },
            {
                "$group": {
                    "_id": "$athlete.age",
                    "avg_strength": {"$avg": "$points.goodlift"},
                    "sample_size": {"$sum": 1},
                }
            },
            {"$match": {"sample_size": {"$gt": 50}}},
            {"$sort": {"_id": 1}},
            {"$project": {"_id": 0, "age": "$_id", "avg_dots": "$avg_strength"}},
        ]
        return list(self.collection.aggregate(pipeline))

    def get_avg_yearly_progress(self, weight_class: str):
        """
        Insight: ¿Cuánto mejora un novato en su primer año?
        Uso: Marketing para entrenadores ("Gana 20kg en tu total").
        """
        pipeline = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "category.weight_class": weight_class,
                }
            },
            {
                "$group": {
                    "_id": "$athlete.id",
                    "first_meet": {
                        "$first": {
                            "date": "$competition.date",
                            "total": "$results.total",
                        }
                    },
                    "last_meet": {
                        "$last": {
                            "date": "$competition.date",
                            "total": "$results.total",
                        }
                    },
                    "meet_count": {"$sum": 1},
                }
            },
            {"$match": {"meet_count": {"$gte": 2}}},
            {
                "$project": {
                    "days_diff": {
                        "$divide": [
                            {"$subtract": ["$last_meet.date", "$first_meet.date"]},
                            1000 * 60 * 60 * 24,
                        ]
                    },
                    "kg_gain": {"$subtract": ["$last_meet.total", "$first_meet.total"]},
                }
            },
            {"$match": {"days_diff": {"$gt": 180}}},
            {
                "$group": {
                    "_id": None,
                    "avg_kg_gained": {"$avg": "$kg_gain"},
                    "avg_days_active": {"$avg": "$days_diff"},
                }
            },
        ]
        return list(self.collection.aggregate(pipeline))

    # ==========================================
    # 3. GEOGRAFÍA Y CALIDAD
    # ==========================================

    def get_geo_hotspots(self):
        """
        Insight: ¿Qué países son las potencias mundiales?
        Gráfico: Mapa de calor o Ranking de países.
        """
        pipeline = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "competition.country": {"$ne": None},
                }
            },
            {
                "$group": {
                    "_id": "$competition.country",
                    "total_events": {"$addToSet": "$competition.id"},
                    "total_athletes": {"$sum": 1},
                    "avg_dots": {"$avg": "$points.goodlift"},
                }
            },
            {"$match": {"total_athletes": {"$gt": 50}}},
            {
                "$project": {
                    "_id": 0,
                    "country": "$_id",
                    "events_count": {"$size": "$total_events"},
                    "athletes_count": "$total_athletes",
                    "performance_index": {"$round": ["$avg_dots", 2]},
                }
            },
            {"$sort": {"athletes_count": -1}},
            {"$limit": 20},
        ]
        return list(self.collection.aggregate(pipeline))

    def get_dq_rates(self):
        """
        Insight: ¿Qué federaciones son más estrictas ("Jueces rojos")?
        Gráfico: Barras horizontales de % Descalificados.
        """
        pipeline = [
            {"$match": self._get_scope_filter()},
            {
                "$group": {
                    "_id": "$competition.federation",
                    "total_entries": {"$sum": 1},
                    "bomb_outs": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$or": [
                                        {"$eq": ["$results.place", "DQ"]},
                                        {"$eq": ["$results.total", 0]},
                                        {"$eq": ["$results.total", None]},
                                    ]
                                },
                                1,
                                0,
                            ]
                        }
                    },
                }
            },
            {"$match": {"total_entries": {"$gt": 100}}},
            {
                "$project": {
                    "_id": 0,
                    "federation": "$_id",
                    "dq_rate": {
                        "$multiply": [
                            {"$divide": ["$bomb_outs", "$total_entries"]},
                            100,
                        ]
                    },
                    "total_entries": 1,
                }
            },
            {"$sort": {"dq_rate": -1}},
            {"$limit": 10},
        ]
        return list(self.collection.aggregate(pipeline))

    def get_athlete_retention_rate(self):
        """
        Insight: ¿Fidelidad de los usuarios? (One-Hit Wonder vs Recurrente).
        Uso: Métrica de salud del deporte.
        """
        pipeline = [
            {"$match": self._get_scope_filter()},
            {"$group": {"_id": "$athlete.id", "meet_count": {"$sum": 1}}},
            {
                "$project": {
                    "status": {
                        "$cond": [{"$eq": ["$meet_count", 1]}, "OneTime", "Recurring"]
                    }
                }
            },
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ]
        return list(self.collection.aggregate(pipeline))

    # ==========================================
    # 5. ADVANCED ANALYTICS (NUEVO)
    # ==========================================

    def get_lift_ratios(self, sex: str, equipment: str):
        """
        Insight: ¿Cuál es la proporción áurea del Powerlifting? (Ej: 35% Sentadilla - 25% Banca - 40% Muerto).
        Ayuda a los atletas a detectar sus puntos débiles.
        """
        pipeline = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "athlete.sex": sex,
                    "category.equipment": equipment,
                    "category.event": "SBD",  # SOLO Full Power
                    "results.total": {"$gt": 0},
                    "results.squat": {"$gt": 0},
                    "results.bench": {"$gt": 0},
                    "results.deadlift": {"$gt": 0},
                }
            },
            {"$limit": 5000},  # Muestra estadística robusta sin leer todo
            {
                "$project": {
                    "s_ratio": {"$divide": ["$results.squat", "$results.total"]},
                    "b_ratio": {"$divide": ["$results.bench", "$results.total"]},
                    "d_ratio": {"$divide": ["$results.deadlift", "$results.total"]},
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_squat_pct": {"$avg": "$s_ratio"},
                    "avg_bench_pct": {"$avg": "$b_ratio"},
                    "avg_deadlift_pct": {"$avg": "$d_ratio"},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "squat": {"$round": [{"$multiply": ["$avg_squat_pct", 100]}, 1]},
                    "bench": {"$round": [{"$multiply": ["$avg_bench_pct", 100]}, 1]},
                    "deadlift": {
                        "$round": [{"$multiply": ["$avg_deadlift_pct", 100]}, 1]
                    },
                }
            },
        ]
        return list(self.collection.aggregate(pipeline))

    def get_federation_performance_index(self):
        """
        Insight: ¿En qué federación están los atletas más fuertes (Promedio DOTS)?
        Separa las ligas "recreativas" de las "profesionales".
        """
        pipeline = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "category.event": "SBD",
                    "points.goodlift": {"$gt": 0},
                    "competition.date": {
                        "$gte": datetime(2022, 1, 1)
                    },  # Solo era moderna
                }
            },
            {
                "$group": {
                    "_id": "$competition.federation",
                    "avg_dots": {"$avg": "$points.goodlift"},
                    "lifter_count": {"$sum": 1},
                }
            },
            {
                "$match": {"lifter_count": {"$gt": 100}}
            },  # Elimina federaciones de patio trasero
            {"$sort": {"avg_dots": -1}},
            {"$limit": 15},
            {
                "$project": {
                    "_id": 0,
                    "federation": "$_id",
                    "avg_dots": {"$round": ["$avg_dots", 2]},
                    "count": "$lifter_count",
                }
            },
        ]
        return list(self.collection.aggregate(pipeline))

    def get_weight_efficiency_scatter(self, sex: str, equipment: str):
        """
        Insight: ¿Ser más pesado te hace MENOS eficiente?
        Scatter Plot: Eje X (Peso Corporal) vs Eje Y (DOTS).
        Debería verse una línea plana idealmente, pero la realidad muestra sesgos.
        """
        pipeline = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "athlete.sex": sex,
                    "category.equipment": equipment,
                    "category.event": "SBD",
                    "athlete.bodyweight": {
                        "$gt": 40,
                        "$lt": 180,
                    },  # Filtrar errores de dedo
                    "points.goodlift": {"$gt": 0},
                }
            },
            {
                "$sample": {"size": 500}
            },  # Sampling aleatorio para no explotar el frontend
            {
                "$project": {
                    "_id": 0,
                    "bw": "$athlete.bodyweight",
                    "score": "$points.goodlift",
                    "total": "$results.total",
                }
            },
        ]
        return list(self.collection.aggregate(pipeline))

    # ==========================================
    # 6. HOME K.P.I.s
    # ==========================================

    def get_home_stats(self):
        """
        Returns stats for the Home Cards:
        - Active Clubs (based on 'team' field, estimated)
        - Active Athletes (Afiliados)
        - Gender Distribution
        - Growth percentages (vs previous year)
        """
        current_year = datetime.now().year
        # Use simple aggregation to get global counts for current year

        # 1. CLUBES & AFILIADOS (Current Year)
        pipeline_stats = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "competition.date": {
                        "$gte": datetime(current_year, 1, 1),
                        "$lte": datetime(current_year, 12, 31),
                    },
                }
            },
            {
                "$group": {
                    "_id": None,
                    # If 'team' doesn't exist, this will be null/0. assuming athlete.team or info.team
                    # We often don't have 'team' in openpowerlifting for all, so we check 'athlete.team'?
                    # Let's try athlete.parent_federation or similar if team is missing.
                    # Actually, let's just count unique athlete names as affiliates.
                    "unique_athletes": {"$addToSet": "$athlete.id"},
                    # For clubs, we might not have a clean field. Let's use 'athlete.team' if present in raw data
                    # If not available, we return 0 or N/A
                    "unique_teams": {"$addToSet": "$athlete.team"},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "active_athletes": {"$size": "$unique_athletes"},
                    "active_clubs": {"$size": "$unique_teams"},
                }
            },
        ]

        # 2. GENDER DISTRIBUTION (All time or Current Year? Usually current state of active members)
        # Let's do Current Year + Previous Year for trend
        pipeline_gender = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "competition.date": {"$gte": datetime(current_year, 1, 1)},
                }
            },
            {"$group": {"_id": "$athlete.sex", "count": {"$sum": 1}}},
        ]

        # 3. GROWTH (Previous Year)
        prev_year = current_year - 1
        pipeline_prev = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "competition.date": {
                        "$gte": datetime(prev_year, 1, 1),
                        "$lte": datetime(prev_year, 12, 31),
                    },
                }
            },
            {
                "$group": {
                    "_id": None,
                    "unique_athletes": {"$addToSet": "$athlete.id"},
                    "unique_teams": {"$addToSet": "$athlete.team"},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "prev_athletes": {"$size": "$unique_athletes"},
                    "prev_clubs": {"$size": "$unique_teams"},
                }
            },
        ]

        # Execute
        stats = list(self.collection.aggregate(pipeline_stats))
        genders = list(self.collection.aggregate(pipeline_gender))
        prev = list(self.collection.aggregate(pipeline_prev))

        # Historic for Sparklines (Last 5 years)
        pipeline_hist = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    "competition.date": {"$gte": datetime(current_year - 4, 1, 1)},
                }
            },
            {
                "$group": {
                    "_id": {"year": {"$year": "$competition.date"}},
                    "athletes": {"$addToSet": "$athlete.id"},
                    "teams": {"$addToSet": "$athlete.team"},
                }
            },
            {"$sort": {"_id.year": 1}},
            {
                "$project": {
                    "_id": 0,
                    "year": "$_id.year",
                    "athlete_count": {"$size": "$athletes"},
                    "team_count": {"$size": "$teams"},
                }
            },
        ]
        history = list(self.collection.aggregate(pipeline_hist))

        # 4. RANKINGS (Historical Top 10 Male/Female by DOTS)
        pipeline_rankings = [
            {
                "$match": {
                    **self._get_scope_filter(),
                    # "competition.date": { "$gte": datetime(current_year, 1, 1) }, # REMOVED for Historical
                    "points.goodlift": {"$gt": 0},
                }
            },
            {"$sort": {"points.goodlift": -1}},
            {
                "$group": {
                    "_id": "$athlete.id",
                    "name": {"$first": "$athlete.name"},
                    "sex": {"$first": "$athlete.sex"},
                    "score": {"$max": "$points.goodlift"},
                    # Details for the best performance
                    "weight_class": {"$first": "$category.weight_class"},
                    "total": {"$first": "$results.total"},
                    "squat": {"$first": "$results.squat"},
                    "bench": {"$first": "$results.bench"},
                    "deadlift": {"$first": "$results.deadlift"},
                    "date": {"$first": "$competition.date"},
                }
            },
            {
                "$facet": {
                    "male": [
                        {"$match": {"sex": "M"}},
                        {"$sort": {"score": -1}},
                        {"$limit": 10},
                    ],
                    "female": [
                        {"$match": {"sex": "F"}},
                        {"$sort": {"score": -1}},
                        {"$limit": 10},
                    ],
                }
            },
        ]

        rankings = list(self.collection.aggregate(pipeline_rankings))
        rankings_data = rankings[0] if rankings else {"male": [], "female": []}

        return {
            "current": stats[0] if stats else {"active_athletes": 0, "active_clubs": 0},
            "prev": prev[0] if prev else {"prev_athletes": 0, "prev_clubs": 0},
            "gender": genders,
            "history": history,
            "rankings": rankings_data,
        }

    def get_specific_rankings(
        self, federation: str, limit: int = 10, tested: str = "ALL"
    ):
        """
        Returns top athletes rankings filtered by a specific federation.
        tested: "ALL", "TESTED", "UNTESTED"
        """
        # Base match filter
        match_filter = {
            "athlete.country": {"$in": ["Spain", "España", "ESP"]},
            "points.goodlift": {"$gt": 0},
        }

        # Add federation filter if specific one provided (not 'ALL')
        if federation and federation.upper() != "ALL":
            match_filter["competition.federation"] = federation.upper()

        # Add Tested filter
        if tested == "TESTED":
            match_filter["category.tested"] = True
        elif tested == "UNTESTED":
            # In some cases untestes is False or None.
            # Safest is probably explicit False or $ne True if schema not strict
            match_filter["category.tested"] = False

        pipeline_rankings = [
            {"$match": match_filter},
            {"$sort": {"points.goodlift": -1}},
            {
                "$group": {
                    "_id": "$athlete.id",
                    "name": {"$first": "$athlete.name"},
                    "sex": {"$first": "$athlete.sex"},
                    "score": {"$max": "$points.goodlift"},
                    # Details for the best performance
                    "weight_class": {"$first": "$category.weight_class"},
                    "total": {"$first": "$results.total"},
                    "squat": {"$first": "$results.squat"},
                    "bench": {"$first": "$results.bench"},
                    "deadlift": {"$first": "$results.deadlift"},
                    "date": {"$first": "$competition.date"},
                    "federation": {"$first": "$competition.federation"},
                    "tested": {"$first": "$category.tested"},
                }
            },
            {
                "$facet": {
                    "male": [
                        {"$match": {"sex": "M"}},
                        {"$sort": {"score": -1}},
                        {"$limit": limit},
                    ],
                    "female": [
                        {"$match": {"sex": "F"}},
                        {"$sort": {"score": -1}},
                        {"$limit": limit},
                    ],
                }
            },
        ]

        rankings = list(self.collection.aggregate(pipeline_rankings))
        return rankings[0] if rankings else {"male": [], "female": []}

    # finales

    def get_country_champions(self, sex: str, equipment: str, tested: bool):
        """
        Obtiene el mejor atleta por país y devuelve:
        Nombre, Federación, Categoría, SQ, BP, DL, Total y Goodlift.
        """
        pipeline = [
            # 1. Filtros (Igual que antes)
            {
                "$match": {
                    "athlete.sex": sex,
                    "category.equipment": equipment,
                    "category.tested": tested,
                    "results.total": {"$gt": 0},
                    "athlete.country": {"$ne": None},
                }
            },
            # 2. Ordenar por Total (El más fuerte primero)
            {"$sort": {"results.total": -1}},
            # 3. Agrupar por País (El primero es el campeón)
            {
                "$group": {
                    "_id": "$athlete.country",
                    "champion_name": {"$first": "$athlete.name"},
                    # Datos de la Competición y Federación
                    "federation": {"$first": "$competition.federation"},
                    # Categoría (Peso + Edad opcional, aquí pongo Peso)
                    "weight_class": {"$first": "$category.weight_class"},
                    # Levantamientos (KGs)
                    "best_squat": {"$first": "$results.squat"},
                    "best_bench": {"$first": "$results.bench"},
                    "best_deadlift": {"$first": "$results.deadlift"},
                    "best_total": {"$first": "$results.total"},
                    # Puntos Goodlift
                    "goodlift": {"$first": "$points.goodlift"},
                }
            },
            # 4. Ordenar la lista final por Total
            {"$sort": {"best_total": -1}},
            # 5. Proyección (Limpieza final)
            {
                "$project": {
                    "_id": 0,
                    "country": "$_id",
                    "champion": "$champion_name",
                    "federation": "$federation",
                    "category": "$weight_class",
                    "squat": "$best_squat",
                    "bench": "$best_bench",
                    "deadlift": "$best_deadlift",
                    "total": "$best_total",
                    "goodlift": "$goodlift",
                }
            },
        ]
        return list(self.collection.aggregate(pipeline))

    def get_top10_by_country(self, sex: str, equipment: str, tested: bool):
        """
        Agrupa por país y extrae los 10 mejores atletas históricos de cada uno.
        """
        pipeline = [
            # 1. Filtros (Igual que antes)
            {
                "$match": {
                    "athlete.sex": sex,
                    "category.equipment": equipment,
                    "category.tested": tested,
                    "results.total": {"$gt": 0},
                    "athlete.country": {"$ne": None},
                }
            },
            # 2. Ordenamos por Total (Crucial para que el push entre ordenado)
            {"$sort": {"results.goodlift": 1}},
            # 3. Agrupamos por País y guardamos una lista de atletas
            {
                "$group": {
                    "_id": "$athlete.country",
                    "all_athletes": {
                        "$push": {
                            "name": "$athlete.name",
                            "total": "$results.total",
                            "squat": "$results.squat",
                            "bench": "$results.bench",
                            "deadlift": "$results.deadlift",
                            "federation": "$competition.federation",
                            "date": "$competition.date",
                            "goodlift": "$points.goodlift",
                            "cat": "$category.weight_class",
                        }
                    },
                }
            },
            # 4. Proyección: Cortamos la lista para dejar solo el Top 10
            {
                "$project": {
                    "_id": 0,
                    "country": "$_id",
                    "top_athletes": {
                        "$slice": ["$all_athletes", 10]
                    },  # <--- AQUÍ ESTÁ EL TOP 10
                }
            },
            # 5. Ordenamos los países alfabéticamente (opcional)
            {"$sort": {"country": 1}},
        ]
        return list(self.collection.aggregate(pipeline))

    def get_athlete_growth_stats(self):
        """
        Calcula el crecimiento anual de atletas únicos en España.
        Usa el índice: athlete.country -> category.tested -> competition.date
        """
        pipeline = [
            # 1. MATCH: Filtramos rápido gracias al índice
            {
                "$match": {
                    "athlete.country": {"$in": ["Spain", "España", "ESP"]},
                    "category.tested": True,  # Nos centramos en el crecimiento "oficial/tested"
                    "competition.date": {"$ne": None},  # Evitar fechas nulas
                }
            },
            # 2. GROUP: La magia ocurre aquí
            # Extraemos el año directamente y usamos $addToSet
            {
                "$group": {
                    "_id": {"$year": "$competition.date"},  # Agrupar por Año
                    "unique_ids": {
                        "$addToSet": "$athlete.id"
                    },  # Colecciona IDs SIN duplicados
                }
            },
            # 3. PROJECT: Formateamos la salida y contamos
            {
                "$project": {
                    "_id": 0,
                    "year": "$_id",
                    "count": {
                        "$size": "$unique_ids"
                    },  # Contamos cuántos IDs únicos hubo
                }
            },
            # 4. SORT: Ordenamos cronológicamente para la gráfica
            {"$sort": {"year": 1}},
        ]

        return list(self.collection.aggregate(pipeline))

    """
    GRAPHIC GROWTH COMPETITIONS
    """

    def get_competition_growth_stats(self):
        """
        Calcula el crecimiento de competiciones consultando DIRECTAMENTE
        la colección de 'competitions'. Mucho más rápido.
        """
        competitions_col = self.db["competitions"]

        pipeline = [
            # 1. MATCH: Filtramos directamente las competiciones
            {
                "$match": {
                    "country": {"$in": ["Spain", "España", "ESP"]},
                    "federation": {"$in": ["AEP", "EPF", "IPF"]},
                    "date": {"$ne": None},
                }
            },
            # 2. GROUP: Agrupamos por Año directamente
            {"$group": {"_id": {"$year": "$date"}, "count": {"$sum": 1}}},
            # 3. PROJECT & SORT
            {"$project": {"_id": 0, "year": "$_id", "count": 1}},
            {"$sort": {"year": 1}},
        ]

        return list(competitions_col.aggregate(pipeline))

    # ==========================================
    # 7. DATA INGESTION
    # ==========================================

    def ingest_upcoming_competitions(self):
        """
        Triggers ingestion of upcoming competitions and returns the full list.
        """
        # Import inside method to avoid circular imports if any
        from src.use_cases.ingest_upcoming_competitions import (
            IngestUpcomingCompetitions,
        )
        from dataclasses import asdict

        use_case = IngestUpcomingCompetitions()
        competitions = use_case.execute()

        # Return list of dicts for JSON response
        return [asdict(comp) for comp in competitions]

    def get_historical_leaderboard(
        self, sex: str, sort_by: str = "points.goodlift", limit: int = 50
    ):
        """
        Ranking Histórico (All-Time).
        Devuelve el rendimiento completo del día en que el atleta logró su mejor marca.
        """
        pipeline = [
            # 1. MATCH: Filtros básicos
            {
                "$match": {
                    "athlete.country": {"$in": ["Spain", "España", "ESP"]},
                    "competition.federation": {"$in": ["AEP", "EPF", "IPF"]},
                    "category.equipment": "Raw",
                    "category.tested": True,
                    "athlete.sex": sex,
                    "results.total": {"$gt": 0},
                }
            },
            # 2. SORT: Ordenamos por la métrica deseada (ej: Goodlift) descendente.
            # Los mejores rendimientos quedan arriba.
            {"$sort": {sort_by: -1}},
            # 3. GROUP: Nos quedamos con el PRIMER registro (el mejor) de cada atleta.
            {
                "$group": {
                    "_id": "$athlete.id",
                    "athlete_name": {"$first": "$athlete.name"},
                    # Datos de Clasificación
                    "best_value": {"$first": f"${sort_by}"},  # La puntuación GL/Dots
                    # Contexto (Categoría y Peso REAL de ese día)
                    "real_weight_class": {"$first": "$category.weight_class"},
                    "real_bodyweight": {"$first": "$athlete.bodyweight"},
                    # Las marcas exactas de ESE día glorioso
                    "best_squat": {"$first": "$results.squat"},
                    "best_bench": {"$first": "$results.bench"},
                    "best_deadlift": {"$first": "$results.deadlift"},
                    "best_total": {"$first": "$results.total"},
                    # Metadatos
                    "date": {"$first": "$competition.date"},
                    "competition_name": {"$first": "$competition.name"},
                    "federation": {"$first": "$competition.federation"},
                    "sex": {"$first": "$athlete.sex"},
                }
            },
            # 4. SORT FINAL: Ordenamos el ranking final (Top 1, Top 2...)
            {"$sort": {"best_value": -1}},
            # 5. LIMIT
            {"$limit": limit},
        ]

        return list(
            self.results_col.aggregate(pipeline)
        )  # O self.collection si estás en Repo

    def get_monthly_top_5_general(self):
        start_of_month = datetime.now().replace(day=1)

        # 1. Filtro Global: Fecha y Federaciones permitidas
        match_stage = {
            "$match": {
                "date": {"$gte": start_of_month},
                "federation": {"$in": ["IPF", "EPF", "AEP"]},
                "country": "Spain",
            }
        }

        # 2. Helper para generar el pipeline de cada Top 5
        def get_ranking_pipeline(metric_field, sex):
            return [
                # A. Filtramos por sexo para que el ranking sea justo
                {"$match": {"sex": sex}},
                # B. Ordenamos por la métrica (Ej: squat más pesado)
                #    Desempate: Si levantan lo mismo, gana el de menor peso corporal
                {"$sort": {metric_field: -1, "bodyweight": 1}},
                # C. Cogemos los 5 mejores de TODAS las federaciones mezcladas
                {"$limit": 5},
                # D. Proyectamos limpio para el Frontend
                {
                    "$project": {
                        "_id": 0,
                        "type": {"$literal": metric_field},  # Ej: 'best3squat_kg'
                        "rank_sex": {"$literal": sex},  # 'M' o 'F'
                        "athlete": "$athlete_name",
                        "value": "$" + metric_field,  # El valor (kg o puntos)
                        "federation": 1,  # Para poner el badge (AEP/EPF...)
                        "club": 1,
                        "bodyweight": 1,
                        "date": 1,
                    }
                },
            ]

        # 3. Ejecutamos 10 rankings paralelos (5 Categorías x 2 Sexos)
        pipeline = [
            match_stage,
            {
                "$facet": {
                    # --- HOMBRES ---
                    "sq_m": get_ranking_pipeline("best3squat_kg", "M"),
                    "bp_m": get_ranking_pipeline("best3bench_kg", "M"),
                    "dl_m": get_ranking_pipeline("best3deadlift_kg", "M"),
                    "tot_m": get_ranking_pipeline("total_kg", "M"),
                    "gl_m": get_ranking_pipeline("gl_points", "M"),
                    # --- MUJERES ---
                    "sq_f": get_ranking_pipeline("best3squat_kg", "F"),
                    "bp_f": get_ranking_pipeline("best3bench_kg", "F"),
                    "dl_f": get_ranking_pipeline("best3deadlift_kg", "F"),
                    "tot_f": get_ranking_pipeline("total_kg", "F"),
                    "gl_f": get_ranking_pipeline("gl_points", "F"),
                }
            },
            # 4. Unimos todo en una sola lista plana
            {
                "$project": {
                    "all_rankings": {
                        "$concatArrays": [
                            "$sq_m",
                            "$bp_m",
                            "$dl_m",
                            "$tot_m",
                            "$gl_m",
                            "$sq_f",
                            "$bp_f",
                            "$dl_f",
                            "$tot_f",
                            "$gl_f",
                        ]
                    }
                }
            },
        ]

        result = list(self.results_col.aggregate(pipeline))
        return result[0]["all_rankings"] if result else []

    def get_all_rankings(self, sex: str):
        """
        Devuelve el TOP 1 de cada categoría principal del MES ACTUAL.
        Si no hay datos este mes, devuelve del MES ANTERIOR.
        """

        def run_aggregation(start_date, end_date=None):
            # 0. Definir scope básico con filtro de fecha
            date_filter = {"$gte": start_date}
            if end_date:
                date_filter["$lt"] = end_date

            match_filter = {
                "athlete.country": {"$in": ["Spain", "España", "ESP"]},
                "athlete.sex": sex,
                "category.tested": True,
                "category.equipment": "Raw",
                "results.total": {"$gt": 0},
                "competition.date": date_filter,
            }

            # 1. Función auxiliar para construir pipelines de "Mejor de X"
            def get_best_of(sort_field, title_label, stat_field, value_suffix="kg"):
                return [
                    {"$match": {**match_filter, stat_field: {"$gt": 0}}},
                    {"$sort": {sort_field: -1}},
                    {"$limit": 1},
                    {
                        "$project": {
                            "_id": 0,
                            "title": {"$literal": title_label},
                            "athleteName": "$athlete.name",
                            "stats": {
                                "$concat": [
                                    {"$toString": f"${stat_field}"},
                                    value_suffix,
                                ]
                            },
                            "value": f"${stat_field}",
                            "category": {
                                "$concat": [
                                    "$category.division",
                                    " ",
                                    "$category.weight_class",
                                ]
                            },
                            "federation": "$competition.federation",
                            "date": "$competition.date",
                        }
                    },
                ]

            # 2. Pipeline con Facets
            pipeline = [
                {
                    "$facet": {
                        "best_squat": get_best_of(
                            "results.squat", "MEJOR SENTADILLA", "results.squat"
                        ),
                        "best_bench": get_best_of(
                            "results.bench", "MEJOR PRESS BANCA", "results.bench"
                        ),
                        "best_deadlift": get_best_of(
                            "results.deadlift", "MEJOR PESO MUERTO", "results.deadlift"
                        ),
                        "best_total": get_best_of(
                            "results.total", "MEJOR TOTAL", "results.total"
                        ),
                        "best_gl": get_best_of(
                            "points.goodlift",
                            "MEJOR LEVANTADOR (GL)",
                            "points.goodlift",
                            " pts",
                        ),
                    }
                },
                {
                    "$project": {
                        "highlights": {
                            "$concatArrays": [
                                "$best_squat",
                                "$best_bench",
                                "$best_deadlift",
                                "$best_total",
                                "$best_gl",
                            ]
                        }
                    }
                },
            ]

            result = list(self.results_col.aggregate(pipeline))
            return result[0]["highlights"] if result else []

        # 1. Intentar MES ACTUAL
        now = datetime.now()
        start_current_month = now.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )

        highlights = run_aggregation(start_current_month)

        # 2. Si está vacío (o tiene menos de 3 datos para no mostrar desierto), ir al MES ANTERIOR
        if not highlights:
            # Calcular mes anterior
            # Truco: restar 1 día al start del mes actual para ir al último del mes anterior, luego poner day=1
            end_prev_month = start_current_month
            start_prev_month = (end_prev_month - timedelta(days=1)).replace(day=1)

            highlights = run_aggregation(start_prev_month, end_prev_month)

        # 3. Filtrar valores nulos o NaN antes de devolver
        valid_highlights = []
        for h in highlights:
            val = h.get("value")
            # Check for None
            if val is None:
                continue
            # Check for NaN (if it's a number)
            if isinstance(val, float) and (val != val):
                continue
            valid_highlights.append(h)

        return valid_highlights
