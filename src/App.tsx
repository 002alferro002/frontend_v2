import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Settings, 
  List, 
  Heart, 
  Activity, 
  TrendingUp, 
  DollarSign,
  Calculator,
  Zap,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Target,
  BookOpen,
  Globe
} from 'lucide-react';

// Components
import AlertsList from './components/AlertsList';
import WatchlistModal from './components/WatchlistModal';
import FavoritesModal from './components/FavoritesModal';
import SettingsModal from './components/SettingsModal';
import StreamDataModal from './components/StreamDataModal';
import ChartSelector from './components/ChartSelector';
import SmartMoneyChartModal from './components/SmartMoneyChartModal';
import PaperTradesModal from './components/PaperTradesModal';
import RealTradesModal from './components/RealTradesModal';
import TimeZoneToggle from './components/TimeZoneToggle';

// Contexts
import { useTimeZone } from './contexts/TimeZoneContext';
import { formatTime } from './utils/timeUtils';

interface Stats {
  pairs_count: number;
  total_candles: number;
  alerts_count: number;
  last_update: string;
  volume_alerts: number;
  consecutive_alerts: number;
  priority_alerts: number;
  smart_money_alerts: number;
  paper_trades_count: number;
  real_trades_count: number;
  paper_trades_pnl: number;
  real_trades_pnl: number;
}

interface Alert {
  id: number;
  symbol: string;
  alert_type: string;
  price: number;
  timestamp: number | string;
  close_timestamp?: number | string;
  preliminary_alert?: Alert;
  has_imbalance?: boolean;
  imbalance_data?: any;
  candle_data?: any;
  order_book_snapshot?: any;
  volume_ratio?: number;
  consecutive_count?: number;
}

interface SmartMoneyAlert {
  id: number;
  symbol: string;
  type: 'fair_value_gap' | 'order_block' | 'breaker_block';
  direction: 'bullish' | 'bearish';
  strength: number;
  price: number;
  timestamp: string;
  top?: number;
  bottom?: number;
  related_alert_id?: number;
}

interface WatchlistItem {
  id: number;
  symbol: string;
  is_active: boolean;
  is_favorite: boolean;
  price_drop_percentage?: number;
  current_price?: number;
  historical_price?: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  color?: string;
}

interface FavoriteItem {
  id: number;
  symbol: string;
  is_active: boolean;
  price_drop_percentage?: number;
  current_price?: number;
  historical_price?: number;
  notes?: string;
  color?: string;
  sort_order?: number;
  favorite_added_at?: string;
}

interface StreamData {
  symbol: string;
  price: number;
  volume: number;
  volume_usdt: number;
  is_long: boolean;
  timestamp: string;
  change_24h?: number;
}

interface TimeSync {
  is_synced: boolean;
  last_sync: string | null;
  time_offset_ms: number;
  exchange_time: string;
  local_time: string;
  sync_age_seconds: number | null;
  serverTime: number;
  status: string;
}

