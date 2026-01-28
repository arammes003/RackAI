# 🏋️ RackAI

> **The Modern Powerlifting Intelligence Platform**

![Status](https://img.shields.io/badge/Status-In_Development-orange) ![License](https://img.shields.io/badge/License-MIT-blue) ![Data](https://img.shields.io/badge/Data-Hybrid-green)

**RackAI** es una plataforma de consulta pública diseñada para modernizar la forma en que interactuamos con las estadísticas de Powerlifting. No es solo una base de datos; es una herramienta de visualización y análisis que transforma números fríos en historias de progreso.

El proyecto combina la inmensidad histórica de los datos de **OpenPowerlifting** con registros propios y exclusivos obtenidos directamente de competiciones y federaciones locales, cerrando la brecha entre los grandes eventos mundiales y la escena local.

## 🚀 Misión

El Powerlifting es un deporte de números, pero la forma de consumirlos ha quedado estancada en hojas de cálculo y tablas estáticas. **RackAI** nace para ofrecer:

* **Visualización:** Gráficos de progreso interactivos en lugar de tablas planas.
* **Contexto:** Análisis de rendimiento relativo (DOTS, GL, Wilks) automático.
* **Comunidad:** Foco en clubes y equipos, no solo en atletas individuales.

## ✨ Características Principales

### 📊 Perfiles de Atletas "Next-Gen"
* Historial completo de competiciones unificado.
* Gráficos de progresión por movimiento (Squat, Bench, Deadlift).
* **"Player Cards":** Resumen visual de estadísticas clave para compartir en redes.

### 🏆 Inteligencia de Clubes y Competiciones
* Rankings dinámicos de clubes basados en el rendimiento acumulado de sus atletas.
* Estadísticas detalladas por competición (tasa de éxito en intentos, levantador más fuerte, etc.).

### 🔍 Motor de Búsqueda Híbrido
* Búsqueda instantánea de atletas, clubes y eventos.
* Filtros avanzados (Federación, Categoría de peso, Rango de edad, Año).

### ⚔️ Modo Comparativa (Roadmap)
* Herramienta *Head-to-Head* para comparar las métricas de dos atletas lado a lado.

## 💾 Arquitectura de Datos

RackAI utiliza una arquitectura de datos híbrida para garantizar la máxima cobertura:

1.  **OpenPowerlifting Mirror:** Sincronización periódica con el repositorio de datos abiertos de OpenPowerlifting para cobertura histórica y mundial.
2.  **RackAI Proprietary Ingest:** Un pipeline personalizado para ingresar datos de competiciones locales o federaciones que aún no están digitalizadas en grandes bases de datos, permitiendo actualizaciones en tiempo real o exclusiva.

## 🛠️ Stack Tecnológico

*(Edita esta sección con tus tecnologías reales)*

* **Frontend:** `React`
* **Backend:** `Node.js / Python`
* **Base de Datos:** `MongoDB`
* **Data Processing:** `Python Pandas`

## 🤝 Créditos y Licencia

Este proyecto utiliza y respeta los datos del proyecto [OpenPowerlifting](https://www.openpowerlifting.org).

* Los datos originales de OpenPowerlifting están bajo su respectiva licencia (**Open Data Commons Open Database License**).
* El código fuente de RackAI está bajo la licencia **MIT**.

## 📬 Contacto

¿Tienes dudas o quieres aportar datos de tu competición? Abre un **Issue** o contáctame en `aramirezmes03@gmail.com`.
