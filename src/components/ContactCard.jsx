function ContactCard({ contact, isSelected, toggleSelection }) {
  return (
    <li className="p-4 bg-white shadow rounded flex items-start gap-4">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => toggleSelection(contact.id)}
        className="mt-1"
      />
      <div>
        <h3 className="font-semibold text-lg">{contact.journalist_name}</h3>
        <p className="text-sm text-gray-600">{contact.media_name}</p>
        <p className="text-xs text-gray-400">
          {contact.periodicity} — {contact.zone}
        </p>
      </div>
    </li>
  );
}

export default ContactCard;
