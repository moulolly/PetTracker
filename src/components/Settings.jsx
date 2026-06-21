import { useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { db, addPet, deletePet } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Settings({ forceSetup }) {
  const [newPetName, setNewPetName] = useState('');
  const [newPetPic, setNewPetPic] = useState(null);

  const pets = useLiveQuery(() => db.pets.toArray());

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPetPic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPet = async () => {
    if (!newPetName.trim()) return;
    await addPet({
      id: crypto.randomUUID(),
      name: newPetName.trim(),
      picture: newPetPic
    });
    setNewPetName('');
    setNewPetPic(null);
  };

  const handleDeletePet = async (id) => {
    if (confirm('Are you sure you want to delete this pet and all their data?')) {
      await deletePet(id);
    }
  };

  const handleExport = async () => {
    const petsData = await db.pets.toArray();
    const eventsData = await db.events.toArray();
    const backup = { pets: petsData, events: eventsData };
    
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pet-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        await db.transaction('rw', db.pets, db.events, async () => {
          await db.pets.clear();
          await db.events.clear();
          if (data.pets) await db.pets.bulkAdd(data.pets);
          if (data.events) {
            // Remove 'id' if restoring auto-increment logic or keep it if we want exact IDs
            const cleanedEvents = data.events.map(ev => {
              const { id, ...rest } = ev;
              return rest;
            });
            await db.events.bulkAdd(cleanedEvents);
          }
        });
        alert('Data imported successfully!');
        window.location.reload();
      } catch (err) {
        alert('Failed to import data: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (forceSetup) {
    return (
      <div className="view">
        <div className="glass-panel text-center animate-pop">
          <h2>Welcome to PetTracker! 🐾</h2>
          <p>Let's add your first pet to get started.</p>
        </div>
        <div className="glass-panel animate-pop" style={{marginTop: '16px'}}>
          <h3>Add a Pet</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px'}}>
            <input 
              type="text" 
              placeholder="Pet's Name" 
              className="glass-input" 
              value={newPetName}
              onChange={e => setNewPetName(e.target.value)}
            />
            <button className="glass-button primary" onClick={handleAddPet}>Add Pet</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-pop">
      <div className="glass-panel animate-pop">
        <h3>Add a Pet</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px'}}>
          <input 
            type="text" 
            placeholder="Pet's Name" 
            className="glass-input" 
            value={newPetName}
            onChange={e => setNewPetName(e.target.value)}
          />
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            {newPetPic && <img src={newPetPic} alt="Preview" style={{width: 60, height: 60, borderRadius: '50%', objectFit: 'cover'}} />}
            <label className="glass-button" style={{flex: 1, fontSize: '0.9rem', padding: '12px'}}>
              Choose Picture
              <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleImageUpload} />
            </label>
          </div>
          <button className="glass-button primary" onClick={handleAddPet}>Add Pet</button>
        </div>
      </div>

      <div className="glass-panel animate-pop" style={{marginTop: '16px'}}>
        <h3>Manage Pets</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px'}}>
          {pets?.map(pet => (
            <div key={pet.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                {pet.picture ? (
                  <img src={pet.picture} style={{width: 40, height: 40, borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  <div style={{width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'}}>{pet.name[0]}</div>
                )}
                <span style={{fontWeight: 'bold'}}>{pet.name}</span>
              </div>
              <button className="glass-button" style={{padding: '8px', color: '#d63031', border: 'none', background: 'transparent'}} onClick={() => handleDeletePet(pet.id)}>
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel animate-pop" style={{marginTop: '16px'}}>
        <h3>Data & Backup</h3>
        <div style={{display: 'flex', gap: '12px', marginTop: '16px'}}>
          <button className="glass-button" style={{flex: 1, flexDirection: 'column', fontSize: '0.9rem'}} onClick={handleExport}>
            <Download size={24} /> Export
          </button>
          <label className="glass-button" style={{flex: 1, flexDirection: 'column', fontSize: '0.9rem'}}>
            <Upload size={24} /> Import
            <input type="file" accept=".json" style={{display: 'none'}} onChange={handleImport} />
          </label>
        </div>
      </div>
    </div>
  );
}
