import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Home, Calendar as CalendarIcon, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import Settings from './components/Settings';
import PetSwitcher from './components/PetSwitcher';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activePetId, setActivePetId] = useState(null);

  const pets = useLiveQuery(() => db.pets.toArray(), []);

  useEffect(() => {
    if (pets && pets.length > 0 && !activePetId) {
      setActivePetId(pets[0].id);
    }
  }, [pets, activePetId]);

  if (!pets) return null; // loading

  if (pets.length === 0) {
    return (
      <div className="page-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Settings forceSetup={true} />
      </div>
    );
  }

  const activePet = pets.find(p => p.id === activePetId) || pets[0];

  return (
    <>
      <PetSwitcher pets={pets} activePetId={activePetId} onSelectPet={setActivePetId} />
      
      {activeTab === 'dashboard' && <Dashboard activePet={activePet} />}
      {activeTab === 'calendar' && <CalendarView activePet={activePet} />}
      {activeTab === 'settings' && <Settings forceSetup={false} />}

      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Home size={24} />
          <span>Home</span>
        </div>
        <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <CalendarIcon size={24} />
          <span>Calendar</span>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <SettingsIcon size={24} />
          <span>Settings</span>
        </div>
      </nav>
    </>
  );
}

export default App;
