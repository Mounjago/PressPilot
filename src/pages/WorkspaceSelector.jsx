/**
 * PAGE WORKSPACE SELECTOR - Selection d'interface pour admins multi-workspace
 * Affichee apres login quand l'utilisateur a acces a plusieurs interfaces
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace, WORKSPACE_CONFIG, INTERFACES } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Building2, LogOut } from 'lucide-react';
import '../styles/Dashboard.css';

const WorkspaceSelector = () => {
  const navigate = useNavigate();
  const { availableInterfaces, switchWorkspace } = useWorkspace();
  const { user, logout } = useAuth();

  const handleSelect = (workspace) => {
    const success = switchWorkspace(workspace);
    if (success) {
      if (workspace === INTERFACES.PRESS) {
        navigate('/press/dashboard', { replace: true });
      } else if (workspace === INTERFACES.RP) {
        navigate('/rp/dashboard', { replace: true });
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const iconMap = {
    Mail: Mail,
    Building2: Building2
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '640px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px' }}>
            Bienvenue, {user?.name || user?.email}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Choisissez votre espace de travail
          </p>
        </div>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: availableInterfaces.length > 1 ? '1fr 1fr' : '1fr' }}>
          {availableInterfaces.map((iface) => {
            const config = WORKSPACE_CONFIG[iface];
            const IconComponent = iconMap[config.icon] || Mail;

            return (
              <button
                key={iface}
                onClick={() => handleSelect(iface)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '32px 24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = config.color;
                  e.currentTarget.style.boxShadow = `0 4px 20px ${config.color}25`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: `${config.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <IconComponent size={28} style={{ color: config.color }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px' }}>
                  {config.label}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.4' }}>
                  {config.description}
                </p>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={16} />
            Se deconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
