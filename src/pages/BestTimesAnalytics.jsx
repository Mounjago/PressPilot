import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, Phone, Mail, Target, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';

const BestTimesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Données de démonstration pour les meilleurs moments
  const bestTimesData = {
    hourly: [
      { hour: '08:00', emails: 65, calls: 28, responseRate: 12.5 },
      { hour: '09:00', emails: 78, calls: 35, responseRate: 18.2 },
      { hour: '10:00', emails: 95, calls: 42, responseRate: 24.7 },
      { hour: '11:00', emails: 88, calls: 38, responseRate: 22.1 },
      { hour: '12:00', emails: 45, calls: 15, responseRate: 8.9 },
      { hour: '13:00', emails: 52, calls: 18, responseRate: 11.3 },
      { hour: '14:00', emails: 89, calls: 41, responseRate: 26.4 },
      { hour: '15:00', emails: 92, calls: 44, responseRate: 28.1 },
      { hour: '16:00', emails: 87, calls: 39, responseRate: 25.3 },
      { hour: '17:00', emails: 72, calls: 28, responseRate: 19.4 },
    ],
    daily: [
      { day: 'Lundi', emails: 145, calls: 68, responseRate: 22.5 },
      { day: 'Mardi', emails: 168, calls: 78, responseRate: 28.9 },
      { day: 'Mercredi', emails: 156, calls: 72, responseRate: 26.1 },
      { day: 'Jeudi', emails: 162, calls: 75, responseRate: 27.8 },
      { day: 'Vendredi', emails: 134, calls: 58, responseRate: 21.2 },
      { day: 'Samedi', emails: 89, calls: 32, responseRate: 12.4 },
      { day: 'Dimanche', emails: 45, calls: 15, responseRate: 8.1 },
    ]
  };

  const insights = [
    {
      title: 'Meilleure heure',
      value: '15h00 - 16h00',
      description: 'Taux de réponse de 28.1% en moyenne',
      icon: Clock,
      type: 'success'
    },
    {
      title: 'Meilleur jour',
      value: 'Mardi',
      description: 'Performance supérieure de +35% à la moyenne',
      icon: Calendar,
      type: 'success'
    },
    {
      title: 'A eviter',
      value: 'Weekend',
      description: 'Taux de réponse inférieur à 12%',
      icon: TrendingUp,
      type: 'warning'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getBestHours = () => {
    return bestTimesData.hourly
      .sort((a, b) => b.responseRate - a.responseRate)
      .slice(0, 3);
  };

  const getBestDays = () => {
    return bestTimesData.daily
      .sort((a, b) => b.responseRate - a.responseRate)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar />
        <main className="main-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">MEILLEURS MOMENTS</h1>
            <div className="loading-spinner"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">MEILLEURS MOMENTS</h1>
          <p className="dashboard-subtitle">Identifiez les créneaux optimaux pour vos campagnes</p>

          <div className="time-range-selector">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-select"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">3 derniers mois</option>
            </select>
          </div>
        </div>

        {/* Insights principaux */}
        <div className="insights-grid">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="insight-card">
                <div className={`insight-icon ${insight.type}`}>
                  <IconComponent size={24} />
                </div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <div className="metric-value" style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
                    {insight.value}
                  </div>
                  <p>{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Analyse par heures */}
        <div className="analytics-section">
          <h3 className="section-title">Performance par heure</h3>
          <div className="chart-container">
            <div className="best-times-grid">
              {bestTimesData.hourly.map((hour, index) => (
                <div
                  key={index}
                  className={`time-slot ${hour.responseRate > 20 ? 'high-performance' : hour.responseRate > 15 ? 'medium-performance' : 'low-performance'}`}
                >
                  <div className="time-label">{hour.hour}</div>
                  <div className="time-metrics">
                    <div className="time-metric">
                      <Mail size={14} />
                      <span>{hour.emails}</span>
                    </div>
                    <div className="time-metric">
                      <Phone size={14} />
                      <span>{hour.calls}</span>
                    </div>
                  </div>
                  <div className="response-rate">{hour.responseRate}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analyse par jours */}
        <div className="analytics-section">
          <h3 className="section-title">Performance par jour</h3>
          <div className="chart-container">
            <div className="daily-performance-grid">
              {bestTimesData.daily.map((day, index) => (
                <div
                  key={index}
                  className={`daily-slot ${day.responseRate > 25 ? 'high-performance' : day.responseRate > 20 ? 'medium-performance' : 'low-performance'}`}
                >
                  <div className="day-label">{day.day}</div>
                  <div className="daily-metrics">
                    <div className="daily-metric">
                      <Mail size={14} />
                      <span>{day.emails}</span>
                    </div>
                    <div className="daily-metric">
                      <Phone size={14} />
                      <span>{day.calls}</span>
                    </div>
                  </div>
                  <div className="daily-response-rate">{day.responseRate}%</div>
                  <div className="daily-performance-label">
                    {day.responseRate > 25 ? 'Excellent' : day.responseRate > 20 ? 'Bon' : 'Moyen'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommandations */}
        <div className="analytics-section">
          <h3 className="section-title">Recommandations</h3>
          <div className="recommendations-grid">
            <div className="recommendation-card success">
              <div className="recommendation-header">
                <Target size={20} />
                <h4>Créneaux optimaux</h4>
              </div>
              <div className="recommendation-content">
                <h5>Meilleures heures :</h5>
                <ul>
                  {getBestHours().map((hour, index) => (
                    <li key={index}>
                      {hour.hour} - Taux de réponse: {hour.responseRate}%
                    </li>
                  ))}
                </ul>
                <h5>Meilleurs jours :</h5>
                <ul>
                  {getBestDays().map((day, index) => (
                    <li key={index}>
                      {day.day} - Taux de réponse: {day.responseRate}%
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="recommendation-card warning">
              <div className="recommendation-header">
                <Clock size={20} />
                <h4>A éviter</h4>
              </div>
              <div className="recommendation-content">
                <p><strong>Heures de pause :</strong> 12h-13h (taux de réponse: 8.9%)</p>
                <p><strong>Fin de semaine :</strong> Weekend (taux moyen: 10.2%)</p>
                <p><strong>Début de matinée :</strong> Avant 9h (performances réduites)</p>
              </div>
            </div>

            <div className="recommendation-card info">
              <div className="recommendation-header">
                <TrendingUp size={20} />
                <h4>Stratégies</h4>
              </div>
              <div className="recommendation-content">
                <p><strong>Campagnes email :</strong> Programmer entre 14h-16h</p>
                <p><strong>Appels de relance :</strong> Mardi et jeudi matin</p>
                <p><strong>Campagnes importantes :</strong> Éviter les lundis et vendredis</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BestTimesAnalytics;