import React from 'react';
import '../../styles/Home.css';
import { Calendar, MapPin } from 'lucide-react';

const UpcomingEventsCard = ({ events, loading }) => {
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

    if (loading) {
        return (
            <div className="upcoming-card">
                <div className="upcoming-card-header">
                    <span className="upcoming-card-title">Próximas Competiciones</span>
                    <Calendar className="stat-card-icon" size={20} style={{ color: '#3b82f6' }} />
                </div>
                <div className="upcoming-list">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="upcoming-item animate-pulse">
                            <div className="upcoming-date-box skeleton"></div>
                            <div className="upcoming-info w-full">
                                <div className="skeleton rounded w-3/4 mb-2" style={{height: '1rem'}}></div>
                                <div className="skeleton rounded w-1/2" style={{height: '0.75rem'}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

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
