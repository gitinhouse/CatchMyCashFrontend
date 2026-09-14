import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSearchStore = create(persist((set, get) => ({
  // Existing state
  userData: null,
  searchResults: null,
  ownPropertyIds: null,
  userAgreement: null,
  userDocument: null,
  userSignedAgreement: null,
  userAllDocs: null,
  userCase: null,
  userLogin: null,

  // Step management state
  currentStep: 'landing',
  propertyData: null,
  isTransitioning: false,

  // Existing setters
  setUserData: (data) => set({ userData: data }),
  setUserLogin: (data) => set({ userLogin: data }),
  setUserAgreement: (data) => set({ userAgreement: data }),
  setSearchResults: (data) => set({ searchResults: data }),
  setOwnPropertyIds: (data) => set({ ownPropertyIds: data }),
  setUserDocument: (data) => set({ userDocument: data }),
  setuserSignedAgreement: (data) => set({ userSignedAgreement: data }),
  setUserAllDocs: (data) => set({ userAllDocs: data }),
  setUserCase: (data) => set({ userCase: data }),

  resetSearch: () =>
    set({ userData: null, searchResults: null, userAgreement: null }),

  resetAll: () =>
    set({
      userData: null,
      searchResults: null,
      userAgreement: null,
      userDocument: null,
      userSignedAgreement: null,
      userAllDocs: null,
      ownPropertyIds: null,
      userCase: null,
      userLogin: null,
      currentStep: 'landing',
      propertyData: null,
      isTransitioning: false,
    }),

  // Step management methods
  setCurrentStep: (step) => set({ currentStep: step }),

  setPropertyData: (data) => set({ propertyData: data }),

  setIsTransitioning: (isTransitioning) => set({ isTransitioning }),

  // Navigate to a specific step with optional data
  navigateToStep: (step, data = null) => {
    set({ isTransitioning: true });

    setTimeout(() => {
      set({
        currentStep: step,
        isTransitioning: false,
      });

      if (data) {
        if (step === 'results') {
          set({ propertyData: data });
        } else if (step === 'automation') {
          set({ userData: data });
        }
      }

      window.scrollTo(0, 0);
    }, 300);
  },

  // Step navigation helpers
  goToLanding: () => get().navigateToStep('landing'),
  goToSearch: () => get().navigateToStep('search'),
  goToResults: (propertyData) => get().navigateToStep('results', propertyData),
  goToUserInfo: () => get().navigateToStep('userinfo'),
  goToAutomation: (userData) => get().navigateToStep('automation', userData),
  goToDocuments: () => get().navigateToStep('documents'),
  goToTracking: () => get().navigateToStep('tracking'),
  goToLeaderboard: () => get().navigateToStep('leaderboard'),
  goToReferral: () => get().navigateToStep('referral'),

  // Go back to previous step
  goBack: () => {
    const stepOrder = [
      'landing',
      'search',
      'results',
      'userinfo',
      'automation',
      'documents',
      'tracking',
      'leaderboard',
      'referral',
    ];

    const currentIndex = stepOrder.indexOf(get().currentStep);
    if (currentIndex > 0) {
      const previousStep = stepOrder[currentIndex - 1];
      get().navigateToStep(previousStep);
    }
  },
}),
  {
    name: 'catchmycash-search-store', // localStorage key
    storage: createJSONStorage(() => localStorage),
    // Don't persist transient UI flags — only persist the data that matters
    partialize: (state) => ({
      userData: state.userData,
      searchResults: state.searchResults,
      ownPropertyIds: state.ownPropertyIds,
      userAgreement: state.userAgreement,
      userDocument: state.userDocument,
      userSignedAgreement: state.userSignedAgreement,
      userAllDocs: state.userAllDocs,
      userCase: state.userCase,
      userLogin: state.userLogin,
      currentStep: state.currentStep,
      propertyData: state.propertyData,
      // isTransitioning intentionally excluded
    }),
  },
),
);
