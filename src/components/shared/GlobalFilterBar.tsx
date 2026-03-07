import { useState, useMemo, useCallback } from 'react';
import {
  Calendar, Search, X, ChevronDown, Filter, BarChart2,
} from 'lucide-react';

/* ===== Date range presets ===== */
const DATE_PRESETS = [
  { key: '7d', label: 'Last 7D', days: 7 },
  { key: '30d', label: 'Last 30D', days: 30 },
  { key: '3m', label: '3M', days: 90 },
  { key: '6m', label: '6M', days: 180 },
  { key: '1y', label: '1Y', days: 365 },
  { key: 'all', label: 'All Time', days: null },
];

const COMPARISON_MODES = [
  { key: 'mom', label: 'MoM' },
  { key: 'qoq', label: 'QoQ' },
  { key: 'yoy', label: 'YoY' },
  { key: 'custom', label: 'Custom' },
];

/* Compute a date N days ago in YYYY-MM-DD format */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * GlobalFilterBar - Reusable filter bar for admin and portal dashboard views.
 *
 * Props:
 * - filters: { datePreset, dateFrom, dateTo, channel, comparison, search }
 * - onChange(updatedFilters): called when any filter changes
 * - availableChannels: string[] — dynamic list of channel options
 * - showSearch: boolean (default true)
 * - showComparison: boolean (default false)
 * - className: optional extra CSS class
 */
interface FilterState {
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
  channel?: string;
  comparison?: string;
  search?: string;
}

interface GlobalFilterBarProps {
  filters?: FilterState;
  onChange?: (filters: FilterState) => void;
  availableChannels?: string[];
  showSearch?: boolean;
  showComparison?: boolean;
  className?: string;
}

export default function GlobalFilterBar({
  filters = {},
  onChange,
  availableChannels = [],
  showSearch = true,
  showComparison = false,
  className = '',
}: GlobalFilterBarProps) {
  const [showCustomDates, setShowCustomDates] = useState(
    filters.datePreset === 'custom'
  );

  const activeFilters = useMemo(() => {
    const pills = [];
    if (filters.datePreset && filters.datePreset !== 'all') {
      const preset = DATE_PRESETS.find((p) => p.key === filters.datePreset);
      if (preset) pills.push({ key: 'datePreset', label: preset.label });
    }
    if (filters.datePreset === 'custom' && (filters.dateFrom || filters.dateTo)) {
      const from = filters.dateFrom || '...';
      const to = filters.dateTo || '...';
      pills.push({ key: 'dateRange', label: `${from} to ${to}` });
    }
    if (filters.channel) {
      pills.push({ key: 'channel', label: `Channel: ${filters.channel}` });
    }
    if (filters.comparison && filters.comparison !== 'none') {
      const mode = COMPARISON_MODES.find((m) => m.key === filters.comparison);
      if (mode) pills.push({ key: 'comparison', label: `Compare: ${mode.label}` });
    }
    if (filters.search) {
      pills.push({ key: 'search', label: `"${filters.search}"` });
    }
    return pills;
  }, [filters]);

  const update = useCallback(
    (partial: Partial<FilterState>) => {
      onChange?.({ ...filters, ...partial });
    },
    [filters, onChange]
  );

  const handlePreset = useCallback(
    (presetKey: string) => {
      const preset = DATE_PRESETS.find((p) => p.key === presetKey);
      if (!preset) return;

      if (preset.days === null) {
        // All Time
        update({ datePreset: 'all', dateFrom: '', dateTo: '' });
        setShowCustomDates(false);
      } else {
        update({
          datePreset: presetKey,
          dateFrom: daysAgo(preset.days),
          dateTo: new Date().toISOString().slice(0, 10),
        });
        setShowCustomDates(false);
      }
    },
    [update]
  );

  const handleCustomToggle = useCallback(() => {
    setShowCustomDates(true);
    update({ datePreset: 'custom' });
  }, [update]);

  const removeFilter = useCallback(
    (key: string) => {
      switch (key) {
        case 'datePreset':
        case 'dateRange':
          update({ datePreset: 'all', dateFrom: '', dateTo: '' });
          setShowCustomDates(false);
          break;
        case 'channel':
          update({ channel: '' });
          break;
        case 'comparison':
          update({ comparison: 'none' });
          break;
        case 'search':
          update({ search: '' });
          break;
        default:
          break;
      }
    },
    [update]
  );

  const clearAll = useCallback(() => {
    onChange?.({
      datePreset: 'all',
      dateFrom: '',
      dateTo: '',
      channel: '',
      comparison: 'none',
      search: '',
    });
    setShowCustomDates(false);
  }, [onChange]);

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={`gfb-container ${className}`}>
      {/* Row 1: Date presets + channel + comparison + search */}
      <div className="gfb-row">
        {/* Date range presets */}
        <div className="gfb-group gfb-date-presets">
          <Calendar size={14} className="gfb-group-icon" />
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              className={`gfb-preset-btn ${filters.datePreset === preset.key ? 'active' : ''}`}
              onClick={() => handlePreset(preset.key)}
              aria-label={`Filter by ${preset.label}`}
            >
              {preset.label}
            </button>
          ))}
          <button
            className={`gfb-preset-btn ${filters.datePreset === 'custom' ? 'active' : ''}`}
            onClick={handleCustomToggle}
            aria-label="Custom date range"
          >
            Custom
          </button>
        </div>

        {/* Channel filter */}
        {availableChannels.length > 0 && (
          <div className="gfb-group">
            <div className="gfb-select-wrap">
              <select
                value={filters.channel || ''}
                onChange={(e) => update({ channel: e.target.value })}
                className="gfb-select"
                aria-label="Filter by channel"
              >
                <option value="">All Channels</option>
                {availableChannels.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
              <ChevronDown size={14} className="gfb-select-icon" />
            </div>
          </div>
        )}

        {/* Comparison mode toggle */}
        {showComparison && (
          <div className="gfb-group gfb-comparison">
            <BarChart2 size={14} className="gfb-group-icon" />
            {COMPARISON_MODES.map((mode) => (
              <button
                key={mode.key}
                className={`gfb-preset-btn gfb-compare-btn ${filters.comparison === mode.key ? 'active' : ''}`}
                onClick={() =>
                  update({
                    comparison: filters.comparison === mode.key ? 'none' : mode.key,
                  })
                }
                aria-label={`Compare ${mode.label}`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        )}

        {/* Search input */}
        {showSearch && (
          <div className="gfb-group gfb-search">
            <Search size={14} className="gfb-search-icon" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Search..."
              className="gfb-search-input"
              aria-label="Search filter"
            />
            {filters.search && (
              <button
                className="gfb-search-clear"
                onClick={() => update({ search: '' })}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Custom date inputs (shown when "Custom" preset selected) */}
      {showCustomDates && (
        <div className="gfb-custom-dates">
          <label className="gfb-date-label">
            From
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => update({ dateFrom: e.target.value })}
              className="gfb-date-input"
            />
          </label>
          <span className="gfb-date-separator">-</span>
          <label className="gfb-date-label">
            To
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => update({ dateTo: e.target.value })}
              className="gfb-date-input"
            />
          </label>
        </div>
      )}

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="gfb-pills">
          <Filter size={13} className="gfb-pills-icon" />
          {activeFilters.map((pill) => (
            <span key={pill.key} className="gfb-pill">
              {pill.label}
              <button
                className="gfb-pill-remove"
                onClick={() => removeFilter(pill.key)}
                aria-label={`Remove filter: ${pill.label}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <button
            className="gfb-clear-all"
            onClick={clearAll}
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
