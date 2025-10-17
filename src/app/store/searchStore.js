import { create } from "zustand";

export const useSearchStore = create((set) => ({
  userData: null,
  searchResults: null,
  userAgreement:null,

  setUserData: (data) => set({ userData: data }),
  setUserAgreement: (data) => set ({userAgreement: data}),
  setSearchResults: (data) => set({ searchResults: data }),

  resetSearch: () => set({ userData: null, searchResults: null }),
}));
