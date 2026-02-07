import streamlit as st
import pandas as pd
import requests
import plotly.express as px

# --- CONFIGURACIÓN DE PÁGINA ---
st.set_page_config(page_title="World Champions Dashboard", page_icon="🌍", layout="wide")

# URL de tu API
API_URL = "http://127.0.0.1:8000"

def fetch_data(endpoint, params=None):
    """Helper para conectar con la API"""
    try:
        response = requests.get(f"{API_URL}{endpoint}", params=params)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Error {response.status_code}: No se pudieron obtener los datos.")
            return []
    except Exception as e:
        st.error(f"Error de conexión: {e}")
        return []

# --- ENCABEZADO ---
st.title("🌍 Mapa de Campeones Nacionales")
st.markdown("Visualización del **atleta más fuerte** de cada país (Récord Histórico).")

# --- FILTROS ---
st.write("---")
c1, c2, c3 = st.columns(3)

# Selectores
sex = c1.selectbox("Sexo", ["M", "F"], format_func=lambda x: "Hombres" if x == "M" else "Mujeres")
equipment = c2.selectbox("Modalidad", ["Raw", "Wraps", "Single-ply", "Multi-ply"])
is_tested = c3.toggle("🛡️ Solo Tested", value=True)

# --- CARGA DE DATOS ---
with st.spinner("Buscando campeones..."):
    # Llamamos al endpoint que ejecuta 'get_country_champions'
    data = fetch_data("/analytics/country-champions", params={
        "sex": sex, 
        "equipment": equipment, 
        "tested": is_tested
    })

if data:
    df = pd.DataFrame(data)

    # =========================================================
    # 1. GRÁFICOS (MAPA + BARRAS)
    # =========================================================
    col_map, col_bar = st.columns([1.5, 1])

    with col_map:
        st.subheader("Dominancia Mundial")
        # Mapa coloreado por Total Kg
        fig_map = px.choropleth(
            df,
            locations="country",
            locationmode="country names",
            color="total",
            hover_name="country",
            hover_data=["champion", "total", "federation"],
            color_continuous_scale="Plasma",
            title="Mejor Total por País"
        )
        fig_map.update_geos(fitbounds="locations", visible=False)
        fig_map.update_layout(margin={"r":0,"t":30,"l":0,"b":0})
        st.plotly_chart(fig_map, use_container_width=True)

    with col_bar:
        st.subheader("Top 15 Potencias")
        # Ordenamos y cogemos los 15 mejores
        top_15 = df.sort_values("total", ascending=False).head(15)
        
        fig_bar = px.bar(
            top_15,
            x="total",
            y="country",
            orientation='h',
            text="champion",
            color="total",
            color_continuous_scale="Plasma",
        )
        fig_bar.update_layout(
            yaxis=dict(autorange="reversed"), # El #1 arriba
            xaxis_title="Total (kg)",
            yaxis_title=None,
            coloraxis_showscale=False
        )
        st.plotly_chart(fig_bar, use_container_width=True)

    # =========================================================
    # 2. TABLA DE DATOS
    # =========================================================
    st.write("---")
    st.subheader(f"📋 Detalle por País ({len(df)} registros)")

    # Definimos columnas y orden (coincidiendo con tu backend)
    cols_config = {
        "champion": "Atleta",
        "country": "País",
        "federation": "Federación",
        "category": "Categoría",
        "squat": "Sentadilla",
        "bench": "Banca",
        "deadlift": "Peso Muerto",
        "total": "Total",
        "goodlift": "Goodlift Pts"
    }
    
    # Filtramos solo las columnas que existen en el dataframe
    cols_present = [c for c in cols_config.keys() if c in df.columns]
    
    df_display = df[cols_present].copy()
    df_display = df_display.rename(columns=cols_config)

    # Mostramos la tabla con formato numérico
    st.dataframe(
        df_display.style.format({
            "Sentadilla": "{:.1f}",
            "Banca": "{:.1f}",
            "Peso Muerto": "{:.1f}",
            "Total": "{:.1f}",
            "Goodlift Pts": "{:.2f}"
        }).background_gradient(subset=["Total"], cmap="Purples"),
        use_container_width=True,
        hide_index=True
    )

else:
    st.warning("No se encontraron datos para estos filtros.")