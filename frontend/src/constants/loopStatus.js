// Shared UI status options and mapping between UI-friendly labels and API values

export const uiStatusOptions = [
  { key: '', label: 'No Status' },
  { key: 'pre-listing', label: 'Pre-Listing' },
  { key: 'private-listing', label: 'Private Listing' },
  { key: 'active-listing', label: 'Active Listing' },
  { key: 'under-contract', label: 'Under Contract' },
  { key: 'withdrawn', label: 'Withdrawn' },
  { key: 'sold', label: 'Sold' },
  { key: 'terminated', label: 'Terminated' },
  { key: 'leased', label: 'Leased' },
  { key: 'pre-offer', label: 'Pre-Offer' },
  { key: 'new', label: 'New' },
  { key: 'in-progress', label: 'In-Progress' },
  { key: 'done', label: 'Done' }
];

export const uiStatusToApi = {
  '': '',
  'pre-listing': 'active',
  'private-listing': 'active',
  'active-listing': 'active',
  'under-contract': 'under-contract',
  'withdrawn': 'withdrawn',
  'sold': 'sold',
  'terminated': 'terminated',
  'leased': 'closed',
  'pre-offer': 'pre-offer',
  'new': 'active',
  'in-progress': 'closing',
  'done': 'closed'
};
