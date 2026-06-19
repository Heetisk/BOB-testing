import { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Zap, Shield, ArrowLeftRight, Bell, Activity
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
  const pollingRef = useRef(null);
  const lastEventCount = useRef(0);

  const disconnectSSE = () => {
    if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
  };

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  const fetchStatus = async () => {
    try {
      const data = await getSimulationStatus();
      setStatus(data);
      setEvents(data.recent_events || []);
    } catch { console.error('Failed to fetch status'); }
    finally { setLoading(false); }
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
      } catch { console.error('Polling error'); }
    }, 2500);
  };

  const connectSSE = () => {
    disconnectSSE();
    stopPolling();

    const eventSource = new EventSource(`/api/v1/simulation/stream?token=${token}`);
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
      } catch (e) { console.error('SSE parse error:', e); }
    };

    eventSource.onerror = () => {
      if (!sseFailed) { sseFailed = true; eventSource.close(); startPolling(); }
    };
    eventSourceRef.current = eventSource;
  };

  useEffect(() => {
    let cancelled = false;
    getSimulationStatus()
      .then((data) => {
        if (!cancelled) {
          setStatus(data);
          setEvents(data.recent_events || []);
        }
      })
      .catch(() => console.error('Failed to fetch status'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; disconnectSSE(); stopPolling(); };
  }, []);

  useEffect(() => {
    if (status?.running) connectSSE();
    else { disconnectSSE(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.running]);

  const handleStart = async () => {
    try {
      await startSimulation(status?.speed || speed);
      await fetchStatus();
    } catch { console.error('Failed to start'); }
  };

  const handleStop = async () => {
    try {
      await stopSimulation();
      disconnectSSE();
      stopPolling();
      await fetchStatus();
    } catch { console.error('Failed to stop'); }
  };

  const getRiskBorder = (level) => {
    switch (level) {
      case 'High': return 'border-l-danger';
      case 'Medium': return 'border-l-warning';
      default: return 'border-l-success';
    }
  };

  if (loading) return <Loader text="Loading simulator..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Activity size={20} className="text-accent" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Traffic Simulator</h1>
          </div>
          <p className="text-sm text-text-3 ml-[32px]">Generate live user activities with real-time risk detection</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-1 border border-surface-3/50 rounded-lg px-3 py-1.5">
            <Zap size={14} className="text-accent" />
            <label htmlFor="sim-speed" className="sr-only">Simulation speed</label>
            <select
              id="sim-speed"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="bg-transparent text-text-2 text-xs focus:outline-none cursor-pointer"
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
              className="flex items-center gap-1.5 px-4 py-2 bg-danger hover:bg-danger/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Pause size={14} /> Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Play size={14} /> Start
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 animate-fade-in-up stagger-1">
        {[
          { label: 'Events', value: status?.total_events || 0, icon: Activity, color: 'text-text-2' },
          { label: 'Logins', value: status?.login_count || 0, icon: Shield, color: 'text-info' },
          { label: 'Transactions', value: status?.transaction_count || 0, icon: ArrowLeftRight, color: 'text-success' },
          { label: 'Alerts', value: status?.alert_count || 0, icon: Bell, color: 'text-warning' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface-1 border border-surface-3/50 rounded-xl p-4 transition-all duration-150 hover:border-surface-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-3/60 mb-1.5">
              <stat.icon size={12} aria-hidden="true" />
              {stat.label}
            </div>
            <p className={`text-xl font-bold font-display tabular-nums ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-1 border border-surface-3/50 rounded-2xl overflow-hidden animate-fade-in-up stagger-2">
        <div className="px-5 py-3.5 border-b border-surface-3/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-1 font-display flex items-center gap-2">
            <Activity size={15} className="text-accent" />
            Live Event Feed
          </h3>
          {status?.running && (
            <span className="flex items-center gap-1.5 text-success text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {events.length > 0 ? (
            <div className="divide-y divide-surface-3/30">
              {events.map((event, idx) => (
                <div
                  key={event.event_id || idx}
                  className={`px-5 py-3.5 hover:bg-surface-2/30 transition-colors border-l-[3px] ${getRiskBorder(event.risk_level)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {event.event_type === 'login'
                          ? <Shield size={14} className="text-info" />
                          : <ArrowLeftRight size={14} className="text-success" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-text-1">{event.user_name}</span>
                          <span className="text-[10px] text-text-3/60">#{event.user_id}</span>
                          <span className="text-[10px] text-text-3/60">in {event.city}</span>
                        </div>
                        <p className="text-xs text-text-3 mt-0.5">{event.description}</p>
                        {event.details?.reasons?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {event.details.reasons.slice(0, 2).map((reason, i) => (
                              <span key={i} className="text-[10px] bg-surface-0 px-2 py-0.5 rounded-md text-text-3/70">
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <RiskBadge level={event.risk_level} size="sm" />
                      <p className="text-[10px] text-text-3/60 mt-1 font-mono tabular-nums">{event.risk_score}</p>
                      <p className="text-[10px] text-text-3/60 mt-0.5">{event.action_taken}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Activity size={36} className="mx-auto mb-3 text-text-3/30" />
              <p className="text-sm text-text-3">No events yet</p>
              <p className="text-xs text-text-3/60 mt-1">Start the simulation to see live traffic</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
