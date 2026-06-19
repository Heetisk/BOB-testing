import { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Zap, Shield, ArrowLeftRight, Bell,
  Activity
} from 'lucide-react';
import { getSimulationStatus, startSimulation, stopSimulation } from '../api/simulationApi';
import { useAuth } from '../context/AuthContext';
import RiskBadge from '../components/RiskBadge';
import Loader from '../components/Loader';

export default function SimulationPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [speed, setSpeed] = useState(2.0);
  const eventSourceRef = useRef(null);
  const eventsEndRef = useRef(null);
  const pollingRef = useRef(null);
  const lastEventCount = useRef(0);

  useEffect(() => {
    fetchStatus();
    return () => {
      disconnectSSE();
      stopPolling();
    };
  }, []);

  useEffect(() => {
    if (status?.running) {
      connectSSE();
    } else {
      disconnectSSE();
    }
  }, [status?.running]);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const fetchStatus = async () => {
    try {
      const data = await getSimulationStatus();
      setStatus(data);
      setEvents(data.recent_events || []);
    } catch (err) {
      console.error('Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const connectSSE = () => {
    disconnectSSE();
    stopPolling();

    const eventSource = new EventSource(
      `/api/v1/simulation/stream?token=${token}`
    );

    let sseFailed = false;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'event') {
          setEvents((prev) => [data.data, ...prev].slice(0, 50));
          setStatus((prev) => prev ? {
            ...prev,
            total_events: prev.total_events + 1,
            login_count: prev.login_count + (data.data.event_type === 'login' ? 1 : 0),
            transaction_count: prev.transaction_count + (data.data.event_type === 'transaction' ? 1 : 0),
            alert_count: prev.alert_count + (['Medium', 'High'].includes(data.data.risk_level) ? 1 : 0),
          } : prev);
        } else if (data.type === 'status') {
          setStatus(data.data);
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    eventSource.onerror = () => {
      if (!sseFailed) {
        sseFailed = true;
        eventSource.close();
        startPolling();
      }
    };

    eventSourceRef.current = eventSource;
  };

  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const data = await getSimulationStatus();
        setStatus(data);

        const newEvents = data.recent_events || [];
        if (newEvents.length > lastEventCount.current) {
          setEvents(newEvents.slice(0, 50));
          lastEventCount.current = newEvents.length;
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleStart = async () => {
    try {
      await startSimulation(status?.speed || speed);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to start simulation');
    }
  };

  const handleStop = async () => {
    try {
      await stopSimulation();
      disconnectSSE();
      stopPolling();
      await fetchStatus();
    } catch (err) {
      console.error('Failed to stop simulation');
    }
  };

  const getEventIcon = (type) => {
    if (type === 'login') return <Shield size={16} className="text-info" />;
    return <ArrowLeftRight size={16} className="text-success" />;
  };

  const getRiskBg = (level) => {
    switch (level) {
      case 'High': return 'border-danger/30 bg-danger/5';
      case 'Medium': return 'border-warning/30 bg-warning/5';
      default: return 'border-success/30 bg-success/5';
    }
  };

  if (loading) return <Loader text="Loading simulator..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Traffic Simulator</h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2">Generate live user activities with real-time risk detection</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-card border border-border rounded-xl px-4 py-2">
            <Zap size={16} className="text-primary" />
            <select
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="bg-transparent text-text-primary text-sm focus:outline-none cursor-pointer"
              disabled={status?.running}
            >
              <option value={0.5}>Fast (0.5s)</option>
              <option value={1.0}>Medium (1s)</option>
              <option value={2.0}>Normal (2s)</option>
              <option value={3.0}>Slow (3s)</option>
            </select>
          </div>
          {status?.running ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 bg-danger hover:bg-danger/80 text-white font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Pause size={18} />
              Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-success to-success/80 hover:from-success/80 hover:to-success text-white font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-success/20"
            >
              <Play size={18} />
              Start Simulation
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted text-xs font-medium uppercase tracking-wide mb-2">
            <Activity size={14} />
            Total Events
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">{status?.total_events || 0}</p>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted text-xs font-medium uppercase tracking-wide mb-2">
            <Shield size={14} />
            Logins
          </div>
          <p className="text-2xl font-bold text-info tabular-nums">{status?.login_count || 0}</p>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted text-xs font-medium uppercase tracking-wide mb-2">
            <ArrowLeftRight size={14} />
            Transactions
          </div>
          <p className="text-2xl font-bold text-success tabular-nums">{status?.transaction_count || 0}</p>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted text-xs font-medium uppercase tracking-wide mb-2">
            <Bell size={14} />
            Alerts
          </div>
          <p className="text-2xl font-bold text-warning tabular-nums">{status?.alert_count || 0}</p>
        </div>
      </div>

      {/* Live Feed */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-text-primary font-semibold flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Live Event Feed
          </h3>
          {status?.running && (
            <span className="flex items-center gap-2 text-success text-sm">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {events.length > 0 ? (
            <div className="divide-y divide-border/50">
              {events.map((event, idx) => (
                <div
                  key={event.event_id || idx}
                  className={`px-6 py-4 hover:bg-bg-card-hover/50 transition-colors border-l-4 ${getRiskBg(event.risk_level)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-text-primary text-sm font-semibold">{event.user_name}</span>
                          <span className="text-text-muted text-xs">#{event.user_id}</span>
                          <span className="text-text-muted text-xs">in {event.city}</span>
                        </div>
                        <p className="text-text-secondary text-sm mt-0.5">{event.description}</p>
                        {event.details?.reasons?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {event.details.reasons.slice(0, 2).map((reason, i) => (
                              <span key={i} className="text-xs bg-bg-dark px-2 py-0.5 rounded-full text-text-muted">
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <RiskBadge level={event.risk_level} size="sm" />
                      <p className="text-text-muted text-xs mt-1 tabular-nums">Score: {event.risk_score}</p>
                      <p className="text-text-muted text-xs mt-0.5">
                        {event.action_taken}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={eventsEndRef} />
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted">
              <Activity size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-base">No events yet</p>
              <p className="text-sm mt-1">Start the simulation to see live traffic</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
