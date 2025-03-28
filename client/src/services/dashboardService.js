import api from './api';
import { getUserBookings, getUpcomingUserBookings } from './bookingService';
import { getTeams } from './teamService';

// Get all dashboard data in one call
export const getDashboardData = async () => {
  try {
    // Fetch all required data in parallel
    const [upcomingBookings, userBookings] = await Promise.all([
      getUpcomingUserBookings(3),
      getUserBookings()
    ]);

    // Calculate stats
    const stats = {
      totalBookings: userBookings.length,
      upcomingBookings: upcomingBookings.length
    };

    return {
      stats,
      upcomingBookings
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Get recent activity for the dashboard
export const getRecentActivity = async (limit = 4) => {
  try {
    // Fetch the raw data for various activities
    const [bookings, teamUpdates] = await Promise.all([
      getUserBookings(),
      getTeams() // Placeholder - in a real system, we'd have a team updates API
    ]);

    // Process bookings into activity items
    const bookingActivities = bookings.slice(0, 5).map(booking => ({
      id: `booking-${booking._id}`,
      type: 'booking',
      title: 'New Booking',
      description: `${booking.court.name} booked for ${booking.purpose || 'use'}`,
      time: formatTimeAgo(new Date(booking.createdAt))
    }));

    // For now, simulate other activities
    // In a real app, these would come from actual API endpoints
    const teamActivities = [{
      id: 'team-update-1',
      type: 'team',
      title: 'Team Update',
      description: 'New player added to Eagles team',
      time: '1 day ago'
    }];

    const tournamentActivities = [{
      id: 'tournament-1',
      type: 'tournament',
      title: 'Tournament Registration',
      description: 'Summer Championship registration open',
      time: '2 days ago'
    }];

    // Combine all activities, sort by most recent, and limit
    const allActivities = [...bookingActivities, ...teamActivities, ...tournamentActivities]
      .sort((a, b) => {
        // If we have actual dates, sort by them
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        // Otherwise just maintain the order they're in
        return 0;
      })
      .slice(0, limit);

    return allActivities;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    // Return some default data in case of error
    return [];
  }
};

// Helper function to format time in a "X time ago" format
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
};

// Get active tournaments
export const getActiveTournaments = async () => {
  try {
    // For now, return placeholder data until a real tournament endpoint is available
    return [
      { id: 1, name: 'Summer Basketball Tournament' },
      { id: 2, name: 'Regional Tennis Open' }
    ];
  } catch (error) {
    console.error('Error fetching active tournaments:', error);
    return [];
  }
}; 