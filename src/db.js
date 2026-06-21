import Dexie from 'dexie';

export const db = new Dexie('PetTrackerReact');

db.version(1).stores({
  pets: 'id, name, picture',
  events: '++id, petId, type, timestamp, consistency, dateStr, [petId+dateStr]'
});

export const addPet = async (pet) => {
  return await db.pets.add(pet);
};

export const updatePet = async (id, changes) => {
  return await db.pets.update(id, changes);
};

export const deletePet = async (id) => {
  await db.events.where('petId').equals(id).delete();
  return await db.pets.delete(id);
};

export const addEvent = async (event) => {
  return await db.events.add({
    ...event,
    dateStr: new Date(event.timestamp).toLocaleDateString()
  });
};

export const updateEvent = async (id, changes) => {
  return await db.events.update(id, changes);
};

export const deleteEvent = async (id) => {
  return await db.events.delete(id);
};
