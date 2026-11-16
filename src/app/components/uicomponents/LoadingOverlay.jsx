import GlobalLoader from './GlobalLoader';

// Kept for its callers (Search Now in the header, the search steps): it is
// the site's one loader, shown while isTransitioning is true.
const LoadingOverlay = ({ isTransitioning, message = 'Securing your next step...' }) =>
  isTransitioning ? <GlobalLoader message={message} /> : null;

export default LoadingOverlay;
