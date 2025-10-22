-- MIGRATION 001: Création de la table calls pour le système de phoning Ringover
-- PressPilot by BandStream - Système de gestion des appels

-- Création de la table des appels
CREATE TABLE IF NOT EXISTS calls (
    id SERIAL PRIMARY KEY,

    -- Relation avec les contacts et utilisateurs
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Informations de l'appel
    phone_number VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP NULL,
    duration INTEGER NOT NULL DEFAULT 0 CHECK (duration >= 0),

    -- Statut de l'appel
    status VARCHAR(20) NOT NULL DEFAULT 'connecting'
        CHECK (status IN ('connecting', 'connected', 'ended', 'missed', 'no-answer', 'busy')),

    -- Notes et enregistrements
    notes TEXT,
    recording_url VARCHAR(500),

    -- Intégration Ringover
    ringover_call_id VARCHAR(100),

    -- Métadonnées additionnelles (JSON)
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_phone_number ON calls(phone_number);
CREATE INDEX IF NOT EXISTS idx_calls_user_started ON calls(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_ringover_id ON calls(ringover_call_id);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_calls_user_contact_date ON calls(user_id, contact_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status_date ON calls(status, started_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Calcul automatique de la durée si les dates sont définies
    IF NEW.started_at IS NOT NULL AND NEW.ended_at IS NOT NULL THEN
        NEW.duration = GREATEST(0, EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER);
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE calls IS 'Table des appels téléphoniques avec intégration Ringover';
COMMENT ON COLUMN calls.contact_id IS 'ID du contact appelé (optionnel)';
COMMENT ON COLUMN calls.user_id IS 'ID de l\'utilisateur qui passe l\'appel';
COMMENT ON COLUMN calls.phone_number IS 'Numéro de téléphone appelé';
COMMENT ON COLUMN calls.started_at IS 'Date et heure de début d\'appel';
COMMENT ON COLUMN calls.ended_at IS 'Date et heure de fin d\'appel';
COMMENT ON COLUMN calls.duration IS 'Durée de l\'appel en secondes';
COMMENT ON COLUMN calls.status IS 'Statut de l\'appel (connecting, connected, ended, missed, no-answer, busy)';
COMMENT ON COLUMN calls.notes IS 'Notes prises pendant ou après l\'appel';
COMMENT ON COLUMN calls.recording_url IS 'URL de l\'enregistrement de l\'appel';
COMMENT ON COLUMN calls.ringover_call_id IS 'ID de l\'appel dans le système Ringover';
COMMENT ON COLUMN calls.metadata IS 'Métadonnées additionnelles (qualité, codec, etc.)';

-- Vue pour les statistiques d'appels
CREATE OR REPLACE VIEW call_stats AS
SELECT
    user_id,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN status = 'ended' THEN 1 END) as successful_calls,
    COUNT(CASE WHEN status = 'missed' OR status = 'no-answer' THEN 1 END) as missed_calls,
    AVG(CASE WHEN status = 'ended' THEN duration END)::INTEGER as avg_duration,
    SUM(CASE WHEN status = 'ended' THEN duration ELSE 0 END) as total_duration,
    MAX(started_at) as last_call_date,
    COUNT(DISTINCT contact_id) as unique_contacts_called
FROM calls
GROUP BY user_id;

COMMENT ON VIEW call_stats IS 'Vue avec statistiques d\'appels par utilisateur';

-- Vue pour les appels récents avec informations contact
CREATE OR REPLACE VIEW recent_calls_with_contacts AS
SELECT
    c.id,
    c.user_id,
    c.contact_id,
    c.phone_number,
    c.started_at,
    c.ended_at,
    c.duration,
    c.status,
    c.notes,
    c.recording_url,
    -- Informations contact (si disponible)
    ct.name as contact_name,
    ct.company as contact_company,
    ct.email as contact_email
FROM calls c
LEFT JOIN contacts ct ON c.contact_id = ct.id
ORDER BY c.started_at DESC;

COMMENT ON VIEW recent_calls_with_contacts IS 'Vue des appels récents avec informations des contacts';

-- Fonction pour nettoyer les anciens appels (rétention de données)
CREATE OR REPLACE FUNCTION cleanup_old_calls(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM calls
    WHERE started_at < NOW() - INTERVAL '1 day' * retention_days
    AND status IN ('missed', 'no-answer'); -- Garder les appels réussis plus longtemps

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_calls IS 'Fonction pour nettoyer les anciens appels selon la politique de rétention';

-- Données de test pour le développement (optionnel)
-- INSERT INTO calls (user_id, contact_id, phone_number, started_at, ended_at, duration, status, notes)
-- VALUES
--     (1, 1, '+33123456789', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '55 minutes', 300, 'ended', 'Appel réussi avec Marie'),
--     (1, 2, '+33987654321', NOW() - INTERVAL '2 hours', NULL, 0, 'missed', 'Pas de réponse'),
--     (1, 1, '+33123456789', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes', 600, 'ended', 'Suivi du projet');

-- Grant des permissions (ajustez selon vos besoins)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON calls TO presspilot_app;
-- GRANT USAGE, SELECT ON SEQUENCE calls_id_seq TO presspilot_app;
-- GRANT SELECT ON call_stats TO presspilot_app;
-- GRANT SELECT ON recent_calls_with_contacts TO presspilot_app;