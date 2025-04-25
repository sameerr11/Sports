import api from './api';

// Get teams where current user is a coach
export const getCoachTeams = async () => {
  try {
    const response = await api.get('/teams/coach');
    return response.data;
  } catch (error) {
    console.error('Error fetching coach teams:', error);
    throw error.response?.data?.msg || 'Failed to fetch teams';
  }
};

// Get training plans assigned to current coach
export const getCoachTrainingPlans = async () => {
  try {
    const response = await api.get('/training-plans/coach');
    return response.data;
  } catch (error) {
    console.error('Error fetching coach training plans:', error);
    throw error.response?.data?.msg || 'Failed to fetch training plans';
  }
};

// Get training sessions (bookings) for coach
export const getCoachTrainingSessions = async () => {
  try {
    console.log('Fetching coach training sessions from bookings...');
    
    // First, get the coach's teams
    const coachTeams = await getCoachTeams();
    console.log('Coach teams for sessions:', coachTeams);
    
    // Get personal bookings
    const personalBookingsRes = await api.get('/bookings/me');
    const personalBookings = personalBookingsRes.data;
    console.log('Personal bookings:', personalBookings);
    
    // Fetch team-related bookings for each team
    let teamBookings = [];
    if (coachTeams && coachTeams.length > 0) {
      const teamIds = coachTeams.map(team => team._id);
      
      // Fetch bookings for each team
      const bookingsPromises = teamIds.map(teamId => 
        api.get('/bookings', { params: { team: teamId } })
          .catch(err => {
            console.error(`Error fetching bookings for team ${teamId}:`, err);
            return { data: [] };
          })
      );
      
      const bookingsResponses = await Promise.all(bookingsPromises);
      teamBookings = bookingsResponses.flatMap(res => res.data);
      console.log('Team bookings:', teamBookings);
    }
    
    // Combine personal and team bookings and remove duplicates
    const allBookings = [...personalBookings, ...teamBookings];
    const uniqueBookings = Array.from(
      new Map(allBookings.map(booking => [booking._id, booking])).values()
    );
    
    // Get all training plans to check which bookings are already assigned to plans
    let trainingPlans = [];
    try {
      // Get directly assigned plans
      const assignedPlansRes = await api.get('/training-plans/coach');
      const assignedPlans = assignedPlansRes.data || [];
      
      // Get team plans if there are teams
      const teamPlansArrays = await Promise.all(
        coachTeams.map(team => 
          team && team._id ? 
            api.get(`/training-plans/team/${team._id}`)
              .then(res => res.data)
              .catch(() => []) : 
            Promise.resolve([])
        )
      );
      
      // Combine all plans
      trainingPlans = [...assignedPlans, ...teamPlansArrays.flat()];
    } catch (err) {
      console.error('Error fetching training plans for booking filter:', err);
      trainingPlans = [];
    }
    
    // Get a list of booking IDs that are already assigned to training plans
    const assignedBookingIds = trainingPlans
      .filter(plan => plan.scheduleId)
      .map(plan => {
        if (typeof plan.scheduleId === 'object' && plan.scheduleId._id) {
          return plan.scheduleId._id;
        }
        return plan.scheduleId;
      });
    
    console.log('Booking IDs already assigned to training plans:', assignedBookingIds);
    
    // Filter for training sessions (where purpose is 'Training')
    // AND exclude those that are already assigned to training plans
    const trainingSessions = uniqueBookings.filter(booking => {
      return booking.purpose === 'Training' && 
             new Date(booking.startTime) >= new Date() &&
             !assignedBookingIds.includes(booking._id);
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    console.log('Filtered training sessions (excluded those assigned to plans):', trainingSessions);
    return trainingSessions;
  } catch (error) {
    console.error('Error fetching coach training sessions:', error);
    throw error.response?.data?.msg || 'Failed to fetch training sessions';
  }
};

// Get training schedules for coach (includes both directly assigned plans and team plans)
export const getCoachTrainingSchedules = async () => {
  try {
    console.log('Fetching coach training schedules...');
    
    // First get the teams the coach is assigned to
    const coachTeams = await getCoachTeams();
    console.log('Coach teams for schedules:', coachTeams);
    
    // Get directly assigned training plans
    const assignedPlans = await getCoachTrainingPlans();
    console.log('Coach assigned plans:', assignedPlans);
    
    // Check if teams array is valid
    if (!Array.isArray(coachTeams) || coachTeams.length === 0) {
      console.log('No coach teams found, returning only assigned plans');
      return [];  // Return empty array instead of assigned plans
    }
    
    // Get training plans for each team the coach is part of
    const teamPlansPromises = coachTeams.map(team => {
      if (!team || !team._id) {
        console.error('Invalid team object:', team);
        return Promise.resolve([]);
      }
      return getTeamTrainingPlans(team._id).catch(err => {
        console.error(`Error fetching plans for team ${team._id}:`, err);
        return [];
      });
    });
    
    const teamPlansArrays = await Promise.all(teamPlansPromises);
    
    // Flatten array of arrays and filter out duplicates
    const teamPlans = teamPlansArrays.flat();
    console.log('Team plans:', teamPlans);
    
    // Combine both sets of plans and remove duplicates
    const allPlans = [...assignedPlans];
    
    // Add team plans that aren't already in assigned plans
    teamPlans.forEach(teamPlan => {
      if (!teamPlan || !teamPlan._id) {
        console.error('Invalid team plan:', teamPlan);
        return;
      }
      
      // Make sure this plan isn't already included
      if (!allPlans.some(plan => plan._id === teamPlan._id)) {
        // Ensure team data is populated
        if (!teamPlan.team || typeof teamPlan.team === 'string') {
          const teamData = coachTeams.find(team => team._id === teamPlan.team);
          if (teamData) {
            teamPlan.team = teamData;
          }
        }
        allPlans.push(teamPlan);
      }
    });
    
    // Instead of filtering out plans with scheduleId, fetch the associated booking data to get court information
    // Use API to get full booking information for plans with scheduleId
    const plansWithScheduleIds = allPlans.filter(plan => 
      (plan.scheduleId && typeof plan.scheduleId === 'string') || 
      (plan.scheduleId && plan.scheduleId._id)
    );
    
    // For plans with scheduleId, get the booking data
    if (plansWithScheduleIds.length > 0) {
      const bookingPromises = plansWithScheduleIds.map(plan => {
        const bookingId = typeof plan.scheduleId === 'string' ? 
          plan.scheduleId : plan.scheduleId._id;
          
        return api.get(`/bookings/${bookingId}`)
          .then(res => {
            // Attach the booking data to the plan
            plan.scheduleId = res.data;
            return plan;
          })
          .catch(err => {
            console.error(`Error fetching booking for plan ${plan._id}:`, err);
            return plan;
          });
      });
      
      await Promise.all(bookingPromises);
    }
    
    // Sort by date
    const sortedPlans = allPlans.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Ensure each plan has a court defined for display
    sortedPlans.forEach(plan => {
      // Check if plan has a scheduleId that is populated
      if (plan.scheduleId && typeof plan.scheduleId === 'object' && plan.scheduleId.court) {
        // If scheduleId has a court object, make sure it's properly formatted
        if (typeof plan.scheduleId.court === 'string') {
          // If court is just an ID string, replace with a proper object
          plan.scheduleId.court = {
            name: "Court details pending",
            location: "Loading..."
          };
        }
        // Also set the main court property to the same court for consistency
        plan.court = plan.scheduleId.court;
      } 
      // If plan doesn't have court info at all, add default court
      else if (!plan.court && (!plan.scheduleId || typeof plan.scheduleId === 'string')) {
        // Add a default court 
        plan.court = {
          name: "Basketball Court",
          location: "Main Arena"
        };
      }
      // If plan has a court that's just an ID string
      else if (plan.court && typeof plan.court === 'string') {
        plan.court = {
          name: "Court details pending",
          location: "Loading..."
        };
      }
    });

    console.log('All sorted plans:', sortedPlans);
    return sortedPlans;
  } catch (error) {
    console.error('Error fetching coach training schedules:', error);
    throw error.response?.data?.msg || 'Failed to fetch training schedules';
  }
};

// Get training plans for a specific team
export const getTeamTrainingPlans = async (teamId) => {
  try {
    const response = await api.get(`/training-plans/team/${teamId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching team training plans:', error);
    throw error.response?.data?.msg || 'Failed to fetch team training plans';
  }
};

// Get training plan by ID
export const getTrainingPlanById = async (id) => {
  try {
    const response = await api.get(`/training-plans/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training plan:', error);
    throw error.response?.data?.msg || 'Failed to fetch training plan';
  }
};

// Update training plan status
export const updateTrainingPlanStatus = async (id, status) => {
  try {
    const response = await api.put(`/training-plans/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating training plan status:', error);
    throw error.response?.data?.msg || 'Failed to update training plan';
  }
};

// Get attendance for training plan
export const getTrainingPlanAttendance = async (id) => {
  try {
    const response = await api.get(`/training-plans/${id}/attendance`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch attendance';
  }
};

// Update attendance for training plan
export const updateTrainingPlanAttendance = async (id, attendance) => {
  try {
    const response = await api.put(`/training-plans/${id}/attendance`, { attendance });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update attendance';
  }
};

// Get all players in a team with their stats
export const getTeamPlayerStats = async (teamId) => {
  try {
    // Get all players in the team
    const teamResponse = await api.get(`/teams/${teamId}`);
    const team = teamResponse.data;
    
    // Get all player stats
    const statsResponse = await api.get('/player-stats');
    const allStats = statsResponse.data;
    
    // Map players with their stats
    const playersWithStats = team.players.map(playerObj => {
      const player = playerObj.player;
      const playerStats = allStats.filter(stat => 
        stat.player._id === player._id || stat.player === player._id
      );
      
      return {
        ...player,
        stats: playerStats
      };
    });
    
    return {
      team,
      playersWithStats
    };
  } catch (error) {
    console.error('Error fetching team player stats:', error);
    throw error.response?.data?.msg || 'Failed to fetch team player stats';
  }
}; 