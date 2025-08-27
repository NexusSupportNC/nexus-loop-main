export const getRelativeTime = (dateString) => {
  if (!dateString) return 'Never active';

  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  // Handle negative time differences (clock sync issues) or very recent activity
  if (diffInSeconds <= 60) {
    return 'Active less than 1 minute ago';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Active ${diffInMinutes === 1 ? '1 minute' : `${diffInMinutes} minutes`} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Active ${diffInHours === 1 ? '1 hour' : `${diffInHours} hours`} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Active ${diffInDays === 1 ? '1 day' : `${diffInDays} days`} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Active ${diffInMonths === 1 ? '1 month' : `${diffInMonths} months`} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `Active ${diffInYears === 1 ? '1 year' : `${diffInYears} years`} ago`;
};

export const getActivityStatus = (dateString) => {
  if (!dateString) return { status: 'inactive', color: '#gray' };
  
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 5) return { status: 'online', color: '#10b981' }; // green
  if (diffInMinutes < 60) return { status: 'recently', color: '#f59e0b' }; // yellow
  if (diffInMinutes < 1440) return { status: 'today', color: '#3b82f6' }; // blue
  
  return { status: 'inactive', color: '#6b7280' }; // gray
};
