import React from 'react';
import '../../styles/Home.css';
import { Calendar, MapPin } from 'lucide-react';

const UpcomingEventsCard = ({ events }) => {
    // Helper to format date
    const formatDate = (dateString, type) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return ''; // Invalid date

        if (type === 'day') {
            return date.getDate();
        } else if (type === 'month') {
            return date.toLocaleString('es-ES', { month: 'short' }).replace('.', '');
        }
    };

    const getDateStyle = (federation) => {
        const fed = federation?.toUpperCase() || '';
        if (fed.includes('EPF')) {
            // User requested #66ff99.
            // Using it as background color with dark text for readability.
            return { color: '#064e3b', backgroundColor: '#66ff99' }; // Bright Green BG, Dark Green Text
        }
        if (fed.includes('IPF')) {
            // Gold color
            return { color: '#451a03', backgroundColor: '#FFD700' }; // Gold BG, Dark Brown Text
        }
        return {}; // Default (Blue/AEP)
    };

    return (
        <div className="upcoming-card">
            <div className="upcoming-card-header">
                <span className="upcoming-card-title">Próximas Competiciones</span>
                <Calendar className="stat-card-icon" size={20} style={{ color: '#3b82f6' }} />
            </div>

            <div className="upcoming-list">
                {events && events.length > 0 ? (
                    events.map((event, index) => (
                        <div key={index} className="upcoming-item">
                            <div className="upcoming-date-box" style={getDateStyle(event.federation)}>
                                <span className="upcoming-day">{formatDate(event.date, 'day')}</span>
                                <span className="upcoming-month">{formatDate(event.date, 'month')}</span>
                            </div>
                            <div className="upcoming-info">
                                <h4 className="upcoming-name" title={event.name}>{event.name}</h4>
                                <div className="upcoming-details">
                                    <span className="federation-badge">{event.federation}</span>
                                    {event.town && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <MapPin size={12} />
                                            {event.town}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                        No hay competiciones próximas.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingEventsCard;
