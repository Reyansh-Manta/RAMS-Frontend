import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import {
  RiGroupLine, RiRadioButtonLine, RiCalendarCheckLine,
  RiQuestionAnswerLine, RiBarChartBoxLine, RiUserAddLine,
  RiFileList3Line, RiPuzzle2Line, RiPieChartLine,
  RiLineChartLine, RiRefreshLine
} from 'react-icons/ri';
import { motion } from 'framer-motion';
import './AdminStats.css';

// ─── Animated counter hook ───
function useAnimatedCount(target, duration = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    let rafId;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevTarget.current = target;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}

// ─── Stat card component ───
function StatCard({ icon: Icon, value, label, colorClass, delay, isLive }) {
  const animatedValue = useAnimatedCount(value);

  return (
    <motion.div
      className={`stats-card glass-card ${colorClass}`}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className={`stats-card-icon ${colorClass}`}>
        <Icon size={22} />
        {isLive && <span className="stats-live-pulse" />}
      </div>
      <div className="stats-card-content">
        <p className="stats-card-value">{animatedValue.toLocaleString()}</p>
        <p className="stats-card-label">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Bar chart component (pure SVG) ───
function BarChart({ data, title, icon: Icon, color, accentColor }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <motion.div
      className="stats-chart glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="stats-chart-header">
        <div className="stats-chart-title">
          <Icon size={18} />
          {title}
        </div>
        <span className="stats-chart-subtitle">Last 7 days</span>
      </div>
      <div className="stats-chart-body">
        <svg viewBox="0 0 700 200" className="stats-bar-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {data.map((d, i) => {
            const barWidth = 60;
            const gap = (700 - data.length * barWidth) / (data.length + 1);
            const x = gap + i * (barWidth + gap);
            const barHeight = (d.count / maxCount) * 160;
            const y = 180 - barHeight;
            return (
              <g key={d.date}>
                {/* Bar */}
                <motion.rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={`url(#grad-${color})`}
                  initial={{ height: 0, y: 180 }}
                  animate={{ height: barHeight, y }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                />
                {/* Count label */}
                {d.count > 0 && (
                  <motion.text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="stats-bar-count"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                  >
                    {d.count}
                  </motion.text>
                )}
              </g>
            );
          })}
          {/* Baseline */}
          <line x1="0" y1="180" x2="700" y2="180" stroke="var(--color-border)" strokeWidth="1" />
        </svg>
        <div className="stats-bar-labels">
          {data.map((d) => {
            const day = new Date(d.date + 'T00:00:00');
            const label = day.toLocaleDateString('en', { weekday: 'short' });
            return <span key={d.date} className="stats-bar-label">{label}</span>;
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Donut chart component (pure SVG) ───
function DonutChart({ data, title }) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6', '#ef4444', '#f97316', '#06b6d4'];

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += d.count;
    const endAngle = (cumulative / total) * 360;
    return { ...d, startAngle, endAngle, color: COLORS[i % COLORS.length] };
  });

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    // Avoid full-circle SVG arc bug
    if (endAngle - startAngle >= 359.999) {
      endAngle = startAngle + 359.999;
    }
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  return (
    <motion.div
      className="stats-chart glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="stats-chart-header">
        <div className="stats-chart-title">
          <RiPieChartLine size={18} />
          {title}
        </div>
        <span className="stats-chart-subtitle">{total} total</span>
      </div>
      <div className="stats-donut-body">
        <div className="stats-donut-svg-wrap">
          <svg viewBox="0 0 200 200" className="stats-donut-svg">
            {data.length === 0 ? (
              <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-border)" strokeWidth="24" />
            ) : (
              segments.map((seg, i) => (
                <motion.path
                  key={i}
                  d={describeArc(100, 100, 70, seg.startAngle, seg.endAngle)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="24"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                />
              ))
            )}
            <text x="100" y="95" textAnchor="middle" className="stats-donut-total">{total}</text>
            <text x="100" y="115" textAnchor="middle" className="stats-donut-total-label">users</text>
          </svg>
        </div>
        <div className="stats-donut-legend">
          {segments.map((seg, i) => (
            <div key={i} className="stats-legend-item">
              <span className="stats-legend-dot" style={{ background: seg.color }} />
              <span className="stats-legend-name">{seg.profession || 'Unknown'}</span>
              <span className="stats-legend-count">{seg.count}</span>
            </div>
          ))}
          {data.length === 0 && (
            <p className="stats-legend-empty">No profession data available</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───
export default function AdminStats() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const response = await apiClient.get('/admin/stats');
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      intervalRef.current = setInterval(fetchStats, 30000);
      return () => clearInterval(intervalRef.current);
    }
  }, [isAdmin, fetchStats]);

  // Time ago formatter
  const getTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
      </div>
    );
  }

  const STAT_CARDS = [
    { key: 'total_users', icon: RiGroupLine, label: 'Total Users', colorClass: 'stat-users' },
    { key: 'active_now', icon: RiRadioButtonLine, label: 'Active Now', colorClass: 'stat-active', isLive: true },
    { key: 'logins_today', icon: RiCalendarCheckLine, label: 'Logins Today', colorClass: 'stat-logins' },
    { key: 'questions_today', icon: RiQuestionAnswerLine, label: 'Questions Today', colorClass: 'stat-questions' },
    { key: 'total_questions', icon: RiBarChartBoxLine, label: 'Total Questions', colorClass: 'stat-total-q' },
    { key: 'new_users_week', icon: RiUserAddLine, label: 'New This Week', colorClass: 'stat-new' },
    { key: 'total_documents', icon: RiFileList3Line, label: 'Total Documents', colorClass: 'stat-docs' },
    { key: 'total_chunks', icon: RiPuzzle2Line, label: 'Total Chunks', colorClass: 'stat-chunks' },
  ];

  return (
    <div className="admin-stats-page">
      <div className="admin-stats-inner">
        {/* Header */}
        <motion.div
          className="admin-stats-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="admin-stats-page-title">
              <RiBarChartBoxLine className="admin-stats-page-icon" />
              Platform Statistics
            </h1>
            <p className="admin-stats-page-desc">Real-time analytics and platform health</p>
          </div>
          <div className="admin-stats-header-actions">
            {lastUpdated && (
              <span className="admin-stats-updated">
                Updated {getTimeAgo(lastUpdated)}
              </span>
            )}
            <button
              className={`admin-stats-refresh btn-icon ${isRefreshing ? 'refreshing' : ''}`}
              onClick={() => fetchStats(true)}
              title="Refresh stats"
            >
              <RiRefreshLine size={18} />
            </button>
          </div>
        </motion.div>

        {/* Stat Cards Grid */}
        <div className="admin-stats-cards-grid">
          {statsLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                className="stats-card glass-card skeleton"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="skeleton-icon" />
                <div className="skeleton-content">
                  <div className="skeleton-value" />
                  <div className="skeleton-label" />
                </div>
              </motion.div>
            ))
          ) : (
            STAT_CARDS.map((card, i) => (
              <StatCard
                key={card.key}
                icon={card.icon}
                value={stats?.[card.key] ?? 0}
                label={card.label}
                colorClass={card.colorClass}
                delay={0.1 + i * 0.05}
                isLive={card.isLive}
              />
            ))
          )}
        </div>

        {/* Charts Section */}
        {!statsLoading && stats && (
          <div className="admin-stats-charts">
            <BarChart
              data={stats.questions_per_day || []}
              title="Questions Per Day"
              icon={RiQuestionAnswerLine}
              color="questions"
              accentColor="#f59e0b"
            />
            <BarChart
              data={stats.users_per_day || []}
              title="New Users Per Day"
              icon={RiLineChartLine}
              color="users"
              accentColor="#6366f1"
            />
            <DonutChart
              data={stats.profession_breakdown || []}
              title="Users by Profession"
            />
          </div>
        )}
      </div>
    </div>
  );
}