const App: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'volume' | 'consecutive' | 'priority' | 'smart_money' | 'paper_trades' | 'real_trades'>('volume');
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [smartMoneyAlerts, setSmartMoneyAlerts] = useState<SmartMoneyAlert[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [streamData, setStreamData] = useState<StreamData[]>([]);
  const [timeSync, setTimeSync] = useState<TimeSync | null>(null);
  
  // Modal states
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStreamData, setShowStreamData] = useState(false);
  const [showPaperTrades, setShowPaperTrades] = useState(false);
  const [showRealTrades, setShowRealTrades] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedSmartMoneyAlert, setSelectedSmartMoneyAlert] = useState<SmartMoneyAlert | null>(null);

  // Connection states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const { timeZone } = useTimeZone();

  // WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        setWsConnectionStatus('connecting');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setWsConnected(true);
          setWsConnectionStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'stats':
                setStats(data.data);
                break;
              case 'alert':
                if (data.data.alert_type === 'smart_money') {
                  setSmartMoneyAlerts(prev => [data.data, ...prev.slice(0, 99)]);
                } else {
                  setAlerts(prev => [data.data, ...prev.slice(0, 99)]);
                }
                break;
              case 'stream_data':
                setStreamData(prev => [data.data, ...prev.slice(0, 49)]);
                break;
              case 'time_sync':
                setTimeSync(data.data);
                break;
              default:
                console.log('Unknown WebSocket message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('❌ WebSocket disconnected');
          setWsConnected(false);
          setWsConnectionStatus('disconnected');
          
          // Reconnect after 3 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
          setWsConnectionStatus('disconnected');
        };

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setWsConnectionStatus('disconnected');
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadInitialData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [
        statsResponse,
        alertsResponse,
        smartMoneyResponse,
        watchlistResponse,
        favoritesResponse,
        timeSyncResponse
      ] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/alerts/all'),
        fetch('/api/alerts/smart-money'),
        fetch('/api/watchlist'),
        fetch('/api/favorites'),
        fetch('/api/time')
      ]);

      // Process stats
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Process alerts
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        const allAlerts = [
          ...(alertsData.volume_alerts || []),
          ...(alertsData.consecutive_alerts || []),
          ...(alertsData.priority_alerts || [])
        ];
        
        // Sort by timestamp (newest first)
        allAlerts.sort((a, b) => {
          const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
          const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
          return timeB - timeA;
        });
        
        setAlerts(allAlerts);
      }

      // Process Smart Money alerts
      if (smartMoneyResponse.ok) {
        const smartMoneyData = await smartMoneyResponse.json();
        setSmartMoneyAlerts(smartMoneyData.alerts || []);
      }

      // Process watchlist
      if (watchlistResponse.ok) {
        const watchlistData = await watchlistResponse.json();
        setWatchlist(watchlistData.watchlist || []);
      }

      // Process favorites
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        setFavorites(favoritesData.favorites || []);
      }

      // Process time sync
      if (timeSyncResponse.ok) {
        const timeSyncData = await timeSyncResponse.json();
        setTimeSync(timeSyncData);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (symbol: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/${symbol}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setFavorites(prev => prev.filter(f => f.symbol !== symbol));
          setWatchlist(prev => prev.map(w => 
            w.symbol === symbol ? { ...w, is_favorite: false } : w
          ));
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbol }),
        });
        
        if (response.ok) {
          const newFavorite = await response.json();
          setFavorites(prev => [newFavorite, ...prev]);
          setWatchlist(prev => prev.map(w => 
            w.symbol === symbol ? { ...w, is_favorite: true } : w
          ));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const getFilteredAlerts = () => {
    switch (activeTab) {
      case 'volume':
        return alerts.filter(alert => alert.alert_type === 'volume_spike');
      case 'consecutive':
        return alerts.filter(alert => alert.alert_type === 'consecutive_long');
      case 'priority':
        return alerts.filter(alert => alert.alert_type === 'priority');
      case 'smart_money':
        return smartMoneyAlerts;
      default:
        return [];
    }
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'volume':
        return stats?.volume_alerts || 0;
      case 'consecutive':
        return stats?.consecutive_alerts || 0;
      case 'priority':
        return stats?.priority_alerts || 0;
      case 'smart_money':
        return stats?.smart_money_alerts || 0;
      case 'paper_trades':
        return stats?.paper_trades_count || 0;
      case 'real_trades':
        return stats?.real_trades_count || 0;
      default:
        return 0;
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">Загрузка системы...</h2>
          <p className="text-blue-200">Подключение к серверу анализа объемов</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-700 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Ошибка подключения</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={loadInitialData}
            className="bg-white text-red-800 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CryptoScan v2</h1>
                <p className="text-sm text-blue-200">Анализатор объемов Bybit</p>
              </div>
            </div>

            {/* Status and Controls */}
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {wsConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-white">
                  {wsConnectionStatus === 'connected' ? 'Онлайн' : 
                   wsConnectionStatus === 'connecting' ? 'Подключение...' : 'Офлайн'}
                </span>
              </div>

              {/* Time Sync Status */}
              {timeSync && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">
                    {timeSync.is_synced ? '🟢 Синхронизировано' : '🔴 Не синхронизировано'}
                  </span>
                </div>
              )}

              <TimeZoneToggle />

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowStreamData(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Поток</span>
                </button>

                <button
                  onClick={() => setShowFavorites(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Heart className="w-4 h-4" />
                  <span>Избранное</span>
                </button>

                <button
                  onClick={() => setShowWatchlist(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <List className="w-4 h-4" />
                  <span>Watchlist</span>
                </button>

                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Настройки</span>
                </button>

                <button
                  onClick={loadInitialData}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Обновить</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.pairs_count}</div>
                <div className="text-sm text-blue-200">Торговых пар</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.volume_alerts}</div>
                <div className="text-sm text-blue-200">Объем</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.consecutive_alerts}</div>
                <div className="text-sm text-blue-200">Последовательные</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.priority_alerts}</div>
                <div className="text-sm text-blue-200">Приоритетные</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.smart_money_alerts}</div>
                <div className="text-sm text-blue-200">Smart Money</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.paper_trades_count}</div>
                <div className="text-sm text-blue-200">Бумажные</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.real_trades_count}</div>
                <div className="text-sm text-blue-200">Реальные</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${(stats.paper_trades_pnl + stats.real_trades_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {((stats.paper_trades_pnl + stats.real_trades_pnl) >= 0 ? '+' : '')}${(stats.paper_trades_pnl + stats.real_trades_pnl).toFixed(2)}
                </div>
                <div className="text-sm text-blue-200">Общий PnL</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('volume')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'volume'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Превышение объема</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {getTabCount('volume')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('consecutive')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'consecutive'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Последовательные LONG</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {getTabCount('consecutive')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('priority')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'priority'
                  ? 'bg-red-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Приоритетные</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {getTabCount('priority')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('smart_money')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'smart_money'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Smart Money</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {getTabCount('smart_money')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('paper_trades')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'paper_trades'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Бумажные сделки</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {getTabCount('paper_trades')}
              </span>
              {stats && stats.paper_trades_pnl !== 0 && (
                <span className={`text-xs px-2 py-1 rounded ${
                  stats.paper_trades_pnl >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {stats.paper_trades_pnl >= 0 ? '+' : ''}${stats.paper_trades_pnl.toFixed(2)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('real_trades')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'real_trades'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Реальные сделки</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {getTabCount('real_trades')}
              </span>
              {stats && stats.real_trades_pnl !== 0 && (
                <span className={`text-xs px-2 py-1 rounded ${
                  stats.real_trades_pnl >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {stats.real_trades_pnl >= 0 ? '+' : ''}${stats.real_trades_pnl.toFixed(2)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          {activeTab === 'paper_trades' ? (
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Бумажные сделки</h3>
              <p className="text-blue-200 mb-6">Управление виртуальными сделками без риска</p>
              <button
                onClick={() => setShowPaperTrades(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Открыть панель бумажных сделок
              </button>
            </div>
          ) : activeTab === 'real_trades' ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Реальные сделки</h3>
              <p className="text-blue-200 mb-6">Управление реальными сделками через API Bybit</p>
              <button
                onClick={() => setShowRealTrades(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Открыть панель реальных сделок
              </button>
            </div>
          ) : (
            <AlertsList
              alerts={getFilteredAlerts()}
              alertType={activeTab}
              onAlertClick={(alert) => {
                if (activeTab === 'smart_money') {
                  setSelectedSmartMoneyAlert(alert as SmartMoneyAlert);
                } else {
                  setSelectedAlert(alert as Alert);
                }
              }}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </div>

        {/* Last Update */}
        {stats?.last_update && (
          <div className="mt-6 text-center text-blue-200 text-sm">
            Последнее обновление: {formatTime(stats.last_update, timeZone)}
          </div>
        )}
      </main>

      {/* Modals */}
      {showWatchlist && (
        <WatchlistModal
          watchlist={watchlist}
          onClose={() => setShowWatchlist(false)}
          onUpdate={loadInitialData}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {showFavorites && (
        <FavoritesModal
          favorites={favorites}
          onClose={() => setShowFavorites(false)}
          onUpdate={loadInitialData}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onUpdate={loadInitialData}
        />
      )}

      {showStreamData && (
        <StreamDataModal
          streamData={streamData}
          connectionStatus={wsConnectionStatus}
          onClose={() => setShowStreamData(false)}
        />
      )}

      {showPaperTrades && (
        <PaperTradesModal
          onClose={() => setShowPaperTrades(false)}
          onUpdate={loadInitialData}
        />
      )}

      {showRealTrades && (
        <RealTradesModal
          onClose={() => setShowRealTrades(false)}
          onUpdate={loadInitialData}
        />
      )}

      {selectedAlert && (
        <ChartSelector
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}

      {selectedSmartMoneyAlert && (
        <SmartMoneyChartModal
          alert={selectedSmartMoneyAlert}
          onClose={() => setSelectedSmartMoneyAlert(null)}
        />
      )}
    </div>
  );
};

export default App;