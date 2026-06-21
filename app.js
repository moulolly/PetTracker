const DB_NAME = 'PetTrackerVanilla';
const DB_VERSION = 1;

const app = {
  db: null,
  pets: [],
  events: [],
  activePetId: null,
  currentView: '',
  currentDate: new Date(),
  selectedDate: new Date(),
  editingEvent: null,

  isFallback: false,

  async init() {
    try {
      await this.initDB();
      await this.loadData();
    } catch (err) {
      console.warn("IndexedDB blocked (likely due to file:/// protocol security). Falling back to temporary in-memory storage.", err);
      this.isFallback = true;
      this.pets = [];
      this.events = [];
      alert("Warning: Your browser is blocking local database access because you are running this from a local file. The app will work, but data will NOT be saved when you close the tab. To fix this, please run it using a local web server, or use Chrome.");
    }
    
    if (this.pets.length === 0) {
      this.switchView('setup');
    } else {
      this.activePetId = this.pets[0].id;
      this.switchView('dashboard');
    }

    this.attachListeners();
  },

  initDB() {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = event => reject(event.target.error);
        request.onsuccess = event => {
          this.db = event.target.result;
          resolve();
        };
        request.onupgradeneeded = event => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('pets')) {
            db.createObjectStore('pets', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('events')) {
            const store = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
            store.createIndex('petId_dateStr', ['petId', 'dateStr'], { unique: false });
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  },

  loadData() {
    return new Promise((resolve, reject) => {
      if (this.isFallback) return resolve();
      try {
        const tx = this.db.transaction(['pets', 'events'], 'readonly');
        const storePets = tx.objectStore('pets');
        const storeEvents = tx.objectStore('events');
        
        const reqPets = storePets.getAll();
        const reqEvents = storeEvents.getAll();
        
        tx.oncomplete = () => {
          this.pets = reqPets.result || [];
          this.events = reqEvents.result || [];
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  },

  async reloadData() {
    await this.loadData();
    this.render();
  },

  // ===================
  // ROUTING & RENDERING
  // ===================
  switchView(viewId) {
    this.currentView = viewId;
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');

    const bottomNav = document.getElementById('bottom-nav');
    if (viewId === 'setup') {
      bottomNav.classList.add('hidden');
      document.getElementById('pet-switcher-container').classList.add('hidden');
    } else {
      bottomNav.classList.remove('hidden');
      document.getElementById('pet-switcher-container').classList.remove('hidden');
    }

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewId);
    });

    this.render();
  },

  render() {
    this.renderPetSwitcher();
    if (this.currentView === 'dashboard') this.renderDashboard();
    if (this.currentView === 'calendar') this.renderCalendar();
    if (this.currentView === 'settings') this.renderSettings();
  },

  renderPetSwitcher() {
    const container = document.getElementById('pet-switcher-container');
    container.innerHTML = '';
    if (this.pets.length === 0) return;

    this.pets.forEach(pet => {
      const el = document.createElement('div');
      el.className = `pet-item ${this.activePetId === pet.id ? 'active' : ''}`;
      el.onclick = () => {
        this.activePetId = pet.id;
        this.render();
      };
      
      const avatar = pet.picture 
        ? `<img src="${pet.picture}" class="avatar-small">`
        : `<div class="avatar-small">${pet.name[0]}</div>`;
        
      el.innerHTML = `${avatar}<span style="font-size:0.75rem;font-weight:bold;white-space:nowrap;">${pet.name}</span>`;
      container.appendChild(el);
    });

    // Add button
    const addBtn = document.createElement('div');
    addBtn.className = 'pet-item';
    addBtn.onclick = () => this.switchView('settings');
    addBtn.innerHTML = `
      <div style="width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,0.5);display:flex;align-items:center;justify-content:center;border:2px dashed var(--text-dark);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      <span style="font-size:0.75rem;">Add</span>
    `;
    container.appendChild(addBtn);
  },

  renderDashboard() {
    const activePet = this.pets.find(p => p.id === this.activePetId);
    if (!activePet) return;

    const picEl = document.getElementById('dash-pet-pic');
    if (activePet.picture) {
      picEl.style.background = `url(${activePet.picture}) center/cover`;
      picEl.innerHTML = '';
    } else {
      picEl.style.background = 'var(--primary)';
      picEl.innerHTML = activePet.name[0];
    }
    document.getElementById('dash-pet-name').innerText = activePet.name;

    const todayStr = new Date().toLocaleDateString();
    const todayEvents = this.events
      .filter(e => e.petId === activePet.id && e.dateStr === todayStr)
      .sort((a, b) => b.timestamp - a.timestamp);

    this.renderTimeline(document.getElementById('dash-timeline'), todayEvents);
  },

  renderCalendar() {
    const activePet = this.pets.find(p => p.id === this.activePetId);
    if (!activePet) return;

    const monthYearStr = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('cal-month-year').innerText = monthYearStr;

    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    for (let i = 0; i < firstDay.getDay(); i++) {
      grid.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), i);
      const el = document.createElement('div');
      
      const isSelected = day.toLocaleDateString() === this.selectedDate.toLocaleDateString();
      el.className = `cal-day ${isSelected ? 'active' : ''}`;
      el.innerText = i;
      el.onclick = () => {
        this.selectedDate = day;
        this.renderCalendar();
      };
      grid.appendChild(el);
    }

    document.getElementById('cal-selected-date').innerText = `History for ${this.selectedDate.toLocaleDateString()}`;

    const selDateStr = this.selectedDate.toLocaleDateString();
    const dayEvents = this.events
      .filter(e => e.petId === activePet.id && e.dateStr === selDateStr)
      .sort((a, b) => b.timestamp - a.timestamp);

    this.renderTimeline(document.getElementById('cal-timeline'), dayEvents);
  },

  renderTimeline(container, evts) {
    container.innerHTML = '';
    if (evts.length === 0) {
      container.innerHTML = `<p style="text-align:center;opacity:0.6;">No events logged.</p>`;
      return;
    }

    evts.forEach(event => {
      const el = document.createElement('div');
      el.className = 'timeline-item';
      el.onclick = () => this.openEditModal(event);

      let icon = '';
      let color = '';
      if (event.type === 'feeding') { icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/></svg>'; color = 'var(--primary)'; }
      if (event.type === 'pee') { icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>'; color = '#0984e3'; }
      if (event.type === 'poo') { icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'; color = '#e17055'; }

      let lbl = '';
      if (event.consistency) {
        let prefix = event.type === 'poo' ? 'Consistency: ' : event.type === 'feeding' ? 'Amount: ' : 'Size: ';
        lbl = `<div style="font-size:0.8rem;opacity:0.8;">${prefix}${event.consistency}</div>`;
      }

      let cmt = event.comment 
        ? `<div style="font-size:0.85rem;opacity:0.9;margin-top:4px;display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${event.comment}</div>`
        : '';

      const timeStr = new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      el.innerHTML = `
        <div class="timeline-icon" style="color:${color}">${icon}</div>
        <div style="flex:1">
          <div style="font-weight:bold;text-transform:capitalize;">${event.type}</div>
          ${lbl}
          ${cmt}
        </div>
        <div style="font-size:0.8rem;opacity:0.7;">${timeStr}</div>
      `;
      container.appendChild(el);
    });
  },

  renderSettings() {
    const list = document.getElementById('settings-pet-list');
    list.innerHTML = '';
    this.pets.forEach(pet => {
      const el = document.createElement('div');
      el.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(255,255,255,0.4);border-radius:12px;';
      
      const avatar = pet.picture 
        ? `<img src="${pet.picture}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`
        : `<div style="width:40px;height:40px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${pet.name[0]}</div>`;
        
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          ${avatar}
          <span style="font-weight:bold;">${pet.name}</span>
        </div>
        <button class="glass-button" style="padding:8px;color:#d63031;border:none;background:transparent;" onclick="app.deletePet('${pet.id}')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      `;
      list.appendChild(el);
    });
  },

  // ===================
  // ACTIONS & LOGIC
  // ===================
  changeMonth(delta) {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + delta, 1);
    this.renderCalendar();
  },

  openModal(id) {
    document.getElementById('modal-container').classList.remove('hidden');
    document.querySelectorAll('.modal-content').forEach(m => m.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
  },
  
  closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
    this.editingEvent = null;
  },

  openEditModal(event) {
    this.editingEvent = event;
    document.getElementById('edit-modal-title').innerText = `${event.type} Details`;
    document.getElementById('edit-modal-comment').value = event.comment || '';
    this.openModal('modal-edit');
  },

  async addEvent(type, consistency) {
    const event = {
      id: this.isFallback ? Date.now() : undefined,
      petId: this.activePetId,
      type,
      consistency,
      comment: '',
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString()
    };
    
    if (this.isFallback) {
      this.events.push(event);
    } else {
      await new Promise((resolve) => {
        const tx = this.db.transaction(['events'], 'readwrite');
        tx.objectStore('events').add(event);
        tx.oncomplete = () => resolve();
      });
    }
    this.closeModal();
    await this.reloadData();
  },

  async saveEventEdit() {
    if (!this.editingEvent) return;
    this.editingEvent.comment = document.getElementById('edit-modal-comment').value;
    
    if (!this.isFallback) {
      await new Promise((resolve) => {
        const tx = this.db.transaction(['events'], 'readwrite');
        tx.objectStore('events').put(this.editingEvent);
        tx.oncomplete = () => resolve();
      });
    }
    this.closeModal();
    await this.reloadData();
  },

  async deleteCurrentEvent() {
    if (!this.editingEvent || !confirm('Delete this event?')) return;
    const id = this.editingEvent.id;
    
    if (this.isFallback) {
      this.events = this.events.filter(e => e.id !== id);
    } else {
      await new Promise((resolve) => {
        const tx = this.db.transaction(['events'], 'readwrite');
        tx.objectStore('events').delete(id);
        tx.oncomplete = () => resolve();
      });
    }
    this.closeModal();
    await this.reloadData();
  },

  async addPet(name, pictureBase64) {
    if (!name.trim()) return;
    
    // Fallback UUID generator since crypto.randomUUID() requires HTTPS
    const generateId = () => {
      return window.crypto && window.crypto.randomUUID 
        ? window.crypto.randomUUID() 
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
    };

    const pet = {
      id: generateId(),
      name: name.trim(),
      picture: pictureBase64
    };
    
    if (this.isFallback) {
      this.pets.push(pet);
    } else {
      await new Promise((resolve) => {
        const tx = this.db.transaction(['pets'], 'readwrite');
        tx.objectStore('pets').add(pet);
        tx.oncomplete = () => resolve();
      });
    }
    
    document.getElementById('setup-pet-name').value = '';
    document.getElementById('settings-pet-name').value = '';
    document.getElementById('settings-pet-pic-preview').style.display = 'none';
    
    if (!this.activePetId) this.activePetId = pet.id;
    
    await this.reloadData();
    if (this.currentView === 'setup') this.switchView('dashboard');
  },

  async deletePet(id) {
    if (this.isFallback) {
      this.pets = this.pets.filter(p => p.id !== id);
    } else {
      await new Promise((resolve) => {
        const tx = this.db.transaction(['pets'], 'readwrite');
        tx.objectStore('pets').delete(id);
        tx.oncomplete = () => resolve();
      });
    }
    
    if (this.activePetId === id) {
      this.activePetId = this.pets.length > 0 ? this.pets[0].id : null;
    }
    
    await this.reloadData();
    if (this.pets.length === 0) this.switchView('setup');
  },

  // ===================
  // LISTENERS / HELPERS
  // ===================
  attachListeners() {
    // Already attached in init
  },

  handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const prev = document.getElementById('settings-pet-pic-preview');
      prev.src = event.target.result;
      prev.style.display = 'block';
    };
    reader.readAsDataURL(file);
  },

  addPetFromSettings() {
    const name = document.getElementById('settings-pet-name').value;
    const pic = document.getElementById('settings-pet-pic-preview').src;
    this.addPet(name, pic && pic.startsWith('data:') ? pic : null);
  },

  exportData() {
    const dataStr = JSON.stringify({ pets: this.pets, events: this.events });
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pet-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  },

  importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (this.isFallback) {
          this.pets = data.pets || [];
          this.events = data.events || [];
          alert('Data imported into memory! It will be lost when you refresh.');
          await this.reloadData();
          if (this.pets.length > 0) this.activePetId = this.pets[0].id;
          this.switchView('dashboard');
        } else {
          const tx = this.db.transaction(['pets', 'events'], 'readwrite');
          tx.objectStore('pets').clear();
          tx.objectStore('events').clear();
          
          if (data.pets) data.pets.forEach(p => tx.objectStore('pets').add(p));
          if (data.events) data.events.forEach(ev => {
            // make sure old imported events don't overwrite autoIncrement id if they have it
            if (ev.id) delete ev.id;
            tx.objectStore('events').add(ev);
          });
          
          tx.oncomplete = async () => {
            alert('Data imported successfully!');
            await this.reloadData();
            if (this.pets.length > 0) this.activePetId = this.pets[0].id;
            this.switchView('dashboard');
          };
        }
      } catch (err) {
        alert('Failed to import data: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
};

window.onload = () => app.init();
