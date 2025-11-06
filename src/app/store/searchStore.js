import { create } from "zustand";

export const useSearchStore = create((set) => ({
  userData: null,
  searchResults: null,
  userAgreement:null,
  userDocument:null,
  userSignedAgreement:null,
  userAllDocs:null,
  userCase:null,
  userLogin:null,
  setUserData: (data) => set({ userData: data }),
  setUserLogin: (data) => set({ userLogin: data }),
  setUserAgreement: (data) => set ({userAgreement: data}),
  setSearchResults: (data) => set({ searchResults: data }),
  setUserDocument: (data) => set({userDocument: data}),
  setuserSignedAgreement: (data) => set({userSignedAgreement: data}),
  setUserAllDocs: (data) => set({userAllDocs: data}),
  setUserCase: (data) => set({userCase: data}),
  resetSearch: () => set({ userData: null, searchResults: null,userAgreement:null }),
}));
