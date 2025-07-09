import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, AlertTriangle, CheckCircle, Settings, BarChart3, Clock, DollarSign, Bell, Globe, Shield, Zap } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

interface Settings {
  // Основные настройки
  server: {
    host: string;
    port: number;
  };

  // База данных
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };

  // Анализ объемов
  volume_analyzer: {
    analysis_hours: number;
    offset_minutes: number;
    volume_multiplier: number;
    min_volume_usdt: number;
    consecutive_long_count: number;
    alert_grouping_minutes: number;
    data_retention_hours: number;
    update_interval_seconds: number;
    volume_type: string;
  };

  // Фильтр цен
  price_filter: {
    price_history_days: number;
    price_drop_percentage: number;
    pairs_check_interval_minutes: number;
    price_check_interval_minutes: number;
  };

  // Watchlist
  watchlist: {
    auto_update: boolean;
  };

  // Алерты
  alerts: {
    volume_alerts_enabled: boolean;
    consecutive_alerts_enabled: boolean;
    priority_alerts_enabled: boolean;
    notification_enabled: boolean;
  };

  // Имбаланс (Smart Money)
  imbalance: {
    enabled: boolean;
    fair_value_gap_enabled: boolean;
    order_block_enabled: boolean;
    breaker_block_enabled: boolean;
    min_gap_percentage: number;
    min_strength: number;
  };

  // Стакан заявок
  orderbook: {
    enabled: boolean;
    snapshot_on_alert: boolean;
  };

  // Telegram
  telegram: {
    bot_token: string;
    chat_id: string;
    enabled: boolean;
  };

  // Bybit API
  bybit: {
    api_key: string;
    api_secret: string;
  };

  // Торговля
  trading: {
    account_balance: number;
    max_risk_per_trade: number;
    max_open_trades: number;
    default_stop_loss_percentage: number;
    default_take_profit_percentage: number;
    auto_calculate_quantity: boolean;
    enable_real_trading: boolean;
    default_leverage: number;
    default_margin_type: string;
    confirm_trades: boolean;
  };

  // WebSocket
  websocket: {
    ping_interval: number;
    ping_timeout: number;
    close_timeout: number;
    max_size: number;
  };

  // Синхронизация времени
  time_sync: {
    interval: number;
    server_sync_interval: number;
  };

  // Логирование
  logging: {
    level: string;
    file: string;
  };

  // Социальные сети
  social: {
    sentiment_enabled: boolean;
    analysis_period_hours: number;
    min_mentions_for_rating: number;
    cache_duration_minutes: number;
  };
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onUpdate }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('volume_analyzer');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();

        // Преобразуем плоскую структуру в иерархическую
        const structuredSettings: Settings = {
          server: {
            host: data.server_host || '0.0.0.0',
            port: data.server_port || 8000,
          },
          database: {
            url: data.database_url || '',
            host: data.db_host || 'localhost',
            port: data.db_port || 5432,
            name: data.db_name || 'cryptoscan',
            user: data.db_user || 'user',
            password: data.db_password || '',
          },
          volume_analyzer: {
            analysis_hours: data.analysis_hours || 1,
            offset_minutes: data.offset_minutes || 0,
            volume_multiplier: data.volume_multiplier || 2.0,
            min_volume_usdt: data.min_volume_usdt || 1000,
            consecutive_long_count: data.consecutive_long_count || 5,
            alert_grouping_minutes: data.alert_grouping_minutes || 5,
            data_retention_hours: data.data_retention_hours || 2,
            update_interval_seconds: data.update_interval_seconds || 1,
            volume_type: data.volume_type || 'long',
          },
          price_filter: {
            price_history_days: data.price_history_days || 30,
            price_drop_percentage: data.price_drop_percentage || 10.0,
            pairs_check_interval_minutes: data.pairs_check_interval_minutes || 30,
            price_check_interval_minutes: data.price_check_interval_minutes || 5,
          },
          watchlist: {
            auto_update: data.watchlist_auto_update !== false,
          },
          alerts: {
            volume_alerts_enabled: data.volume_alerts_enabled !== false,
            consecutive_alerts_enabled: data.consecutive_alerts_enabled !== false,
            priority_alerts_enabled: data.priority_alerts_enabled !== false,
            notification_enabled: data.notification_enabled !== false,
          },
          imbalance: {
            enabled: data.imbalance_enabled !== false,
            fair_value_gap_enabled: data.fair_value_gap_enabled !== false,
            order_block_enabled: data.order_block_enabled !== false,
            breaker_block_enabled: data.breaker_block_enabled !== false,
            min_gap_percentage: data.min_gap_percentage || 0.1,
            min_strength: data.min_strength || 0.5,
          },
          orderbook: {
            enabled: data.orderbook_enabled === true,
            snapshot_on_alert: data.orderbook_snapshot_on_alert === true,
          },
          telegram: {
            bot_token: data.telegram_bot_token || '',
            chat_id: data.telegram_chat_id || '',
            enabled: !!(data.telegram_bot_token && data.telegram_chat_id),
          },
          bybit: {
            api_key: data.bybit_api_key || '',
            api_secret: data.bybit_api_secret || '',
          },
          trading: {
            account_balance: data.account_balance || 10000,
            max_risk_per_trade: data.max_risk_per_trade || 2.0,
            max_open_trades: data.max_open_trades || 5,
            default_stop_loss_percentage: data.default_stop_loss_percentage || 2.0,
            default_take_profit_percentage: data.default_take_profit_percentage || 6.0,
            auto_calculate_quantity: data.auto_calculate_quantity !== false,
            enable_real_trading: data.enable_real_trading === true,
            default_leverage: data.default_leverage || 1,
            default_margin_type: data.default_margin_type || 'isolated',
            confirm_trades: data.confirm_trades !== false,
          },
          websocket: {
            ping_interval: data.ws_ping_interval || 20,
            ping_timeout: data.ws_ping_timeout || 10,
            close_timeout: data.ws_close_timeout || 10,
            max_size: data.ws_max_size || 10000000,
          },
          time_sync: {
            interval: data.time_sync_interval || 300,
            server_sync_interval: data.time_server_sync_interval || 3600,
          },
          logging: {
            level: data.log_level || 'INFO',
            file: data.log_file || 'cryptoscan.log',
          },
          social: {
            sentiment_enabled: data.social_sentiment_enabled === true,
            analysis_period_hours: data.social_analysis_period_hours || 72,
            min_mentions_for_rating: data.social_min_mentions_for_rating || 3,
            cache_duration_minutes: data.social_cache_duration_minutes || 30,
          },
        };

        setSettings(structuredSettings);
      } else {
        throw new Error('Ошибка загрузки настроек');
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      setError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    // Преобразуем настройки в формат для API
    const apiSettings = {
      settings: settings
    };

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      console.log('Отправка настроек:', apiSettings);

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiSettings),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ответ сервера:', data);
        setSuccess(true);
        onUpdate();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка сохранения настроек');
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      setError(error instanceof Error ? error.message : 'Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof Settings, key: string, value: any) => {
    if (!settings) return;

    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'volume_analyzer', name: 'Анализ объемов', icon: BarChart3 },
    { id: 'price_filter', name: 'Фильтр цен', icon: DollarSign },
    { id: 'alerts', name: 'Алерты', icon: Bell },
    { id: 'imbalance', name: 'Smart Money', icon: Zap },
    { id: 'trading', name: 'Торговля', icon: DollarSign },
    { id: 'telegram', name: 'Telegram', icon: Bell },
    { id: 'bybit', name: 'Bybit API', icon: Shield },
    { id: 'time_sync', name: 'Синхронизация', icon: Clock },
    { id: 'system', name: 'Система', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-700">Загрузка настроек...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Ошибка загрузки настроек</p>
            <div className="space-x-3">
              <button
                onClick={loadSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Попробовать снова
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderVolumeAnalyzerSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Основные параметры</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Период анализа (часы)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={settings.volume_analyzer.analysis_hours}
              onChange={(e) => updateSetting('volume_analyzer', 'analysis_hours', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Смещение (минуты)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={settings.volume_analyzer.offset_minutes}
              onChange={(e) => updateSetting('volume_analyzer', 'offset_minutes', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Множитель объема
            </label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={settings.volume_analyzer.volume_multiplier}
              onChange={(e) => updateSetting('volume_analyzer', 'volume_multiplier', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Минимальный объем (USDT)
            </label>
            <input
              type="number"
              min="100"
              value={settings.volume_analyzer.min_volume_usdt}
              onChange={(e) => updateSetting('volume_analyzer', 'min_volume_usdt', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Последовательные свечи</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество LONG свечей подряд
            </label>
            <input
              type="number"
              min="3"
              max="20"
              value={settings.volume_analyzer.consecutive_long_count}
              onChange={(e) => updateSetting('volume_analyzer', 'consecutive_long_count', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Группировка алертов (минуты)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.volume_analyzer.alert_grouping_minutes}
              onChange={(e) => updateSetting('volume_analyzer', 'alert_grouping_minutes', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Дополнительные настройки</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Хранение данных (часы)
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={settings.volume_analyzer.data_retention_hours}
              onChange={(e) => updateSetting('volume_analyzer', 'data_retention_hours', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип объема
            </label>
            <select
              value={settings.volume_analyzer.volume_type}
              onChange={(e) => updateSetting('volume_analyzer', 'volume_type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="long">Только LONG</option>
              <option value="short">Только SHORT</option>
              <option value="all">Все свечи</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPriceFilterSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Фильтрация по цене</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Период истории цен (дни)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={settings.price_filter.price_history_days}
              onChange={(e) => updateSetting('price_filter', 'price_history_days', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Минимальное падение цены (%)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              step="0.1"
              value={settings.price_filter.price_drop_percentage}
              onChange={(e) => updateSetting('price_filter', 'price_drop_percentage', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Интервал проверки пар (минуты)
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={settings.price_filter.pairs_check_interval_minutes}
              onChange={(e) => updateSetting('price_filter', 'pairs_check_interval_minutes', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Интервал проверки цен (минуты)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.price_filter.price_check_interval_minutes}
              onChange={(e) => updateSetting('price_filter', 'price_check_interval_minutes', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Watchlist</h3>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="watchlist_auto_update"
            checked={settings.watchlist.auto_update}
            onChange={(e) => updateSetting('watchlist', 'auto_update', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="watchlist_auto_update" className="text-sm font-medium text-gray-700">
            Автоматическое обновление watchlist
          </label>
        </div>
      </div>
    </div>
  );

  const renderAlertsSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Типы алертов</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="volume_alerts_enabled"
              checked={settings.alerts.volume_alerts_enabled}
              onChange={(e) => updateSetting('alerts', 'volume_alerts_enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="volume_alerts_enabled" className="text-sm font-medium text-gray-700">
              Алерты по превышению объема
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="consecutive_alerts_enabled"
              checked={settings.alerts.consecutive_alerts_enabled}
              onChange={(e) => updateSetting('alerts', 'consecutive_alerts_enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="consecutive_alerts_enabled" className="text-sm font-medium text-gray-700">
              Алерты по последовательным LONG свечам
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="priority_alerts_enabled"
              checked={settings.alerts.priority_alerts_enabled}
              onChange={(e) => updateSetting('alerts', 'priority_alerts_enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="priority_alerts_enabled" className="text-sm font-medium text-gray-700">
              Приоритетные алерты (комбинированные)
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="notification_enabled"
              checked={settings.alerts.notification_enabled}
              onChange={(e) => updateSetting('alerts', 'notification_enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="notification_enabled" className="text-sm font-medium text-gray-700">
              Уведомления включены
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderImbalanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Money концепции</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="imbalance_enabled"
              checked={settings.imbalance.enabled}
              onChange={(e) => updateSetting('imbalance', 'enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="imbalance_enabled" className="text-sm font-medium text-gray-700">
              Анализ имбалансов включен
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="fair_value_gap_enabled"
              checked={settings.imbalance.fair_value_gap_enabled}
              onChange={(e) => updateSetting('imbalance', 'fair_value_gap_enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="fair_value_gap_enabled" className="text-sm font-medium text-gray-700">
              Fair Value Gap (FVG)
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="order_block_enabled"
              checked={settings.imbalance.order_block_enabled}
              onChange={(e) => updateSetting('imbalance', 'order_block_enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="order_block_enabled" className="text-sm font-medium text-gray-700">
              Order Block (OB)
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="breaker_block_enabled"
              checked={settings.imbalance.breaker_block_enabled}
              onChange={(e) => updateSetting('imbalance', 'breaker_block_enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="breaker_block_enabled" className="text-sm font-medium text-gray-700">
              Breaker Block (BB)
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Параметры анализа</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Минимальный гэп (%)
            </label>
            <input
              type="number"
              min="0.01"
              max="5"
              step="0.01"
              value={settings.imbalance.min_gap_percentage}
              onChange={(e) => updateSetting('imbalance', 'min_gap_percentage', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Минимальная сила сигнала
            </label>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={settings.imbalance.min_strength}
              onChange={(e) => updateSetting('imbalance', 'min_strength', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTradingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Основные параметры</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Баланс аккаунта ($)
            </label>
            <input
              type="number"
              min="100"
              value={settings.trading.account_balance}
              onChange={(e) => updateSetting('trading', 'account_balance', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Максимальный риск на сделку (%)
            </label>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={settings.trading.max_risk_per_trade}
              onChange={(e) => updateSetting('trading', 'max_risk_per_trade', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Максимум открытых сделок
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.trading.max_open_trades}
              onChange={(e) => updateSetting('trading', 'max_open_trades', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Кредитное плечо по умолчанию
            </label>
            <select
              value={settings.trading.default_leverage}
              onChange={(e) => updateSetting('trading', 'default_leverage', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 5, 10, 20, 25, 50, 75, 100].map(lev => (
                <option key={lev} value={lev}>{lev}x</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Стоп-лосс и тейк-профит</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Стоп-лосс по умолчанию (%)
            </label>
            <input
              type="number"
              min="0.5"
              max="20"
              step="0.1"
              value={settings.trading.default_stop_loss_percentage}
              onChange={(e) => updateSetting('trading', 'default_stop_loss_percentage', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тейк-профит по умолчанию (%)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              step="0.1"
              value={settings.trading.default_take_profit_percentage}
              onChange={(e) => updateSetting('trading', 'default_take_profit_percentage', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Дополнительные настройки</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="auto_calculate_quantity"
              checked={settings.trading.auto_calculate_quantity}
              onChange={(e) => updateSetting('trading', 'auto_calculate_quantity', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="auto_calculate_quantity" className="text-sm font-medium text-gray-700">
              Автоматический расчет количества
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enable_real_trading"
              checked={settings.trading.enable_real_trading}
              onChange={(e) => updateSetting('trading', 'enable_real_trading', e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="enable_real_trading" className="text-sm font-medium text-red-700">
              ⚠️ Включить реальную торговлю (ОПАСНО!)
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="confirm_trades"
              checked={settings.trading.confirm_trades}
              onChange={(e) => updateSetting('trading', 'confirm_trades', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="confirm_trades" className="text-sm font-medium text-gray-700">
              Подтверждение перед выполнением сделок
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип маржи по умолчанию
          </label>
          <select
            value={settings.trading.default_margin_type}
            onChange={(e) => updateSetting('trading', 'default_margin_type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="isolated">Изолированная</option>
            <option value="cross">Кросс</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderTelegramSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Настройки Telegram бота</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Токен бота
            </label>
            <input
              type="password"
              value={settings.telegram.bot_token}
              onChange={(e) => updateSetting('telegram', 'bot_token', e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Получите токен у @BotFather в Telegram
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID чата
            </label>
            <input
              type="text"
              value={settings.telegram.chat_id}
              onChange={(e) => updateSetting('telegram', 'chat_id', e.target.value)}
              placeholder="-1001234567890"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID чата или канала для отправки уведомлений
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Статус:</strong> {settings.telegram.enabled ? '✅ Настроен' : '❌ Не настроен'}
          </p>
          {settings.telegram.enabled && (
            <p className="text-xs text-blue-600 mt-1">
              Уведомления будут отправляться в указанный чат
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderBybitSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API ключи Bybit</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={settings.bybit.api_key}
              onChange={(e) => updateSetting('bybit', 'api_key', e.target.value)}
              placeholder="Введите API ключ"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Secret
            </label>
            <input
              type="password"
              value={settings.bybit.api_secret}
              onChange={(e) => updateSetting('bybit', 'api_secret', e.target.value)}
              placeholder="Введите секретный ключ"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Безопасность:</strong> API ключи используются только для реальной торговли.
            Убедитесь, что у ключей есть только необходимые разрешения.
          </p>
        </div>
      </div>
    </div>
  );

  const renderTimeSyncSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Синхронизация времени</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Интервал синхронизации с биржей (сек)
            </label>
            <input
              type="number"
              min="60"
              max="3600"
              value={settings.time_sync.interval}
              onChange={(e) => updateSetting('time_sync', 'interval', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Интервал синхронизации с серверами времени (сек)
            </label>
            <input
              type="number"
              min="300"
              max="86400"
              value={settings.time_sync.server_sync_interval}
              onChange={(e) => updateSetting('time_sync', 'server_sync_interval', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Сервер</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Хост
            </label>
            <input
              type="text"
              value={settings.server.host}
              onChange={(e) => updateSetting('server', 'host', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Порт
            </label>
            <input
              type="number"
              min="1000"
              max="65535"
              value={settings.server.port}
              onChange={(e) => updateSetting('server', 'port', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Логирование</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Уровень логирования
            </label>
            <select
              value={settings.logging.level}
              onChange={(e) => updateSetting('logging', 'level', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Файл логов
            </label>
            <input
              type="text"
              value={settings.logging.file}
              onChange={(e) => updateSetting('logging', 'file', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">WebSocket</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Интервал ping (сек)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={settings.websocket.ping_interval}
              onChange={(e) => updateSetting('websocket', 'ping_interval', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Таймаут ping (сек)
            </label>
            <input
              type="number"
              min="5"
              max="30"
              value={settings.websocket.ping_timeout}
              onChange={(e) => updateSetting('websocket', 'ping_timeout', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'volume_analyzer':
        return renderVolumeAnalyzerSettings();
      case 'price_filter':
        return renderPriceFilterSettings();
      case 'alerts':
        return renderAlertsSettings();
      case 'imbalance':
        return renderImbalanceSettings();
      case 'trading':
        return renderTradingSettings();
      case 'telegram':
        return renderTelegramSettings();
      case 'bybit':
        return renderBybitSettings();
      case 'time_sync':
        return renderTimeSyncSettings();
      case 'system':
        return renderSystemSettings();
      default:
        return renderVolumeAnalyzerSettings();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Настройки системы</h2>
            <p className="text-gray-600">Управление параметрами анализатора объемов</p>
          </div>

          <div className="flex items-center space-x-3">
            {success && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Сохранено</span>
              </div>
            )}

            <button
              onClick={loadSettings}
              disabled={loading}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Обновить</span>
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">Ошибка</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p>💡 Изменения сохраняются в файл .env и применяются автоматически</p>
              <p className="text-xs mt-1">Некоторые изменения могут потребовать перезапуска системы</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Сохранение...' : 'Сохранить настройки'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;