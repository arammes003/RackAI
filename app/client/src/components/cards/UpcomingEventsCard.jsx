import React from "react";
import "../../styles/UpcomingEventsCard.css";
import { Calendar, MapPin, Trophy } from "lucide-react";

const UpcomingEventsCard = ({ events, loading }) => {
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
