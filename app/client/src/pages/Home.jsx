import React from 'react';
// Importamos todos nuestros componentes independientes (Micro-Frontends)
import ActiveAthletesCard from '../components/cards/ActiveAthletesCard';
import AvgAthletesPerPeriodCard from '../components/cards/AvgAthletesPerPeriodCard';
import HighlightCard from '../components/cards/HighlightCard';
import UpcomingEventsCard from '../components/cards/UpcomingEventsCard';
import LeaderboardWidget from '../components/stats/LeaderboardTable';

import PageLayout from '../layouts/PageLayout';
import '../styles/Home.css';

const Home = () => {
    return (
        <PageLayout 
            title="Resumen General" 
            subtitle="Evolución del Powerlifting en España"
        >
            <div className="stats-grid">
                
                {/* 1. KPI: Atletas Activos YTD */}
                <ActiveAthletesCard />
                
                {/* 2. KPI: Promedio Atletas/Competición */}
                <AvgAthletesPerPeriodCard />

                {/* 3. Tarjeta de Atletas Destacados */}
                <HighlightCard pauseOnHover={true}/>
                
                {/* 4. Tabla de Clasificación */}
                <LeaderboardWidget />

                {/* 5. Próximas Competiciones */}
                <UpcomingEventsCard />
                
            </div>
        </PageLayout>
    );
};

export default Home;