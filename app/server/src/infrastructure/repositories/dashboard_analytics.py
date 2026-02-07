from datetime import datetime
from src.infrastructure.database import MongoDB

class DashboardAnalytics:
    def __init__(self):
        self.db = MongoDB().get_database()
        self.collection = self.db["results"]

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
            "athlete.country": { "$in": ["Spain", "España", "ESP"] }
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
                        "$lte": datetime.now() 
                    } 
                } 
            },
            {
                "$group": {
                    "_id": {
                        "year": { "$year": "$competition.date" },
                        "federation": "$competition.federation"
                    },
                    "count": { "$sum": 1 }
                }
            },
            { "$sort": { "_id.year": 1 } },
            {
                "$project": {
                    "_id": 0,
                    "year": "$_id.year",
                    "federation": "$_id.federation",
                    "athletes_count": "$count"
                }
            }
        ]
        return list(self.collection.aggregate(pipeline))

    def get_equipment_trends(self):
        """
        Insight: ¿El Powerlifting Raw ha matado al Equipado?
        Gráfico: Áreas apiladas (Stacked Area) de % de participación.
        """
        pipeline = [
            { "$match": { **self._get_scope_filter(), "competition.date": { "$gte": datetime(2015, 1, 1) } } },
            {
                "$group": {
                    "_id": {
                        "year": { "$year": "$competition.date" },
                        "equipment": "$category.equipment"
                    },
                    "count": { "$sum": 1 }
                }
            },
            { "$sort": { "_id.year": 1, "_id.equipment": 1 } },
            {
                "$project": {
                    "_id": 0,
                    "year": "$_id.year",
                    "equipment": "$_id.equipment",
                    "count": "$count"
                }
            }
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
                    "results.total": { "$gt": 0 }
                }
            },
            {
                "$facet": {
                    "average_stats": [
                        { 
                            "$group": {
                                "_id": None,
                                "avg_squat": { "$avg": "$results.squat" },
                                "avg_bench": { "$avg": "$results.bench" },
                                "avg_deadlift": { "$avg": "$results.deadlift" },
                                "avg_total": { "$avg": "$results.total" },
                                "total_lifters": { "$sum": 1 }
                            }
                        }
                    ],
                    "top_tier_stats": [
                        { "$sort": { "results.total": -1 } },
                        { "$limit": 100 }, 
                        {
                            "$group": {
                                "_id": None,
                                "elite_avg_total": { "$avg": "$results.total" }
                            }
                        }
                    ]
                }
            },
            {
                "$project": {
                    "average": { "$arrayElemAt": ["$average_stats", 0] },
                    "elite": { "$arrayElemAt": ["$top_tier_stats", 0] }
                }
            }
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
                    "athlete.age": { "$gte": 14, "$lte": 70 },
                    "points.goodlift": { "$gt": 0 }
                }
            },
            {
                "$group": {
                    "_id": "$athlete.age",
                    "avg_strength": { "$avg": "$points.goodlift" },
                    "sample_size": { "$sum": 1 }
                }
            },
            { "$match": { "sample_size": { "$gt": 50 } } },
            { "$sort": { "_id": 1 } },
            {
                "$project": {
                    "_id": 0,
                    "age": "$_id",
                    "avg_dots": "$avg_strength"
                }
            }
        ]
        return list(self.collection.aggregate(pipeline))

    def get_avg_yearly_progress(self, weight_class: str):
        """
        Insight: ¿Cuánto mejora un novato en su primer año?
        Uso: Marketing para entrenadores ("Gana 20kg en tu total").
        """
        pipeline = [
            { "$match": { **self._get_scope_filter(), "category.weight_class": weight_class } },
            {
                "$group": {
                    "_id": "$athlete.id",
                    "first_meet": { "$first": { "date": "$competition.date", "total": "$results.total" } },
                    "last_meet": { "$last": { "date": "$competition.date", "total": "$results.total" } },
                    "meet_count": { "$sum": 1 }
                }
            },
            { "$match": { "meet_count": { "$gte": 2 } } },
            {
                "$project": {
                    "days_diff": { 
                        "$divide": [ { "$subtract": ["$last_meet.date", "$first_meet.date"] }, 1000 * 60 * 60 * 24 ] 
                    },
                    "kg_gain": { "$subtract": ["$last_meet.total", "$first_meet.total"] }
                }
            },
            { "$match": { "days_diff": { "$gt": 180 } } },
            {
                "$group": {
                    "_id": None,
                    "avg_kg_gained": { "$avg": "$kg_gain" },
                    "avg_days_active": { "$avg": "$days_diff" }
                }
            }
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
            { "$match": { **self._get_scope_filter(), "competition.country": { "$ne": None } } },
            {
                "$group": {
                    "_id": "$competition.country",
                    "total_events": { "$addToSet": "$competition.id" },
                    "total_athletes": { "$sum": 1 },
                    "avg_dots": { "$avg": "$points.goodlift" }
                }
            },
            { "$match": { "total_athletes": { "$gt": 50 } } },
            {
                "$project": {
                    "_id": 0,
                    "country": "$_id",
                    "events_count": { "$size": "$total_events" },
                    "athletes_count": "$total_athletes",
                    "performance_index": { "$round": ["$avg_dots", 2] }
                }
            },
            { "$sort": { "athletes_count": -1 } },
            { "$limit": 20 }
        ]
        return list(self.collection.aggregate(pipeline))

    def get_dq_rates(self):
        """
        Insight: ¿Qué federaciones son más estrictas ("Jueces rojos")?
        Gráfico: Barras horizontales de % Descalificados.
        """
        pipeline = [
            { "$match": self._get_scope_filter() },
            {
                "$group": {
                    "_id": "$competition.federation",
                    "total_entries": { "$sum": 1 },
                    "bomb_outs": {
                        "$sum": {
                            "$cond": [
                                { "$or": [
                                    { "$eq": ["$results.place", "DQ"] }, 
                                    { "$eq": ["$results.total", 0] },
                                    { "$eq": ["$results.total", None] }
                                ]}, 
                                1, 
                                0
                            ]
                        }
                    }
                }
            },
            { "$match": { "total_entries": { "$gt": 100 } } },
            {
                "$project": {
                    "_id": 0,
                    "federation": "$_id",
                    "dq_rate": { 
                        "$multiply": [
                            { "$divide": ["$bomb_outs", "$total_entries"] }, 
                            100 
                        ]
                    },
                    "total_entries": 1
                }
            },
            { "$sort": { "dq_rate": -1 } },
            { "$limit": 10 }
        ]
        return list(self.collection.aggregate(pipeline))

    def get_athlete_retention_rate(self):
        """
        Insight: ¿Fidelidad de los usuarios? (One-Hit Wonder vs Recurrente).
        Uso: Métrica de salud del deporte.
        """
        pipeline = [
            { "$match": self._get_scope_filter() },
            {
                "$group": {
                    "_id": "$athlete.id",
                    "meet_count": { "$sum": 1 }
                }
            },
            {
                "$project": {
                    "status": {
                        "$cond": [ { "$eq": ["$meet_count", 1] }, "OneTime", "Recurring" ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "count": { "$sum": 1 }
                }
            }
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
                    "category.event": "SBD", # SOLO Full Power
                    "results.total": { "$gt": 0 },
                    "results.squat": { "$gt": 0 },
                    "results.bench": { "$gt": 0 },
                    "results.deadlift": { "$gt": 0 }
                }
            },
            { "$limit": 5000 }, # Muestra estadística robusta sin leer todo
            {
                "$project": {
                    "s_ratio": { "$divide": ["$results.squat", "$results.total"] },
                    "b_ratio": { "$divide": ["$results.bench", "$results.total"] },
                    "d_ratio": { "$divide": ["$results.deadlift", "$results.total"] }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_squat_pct": { "$avg": "$s_ratio" },
                    "avg_bench_pct": { "$avg": "$b_ratio" },
                    "avg_deadlift_pct": { "$avg": "$d_ratio" }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "squat": { "$round": [{ "$multiply": ["$avg_squat_pct", 100] }, 1] },
                    "bench": { "$round": [{ "$multiply": ["$avg_bench_pct", 100] }, 1] },
                    "deadlift": { "$round": [{ "$multiply": ["$avg_deadlift_pct", 100] }, 1] }
                }
            }
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
                    "points.goodlift": { "$gt": 0 },
                    "competition.date": { "$gte": datetime(2022, 1, 1) } # Solo era moderna
                } 
            },
            {
                "$group": {
                    "_id": "$competition.federation",
                    "avg_dots": { "$avg": "$points.goodlift" },
                    "lifter_count": { "$sum": 1 }
                }
            },
            { "$match": { "lifter_count": { "$gt": 100 } } }, # Elimina federaciones de patio trasero
            { "$sort": { "avg_dots": -1 } },
            { "$limit": 15 },
            {
                "$project": {
                    "_id": 0,
                    "federation": "$_id",
                    "avg_dots": { "$round": ["$avg_dots", 2] },
                    "count": "$lifter_count"
                }
            }
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
                    "athlete.bodyweight": { "$gt": 40, "$lt": 180 }, # Filtrar errores de dedo
                    "points.goodlift": { "$gt": 0 }
                }
            },
            { "$sample": { "size": 500 } }, # Sampling aleatorio para no explotar el frontend
            {
                "$project": {
                    "_id": 0,
                    "bw": "$athlete.bodyweight",
                    "score": "$points.goodlift",
                    "total": "$results.total"
                }
            }
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
                        "$lte": datetime(current_year, 12, 31)
                    }
                } 
            },
            {
                "$group": {
                    "_id": None,
                    # If 'team' doesn't exist, this will be null/0. assuming athlete.team or info.team
                    # We often don't have 'team' in openpowerlifting for all, so we check 'athlete.team'?
                    # Let's try athlete.parent_federation or similar if team is missing.
                    # Actually, let's just count unique athlete names as affiliates.
                    "unique_athletes": { "$addToSet": "$athlete.id" },
                    # For clubs, we might not have a clean field. Let's use 'athlete.team' if present in raw data
                    # If not available, we return 0 or N/A
                    "unique_teams": { "$addToSet": "$athlete.team" } 
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "active_athletes": { "$size": "$unique_athletes" },
                    "active_clubs": { "$size": "$unique_teams" }
                }
            }
        ]
        
        # 2. GENDER DISTRIBUTION (All time or Current Year? Usually current state of active members)
        # Let's do Current Year + Previous Year for trend
        pipeline_gender = [
            { 
                 "$match": { 
                    **self._get_scope_filter(),
                    "competition.date": { "$gte": datetime(current_year, 1, 1) }
                } 
            },
            {
                "$group": {
                    "_id": "$athlete.sex",
                    "count": { "$sum": 1 }
                }
            }
        ]
        
        # 3. GROWTH (Previous Year)
        prev_year = current_year - 1
        pipeline_prev = [
            { 
                "$match": { 
                    **self._get_scope_filter(),
                    "competition.date": { 
                        "$gte": datetime(prev_year, 1, 1),
                        "$lte": datetime(prev_year, 12, 31)
                    }
                } 
            },
            {
                "$group": {
                    "_id": None,
                    "unique_athletes": { "$addToSet": "$athlete.id" },
                    "unique_teams": { "$addToSet": "$athlete.team" }
                }
            },
             {
                "$project": {
                    "_id": 0,
                    "prev_athletes": { "$size": "$unique_athletes" },
                    "prev_clubs": { "$size": "$unique_teams" }
                }
            }
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
                    "competition.date": { "$gte": datetime(current_year - 4, 1, 1) }
                } 
            },
            {
                "$group": {
                    "_id": { "year": { "$year": "$competition.date" } },
                    "athletes": { "$addToSet": "$athlete.id" },
                    "teams": { "$addToSet": "$athlete.team" }
                }
            },
            { "$sort": { "_id.year": 1 } },
            {
                "$project": {
                    "_id": 0,
                    "year": "$_id.year",
                    "athlete_count": { "$size": "$athletes" },
                    "team_count": { "$size": "$teams" }
                }
            }
        ]
        history = list(self.collection.aggregate(pipeline_hist))

        # 4. RANKINGS (Historical Top 10 Male/Female by DOTS)
        pipeline_rankings = [
            { 
                "$match": { 
                    **self._get_scope_filter(),
                    # "competition.date": { "$gte": datetime(current_year, 1, 1) }, # REMOVED for Historical
                    "points.goodlift": { "$gt": 0 }
                } 
            },
            { "$sort": { "points.goodlift": -1 } },
            {
                "$group": {
                    "_id": "$athlete.id",
                    "name": { "$first": "$athlete.name" },
                    "sex": { "$first": "$athlete.sex" },
                    "score": { "$max": "$points.goodlift" },
                    # Details for the best performance
                    "weight_class": { "$first": "$category.weight_class" },
                    "total": { "$first": "$results.total" },
                    "squat": { "$first": "$results.squat" },
                    "bench": { "$first": "$results.bench" },
                    "deadlift": { "$first": "$results.deadlift" },
                    "date": { "$first": "$competition.date" }
                }
            },
            {
                "$facet": {
                    "male": [
                        { "$match": { "sex": "M" } },
                        { "$sort": { "score": -1 } },
                        { "$limit": 10 }
                    ],
                    "female": [
                        { "$match": { "sex": "F" } },
                        { "$sort": { "score": -1 } },
                        { "$limit": 10 }
                    ]
                }
            }
        ]
        
        rankings = list(self.collection.aggregate(pipeline_rankings))
        rankings_data = rankings[0] if rankings else {"male": [], "female": []}

        return {
            "current": stats[0] if stats else {"active_athletes": 0, "active_clubs": 0},
            "prev": prev[0] if prev else {"prev_athletes": 0, "prev_clubs": 0},
            "gender": genders,
            "history": history,
            "rankings": rankings_data
        }
 
    def get_specific_rankings(self, federation: str, limit: int = 10, tested: str = "ALL"):        
        """
        Returns top athletes rankings filtered by a specific federation.
        tested: "ALL", "TESTED", "UNTESTED"
        """
        # Base match filter
        match_filter = {
             "athlete.country": { "$in": ["Spain", "España", "ESP"] },
             "points.goodlift": { "$gt": 0 }
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
            { "$match": match_filter },
            { "$sort": { "points.goodlift": -1 } },
            {
                "$group": {
                    "_id": "$athlete.id",
                    "name": { "$first": "$athlete.name" },
                    "sex": { "$first": "$athlete.sex" },
                    "score": { "$max": "$points.goodlift" },
                    # Details for the best performance
                    "weight_class": { "$first": "$category.weight_class" },
                    "total": { "$first": "$results.total" },
                    "squat": { "$first": "$results.squat" },
                    "bench": { "$first": "$results.bench" },
                    "deadlift": { "$first": "$results.deadlift" },
                    "date": { "$first": "$competition.date" },
                    "federation": { "$first": "$competition.federation" },
                    "tested": { "$first": "$category.tested" }
                }
            },
            {
                "$facet": {
                    "male": [
                        { "$match": { "sex": "M" } },
                        { "$sort": { "score": -1 } },
                        { "$limit": limit }
                    ],
                    "female": [
                        { "$match": { "sex": "F" } },
                        { "$sort": { "score": -1 } },
                        { "$limit": limit }
                    ]
                }
            }
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
                    "results.total": { "$gt": 0 },
                    "athlete.country": { "$ne": None }
                }
            },
            # 2. Ordenar por Total (El más fuerte primero)
            { "$sort": { "results.total": -1 } },
            
            # 3. Agrupar por País (El primero es el campeón)
            {
                "$group": {
                    "_id": "$athlete.country",
                    "champion_name": { "$first": "$athlete.name" },
                    
                    # Datos de la Competición y Federación
                    "federation": { "$first": "$competition.federation" },
                    
                    # Categoría (Peso + Edad opcional, aquí pongo Peso)
                    "weight_class": { "$first": "$category.weight_class" },
                    
                    # Levantamientos (KGs)
                    "best_squat": { "$first": "$results.squat" },
                    "best_bench": { "$first": "$results.bench" },
                    "best_deadlift": { "$first": "$results.deadlift" },
                    "best_total": { "$first": "$results.total" },
                    
                    # Puntos Goodlift
                    "goodlift": { "$first": "$points.goodlift" } 
                }
            },
            # 4. Ordenar la lista final por Total
            { "$sort": { "best_total": -1 } },
            
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
                    "goodlift": "$goodlift"
                }
            }
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
                    "results.total": { "$gt": 0 },
                    "athlete.country": { "$ne": None }
                }
            },
            # 2. Ordenamos por Total (Crucial para que el push entre ordenado)
            { "$sort": { "results.goodlift": 1 } },
            
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
                            "cat": "$category.weight_class"
                        }
                    }
                }
            },
            # 4. Proyección: Cortamos la lista para dejar solo el Top 10
            {
                "$project": {
                    "_id": 0,
                    "country": "$_id",
                    "top_athletes": { "$slice": ["$all_athletes", 10] } # <--- AQUÍ ESTÁ EL TOP 10
                }
            },
            # 5. Ordenamos los países alfabéticamente (opcional)
            { "$sort": { "country": 1 } }
        ]
        return list(self.collection.aggregate(pipeline))