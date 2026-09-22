import { create } from 'zustand';

const useStore = create((set) => ({
  // Active plan
  activePlanId: localStorage.getItem('activePlanId') || null,
  setActivePlanId: (id) => {
    if (id) localStorage.setItem('activePlanId', id);
    else localStorage.removeItem('activePlanId');
    set({ activePlanId: id });
  },

  // Active topic context for AI Tutor
  activeTopic: null, // { id, name, subject }
  setActiveTopic: (topic) => set({ activeTopic: topic }),

  // Tutor panel visibility
  tutorOpen: false,
  setTutorOpen: (bool) => set({ tutorOpen: bool }),

  // Mobile sidebar
  sidebarOpen: false,
  setSidebarOpen: (bool) => set({ sidebarOpen: bool }),

  // Today's plan context
  todayProgress: { completed: 0, total: 0 },
  setTodayProgress: (progress) => set({ todayProgress: progress }),
}));

export default useStore;
