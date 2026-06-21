import { Plus } from 'lucide-react';

export default function PetSwitcher({ pets, activePetId, onSelectPet }) {
  if (!pets || pets.length === 0) return null;

  return (
    <div className="pet-switcher">
      {pets.map(pet => (
        <div 
          key={pet.id} 
          className={`pet-item ${pet.id === activePetId ? 'active' : ''}`}
          onClick={() => onSelectPet(pet.id)}
        >
          {pet.picture ? (
            <img src={pet.picture} alt={pet.name} className="avatar-small" />
          ) : (
            <div className="avatar-small">{pet.name[0]}</div>
          )}
          <span style={{fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap'}}>{pet.name}</span>
        </div>
      ))}
    </div>
  );
}
