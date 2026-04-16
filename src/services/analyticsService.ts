/**
 * Simple Analytics Service for tracking user engagement.
 * In a production app, this would send data to a service like Google Analytics, Plausible, or Mixpanel.
 * For this local-first app, we'll log to console and potentially local storage to respect privacy.
 */

export const AnalyticsService = {
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    const eventData = {
      event: eventName,
      properties,
      timestamp,
    };

    // Log for developer awareness
    console.log('[Analytics]', eventName, properties);

    // Persist session-based engagement count locally
    const stats = JSON.parse(localStorage.getItem('gemma-analytics-stats') || '{"events": 0, "sessions": 0}');
    stats.events += 1;
    localStorage.setItem('gemma-analytics-stats', JSON.stringify(stats));
  },

  trackSessionStart: () => {
    const stats = JSON.parse(localStorage.getItem('gemma-analytics-stats') || '{"events": 0, "sessions": 0}');
    stats.sessions += 1;
    localStorage.setItem('gemma-analytics-stats', JSON.stringify(stats));
    AnalyticsService.trackEvent('session_start');
  }
};
