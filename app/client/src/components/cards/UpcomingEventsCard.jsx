import React, { useEffect, useState } from "react";
import { API_URL } from '../../config/api';
import "../../styles/UpcomingEventsCard.css";
import { Calendar, MapPin, Trophy } from "lucide-react";

const UpcomingEventsCard = () => {
  // 1. Añadimos el estado local
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Añadimos el fetch en un useEffect
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await fetch(`${API_URL}/analytics/upcoming-competitions?limit=5`);
        if (!response.ok) {
          throw new Error('Error al cargar competiciones');
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Error fetching upcoming events:", err);
        setError("No se pudieron cargar los eventos.");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  // Helper to format date
  const formatDate = (dateString, type) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Invalid date

    if (type === "day") {
      return date.getDate();
    } else if (type === "month") {
      return date.toLocaleString("es-ES", { month: "short" }).replace(".", "");
    }
  };

  const getFederationClass = (federation) => {
    const fed = federation?.toUpperCase() || "";
    if (fed.includes("EPF")) return "fed-epf";
    if (fed.includes("IPF")) return "fed-ipf";
    return "fed-aep"; // Default
  };

  // 3. Modificamos la vista de carga para que use nuestro estado local
  if (loading) {
    return (
      <div className="stat-card upcoming-card">
        <div className="upcoming-card-header">
          <span className="stat-card-title">Próximas Competiciones</span>
          <Calendar className="text-gray-400" size={20} />
        </div>
        <div className="upcoming-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="upcoming-item animate-pulse">
              <div className="upcoming-date-box skeleton"></div>
              <div className="upcoming-info w-full">
                <div
                  className="skeleton rounded w-3/4 mb-2"
                  style={{ height: "1rem" }}
                ></div>
                <div
                  className="skeleton rounded w-1/2"
                  style={{ height: "0.75rem" }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
     return (
        <div className="stat-card upcoming-card">
          <div className="upcoming-card-header">
            <span className="stat-card-title">Próximas Competiciones</span>
            <Calendar className="text-gray-400" size={20} />
          </div>
          <div className="upcoming-list">
            <div className="upcoming-empty-state">
              <div className="empty-icon-wrapper">
                <Calendar size={24} />
              </div>
              <p>{error}</p>
              <span className="empty-subtitle">Inténtalo de nuevo más tarde</span>
            </div>
          </div>
        </div>
     );
  }

  return (
    <div className="stat-card upcoming-card">
      <div className="upcoming-card-header">
        <span className="stat-card-title">Próximas Competiciones</span>
        <Calendar size={20} className="text-gray-400" />
      </div>

      <div className="upcoming-list">
        {events && events.length > 0 ? (
          events.map((event, index) => (
            <div key={index} className="upcoming-item">
              <div
                className={`upcoming-date-box ${getFederationClass(event.federation)}`}
              >
                <span className="upcoming-day">
                  {formatDate(event.date, "day")}
                </span>
                <span className="upcoming-month">
                  {formatDate(event.date, "month")}
                </span>
              </div>
              <div className="upcoming-info">
                <h4 className="upcoming-name" title={event.name}>
                  {event.name}
                </h4>
                <div className="upcoming-details">
                  <span
                    className={`federation-badge ${getFederationClass(event.federation)}`}
                  >
                    {event.federation}
                  </span>
                  {event.town && (
                    <span className="location-badge">
                      <MapPin size={10} />
                      {event.town}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="upcoming-empty-state">
            <div className="empty-icon-wrapper">
              <Trophy size={24} />
            </div>
            <p>No hay competiciones a la vista</p>
            <span className="empty-subtitle">¡Tiempo para entrenar!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEventsCard;