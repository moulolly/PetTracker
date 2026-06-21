import { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, Cookie, Droplet, Smile } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { db, updateEvent, deleteEvent } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function CalendarView({ activePet }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState(null);
  const [editComment, setEditComment] = useState('');

  const selectedDateStr = selectedDate.toLocaleDateString();
  const dayEvents = useLiveQuery(
    () => db.events.where({ petId: activePet.id, dateStr: selectedDateStr }).reverse().sortBy('timestamp'),
    [activePet.id, selectedDateStr]
  );

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    await updateEvent(editingEvent.id, { comment: editComment });
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
      <div className="glass-panel" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button className="glass-button" style={{padding: '8px'}} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft size={24} />
        </button>
        <h2 style={{margin: 0}}>{format(currentMonth, 'MMMM yyyy')}</h2>
        <button className="glass-button" style={{padding: '8px'}} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="glass-panel" style={{marginTop: '16px'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6}}>
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px'}}>
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            return (
              <div 
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                  color: isSelected ? 'white' : 'var(--text-dark)',
                  opacity: isCurrentMonth ? 1 : 0.3,
                  fontWeight: isSelected ? 'bold' : 'normal',
                }}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>

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

      <div className="glass-panel" style={{flex: 1, marginTop: '16px'}}>
        <h3>History for {format(selectedDate, 'MMM do, yyyy')}</h3>
        <div style={{marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {!dayEvents?.length && <p style={{textAlign: 'center', opacity: 0.6}}>No events logged.</p>}
          {dayEvents?.map(event => (
            <div key={event.id} style={{display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.4)', padding: '12px', borderRadius: '12px', cursor: 'pointer'}} onClick={() => { setEditingEvent(event); setEditComment(event.comment || ''); }}>
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
