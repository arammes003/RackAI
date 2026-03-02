import '../styles/PageLayout.css';

const PageLayout = ({ title, subtitle, children }) => {
    return (
        <div className="layout-container">
            <div className="layout-section">
                <div className="page-header">
                    <h2 className="layout-section-title">{title}</h2>
                    {subtitle && <p className="layout-section-subtitle">{subtitle}</p>}
                </div>
                
                {children}
            </div>
        </div>
    );
};

export default PageLayout;
