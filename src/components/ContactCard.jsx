import React from "react";
import { Phone, Mail, MapPin, Star, MoreHorizontal } from "lucide-react";
import "../styles/ContactsNew.css";

function ContactCard({
  contact,
  isSelected,
  onSelect,
  onCall,
  showPhoneSystem,
  showCallHistory
}) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div
      className={`contact-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect && onSelect(contact)}
    >
      <div className="contact-card-header">
        <div className="contact-avatar">
          {contact.avatar ? (
            <img src={contact.avatar} alt={contact.name} />
          ) : (
            <span className="contact-initials">{getInitials(contact.name)}</span>
          )}
          <div
            className="contact-priority-indicator"
            style={{ backgroundColor: getPriorityColor(contact.priority) }}
          />
        </div>

        <div className="contact-info">
          <h3 className="contact-name">{contact.name || contact.journalist_name}</h3>
          <p className="contact-title">{contact.title}</p>
          <p className="contact-company">{contact.company || contact.media_name}</p>
        </div>

        <div className="contact-actions">
          {contact.phone && (
            <button
              className="contact-action-btn phone"
              onClick={(e) => {
                e.stopPropagation();
                onCall && onCall(contact);
              }}
              title="Appeler"
            >
              <Phone size={16} />
            </button>
          )}

          {contact.email && (
            <button
              className="contact-action-btn email"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`mailto:${contact.email}`);
              }}
              title="Envoyer un email"
            >
              <Mail size={16} />
            </button>
          )}

          <button className="contact-action-btn more">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="contact-card-body">
        {contact.location && (
          <div className="contact-detail">
            <MapPin size={14} />
            <span>{contact.location}</span>
          </div>
        )}

        {contact.phone && (
          <div className="contact-detail">
            <Phone size={14} />
            <span>{contact.phone}</span>
          </div>
        )}

        {contact.email && (
          <div className="contact-detail">
            <Mail size={14} />
            <span>{contact.email}</span>
          </div>
        )}
      </div>

      {contact.tags && contact.tags.length > 0 && (
        <div className="contact-tags">
          {contact.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="contact-tag">
              {tag}
            </span>
          ))}
          {contact.tags.length > 3 && (
            <span className="contact-tag-more">+{contact.tags.length - 3}</span>
          )}
        </div>
      )}

      {contact.notes && (
        <div className="contact-notes">
          <p>{contact.notes.length > 100 ? `${contact.notes.slice(0, 100)}...` : contact.notes}</p>
        </div>
      )}

      {contact.priority === "high" && (
        <div className="contact-priority-badge">
          <Star size={12} fill="currentColor" />
          <span>Priorité élevée</span>
        </div>
      )}
    </div>
  );
}

export default ContactCard;
