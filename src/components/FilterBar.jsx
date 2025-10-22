function FilterBar({ filters, setFilters }) {
  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex gap-4 mb-4">
      <select name="periodicity" onChange={handleChange} className="p-2 border rounded">
        <option value="">Toutes les périodicités</option>
        <option value="Quotidien">Quotidien</option>
        <option value="Hebdomadaire">Hebdomadaire</option>
        <option value="Mensuel">Mensuel</option>
      </select>

      <select name="zone" onChange={handleChange} className="p-2 border rounded">
        <option value="">Toutes les zones</option>
        <option value="National">National</option>
        <option value="Régional">Régional</option>
        <option value="International">International</option>
      </select>
    </div>
  );
}

export default FilterBar;
