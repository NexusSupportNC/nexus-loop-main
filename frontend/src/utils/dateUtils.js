// Date utility functions for the Real Estate Transaction Manager

export const dateUtils = {
  // Format date for display
  formatDate: (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  },

  // Format date for input fields
  formatDateForInput: (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  },

  // Format datetime for display
  formatDateTime: (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  },

  // Calculate days until a date
  getDaysUntil: (dateString) => {
    if (!dateString) return null;
    
    try {
      const targetDate = new Date(dateString);
      const today = new Date();
      
      // Reset time to start of day for accurate day calculation
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      return null;
    }
  },

  // Get countdown text for display
  getCountdownText: (dateString) => {
    const days = dateUtils.getDaysUntil(dateString);
    
    if (days === null) return 'No date set';
    
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else if (days === 1) {
      return '1 day remaining';
    } else {
      return `${days} days remaining`;
    }
  },

  // Get status based on days remaining
  getDateStatus: (dateString) => {
    const days = dateUtils.getDaysUntil(dateString);
    
    if (days === null) return 'none';
    
    if (days < 0) {
      return 'overdue';
    } else if (days === 0) {
      return 'due-today';
    } else if (days <= 3) {
      return 'due-soon';
    } else if (days <= 7) {
      return 'due-this-week';
    } else {
      return 'on-track';
    }
  },

  // Check if a date is in the past
  isPastDate: (dateString) => {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      
      date.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      return date < today;
    } catch (error) {
      return false;
    }
  },

  // Check if a date is today
  isToday: (dateString) => {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      
      return date.toDateString() === today.toDateString();
    } catch (error) {
      return false;
    }
  },

  // Check if a date is within the next N days
  isWithinDays: (dateString, days) => {
    if (!dateString) return false;
    
    try {
      const targetDate = new Date(dateString);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const today = new Date();
      
      return targetDate >= today && targetDate <= futureDate;
    } catch (error) {
      return false;
    }
  },

  // Get relative time (e.g., "2 hours ago", "3 days ago")
  getRelativeTime: (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);
      
      if (diffSeconds < 60) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else if (diffWeeks < 4) {
        return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
      } else if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
      } else {
        return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return 'Invalid date';
    }
  },

  // Get current date in YYYY-MM-DD format
  getCurrentDate: () => {
    return new Date().toISOString().split('T')[0];
  },

  // Add days to a date
  addDays: (dateString, days) => {
    try {
      const date = new Date(dateString);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  },

  // Validate date string
  isValidDate: (dateString) => {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  },

  // Get business days between two dates (excluding weekends)
  getBusinessDays: (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      let businessDays = 0;
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
          businessDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return businessDays;
    } catch (error) {
      return 0;
    }
  }
};

export default dateUtils;
