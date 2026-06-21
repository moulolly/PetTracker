import { useState } from 'react';
import { Cookie, Droplet, Smile, Meh, Frown, MessageSquare, Trash2 } from 'lucide-react';
import { db, addEvent, updateEvent, deleteEvent } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Dashboard({ activePet }) {
  const [pooModalOpen, setPooModalOpen] = useState(false);
  const [feedingModalOpen, setFeedingModalOpen] = useState(false);
  const [peeModalOpen, setPeeModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [editTime, setEditTime] = useState('');

  const todayStr = new Date().toLocaleDateString();
  const events = useLiveQuery(
    () => db.events.where({ petId: activePet.id, dateStr: todayStr }).reverse().sortBy('timestamp'),
    [activePet.id, todayStr]
  );

  const handleAddEvent = async (type, consistency = null) => {
    await addEvent({
      petId: activePet.id,
      type,
      consistency,
      comment: '',
      timestamp: Date.now()
    });
    if (pooModalOpen) setPooModalOpen(false);
    if (feedingModalOpen) setFeedingModalOpen(false);
    if (peeModalOpen) setPeeModalOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    
    const [hours, minutes] = editTime.split(':');
    const newDate = new Date(editingEvent.timestamp);
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));

    await updateEvent(editingEvent.id, { 
      comment: editComment,
      timestamp: newDate.getTime()
    });
    setEditingEvent(null);
  };

  const handleDeleteEvent = async (id) => {
    if (confirm('Delete this event?')) {
      await deleteEvent(id);
      if (editingEvent?.id === id) setEditingEvent(null);
    }
  };

  return (
    <div className="page-container animate-pop">
      <div className="glass-panel text-center">
        {activePet.picture ? (
          <img src={activePet.picture} alt={activePet.name} style={{width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', border: '4px solid white'}} />
        ) : (
          <div style={{width: 120, height: 120, borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem'}}>
            {activePet.name[0]}
          </div>
        )}
        <h2>{activePet.name}</h2>
        <p style={{opacity: 0.8}}>How is {activePet.name} doing today?</p>
      </div>

      <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
        <button className="glass-button primary" style={{flex: 1, flexDirection: 'column'}} onClick={() => setFeedingModalOpen(true)}>
          <Cookie size={32} />
          Feeding
        </button>
        <button className="glass-button primary" style={{flex: 1, flexDirection: 'column', background: '#0984e3'}} onClick={() => setPeeModalOpen(true)}>
          <Droplet size={32} />
          Pee
        </button>
        <button className="glass-button primary" style={{flex: 1, flexDirection: 'column', background: '#e17055'}} onClick={() => setPooModalOpen(true)}>
          <Smile size={32} />
          Poo
        </button>
      </div>

      {feedingModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'}}>
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)'}} onClick={() => setFeedingModalOpen(false)} />
          <div className="glass-panel animate-pop" style={{background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', position: 'relative'}}>
            <h3 style={{textAlign: 'center'}}>How much did they eat?</h3>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              <button className="glass-button" style={{flex: '1 1 30%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('feeding', 'Finished')}>Finished</button>
              <button className="glass-button" style={{flex: '1 1 30%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('feeding', 'Half')}>Half</button>
              <button className="glass-button" style={{flex: '1 1 30%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('feeding', 'Nibbled')}>Nibbled</button>
            </div>
            <button className="glass-button" onClick={() => setFeedingModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {peeModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'}}>
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)'}} onClick={() => setPeeModalOpen(false)} />
          <div className="glass-panel animate-pop" style={{background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', position: 'relative'}}>
            <h3 style={{textAlign: 'center'}}>How big was it?</h3>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              <button className="glass-button" style={{flex: '1 1 40%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('pee', 'Large')}>Large</button>
              <button className="glass-button" style={{flex: '1 1 40%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('pee', 'Medium')}>Medium</button>
              <button className="glass-button" style={{flex: '1 1 40%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('pee', 'Small')}>Small</button>
              <button className="glass-button" style={{flex: '1 1 40%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('pee', 'Spot')}>Spot</button>
            </div>
            <button className="glass-button" onClick={() => setPeeModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {pooModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'}}>
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)'}} onClick={() => setPooModalOpen(false)} />
          <div className="glass-panel animate-pop" style={{background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', position: 'relative'}}>
            <h3 style={{textAlign: 'center'}}>How was it?</h3>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              <button className="glass-button" style={{flex: '1 1 40%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('poo', 'Hard')}>
                <Smile size={24} color="#8e44ad" /> Hard
              </button>
              <button className="glass-button" style={{flex: '1 1 40%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('poo', 'Firm')}>
                <Smile size={24} color="#00b894" /> Firm
              </button>
              <button className="glass-button" style={{flex: '1 1 40%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('poo', 'Soft')}>
                <Meh size={24} color="#fdcb6e" /> Soft
              </button>
              <button className="glass-button" style={{flex: '1 1 40%', flexDirection: 'column', padding: '8px'}} onClick={() => handleAddEvent('poo', 'Runny')}>
                <Frown size={24} color="#d63031" /> Runny
              </button>
            </div>
            <button className="glass-button" onClick={() => setPooModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {editingEvent && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'}}>
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)'}} onClick={() => setEditingEvent(null)} />
          <div className="glass-panel animate-pop" style={{background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', position: 'relative'}}>
            <h3 style={{textAlign: 'center', textTransform: 'capitalize'}}>{editingEvent.type} Details</h3>
            
            <textarea 
              className="glass-input" 
              placeholder="Add a comment..." 
              value={editComment} 
              onChange={e => setEditComment(e.target.value)}
              style={{minHeight: '80px', resize: 'vertical'}}
            />

            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <label style={{fontWeight: 'bold', opacity: 0.8}}>Time:</label>
              <input 
                type="time" 
                className="glass-input" 
                value={editTime}
                onChange={e => setEditTime(e.target.value)}
                style={{flex: 1}}
              />
            </div>

            <div style={{display: 'flex', gap: '8px'}}>
              <button className="glass-button primary" style={{flex: 1}} onClick={handleSaveEdit}>Save</button>
              <button className="glass-button" style={{flex: 1}} onClick={() => setEditingEvent(null)}>Cancel</button>
            </div>
            <button className="glass-button" style={{color: '#d63031', border: '1px solid rgba(214,48,49,0.3)'}} onClick={() => handleDeleteEvent(editingEvent.id)}>
              <Trash2 size={20} /> Delete Event
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{flex: 1}}>
        <h3>Today's Timeline</h3>
        <div style={{marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {!events?.length && <p style={{textAlign: 'center', opacity: 0.6}}>No events logged today.</p>}
          {events?.map(event => (
            <div key={event.id} style={{display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.4)', padding: '12px', borderRadius: '12px', cursor: 'pointer'}} onClick={() => { 
              setEditingEvent(event); 
              setEditComment(event.comment || ''); 
              const d = new Date(event.timestamp);
              setEditTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
            }}>
              <div style={{background: 'white', padding: '8px', borderRadius: '50%', color: event.type === 'poo' ? '#e17055' : event.type === 'pee' ? '#0984e3' : 'var(--primary)'}}>
                {event.type === 'feeding' && <Cookie size={24} />}
                {event.type === 'pee' && <Droplet size={24} />}
                {event.type === 'poo' && <Smile size={24} />}
              </div>
              <div style={{flex: 1}}>
                <div style={{fontWeight: 'bold', textTransform: 'capitalize'}}>{event.type}</div>
                {event.consistency && (
                  <div style={{fontSize: '0.8rem', opacity: 0.8}}>
                    {event.type === 'poo' ? 'Consistency: ' : event.type === 'feeding' ? 'Amount: ' : 'Size: '}
                    {event.consistency}
                  </div>
                )}
                {event.comment && (
                  <div style={{fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <MessageSquare size={12} /> {event.comment}
                  </div>
                )}
              </div>
              <div style={{fontSize: '0.8rem', opacity: 0.7}}>
                {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
