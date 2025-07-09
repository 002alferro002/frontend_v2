import React, { useState, useEffect } from 'react';
import { X, Calculator, TrendingUp, TrendingDown, DollarSign, Percent, Target, AlertTriangle, Edit, Trash2, ExternalLink, BarChart3 } from 'lucide-react';
import { useTimeZone } from '../contexts/TimeZoneContext';
import { formatTime } from '../utils/timeUtils';

interface PaperTrade {
  id: number;
  symbol: string;
  alert_id?: number;
  direction: 'LONG' | 'SHORT';
  trade_type: 'LONG' | 'SHORT';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  quantity: number;
  leverage: number;
  margin_type: 'isolated' | 'cross';
  risk_amount: number;
  risk_percentage: number;
  position_value: number;
  potential_loss: number;
  potential_profit: number;
  risk_reward_ratio: number;
  status: 'planned' | 'active' | 'closed' | 'cancelled';
  current_price?: number;
  current_pnl?: number;
  current_pnl_percentage?: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  close_reason?: 'take_profit' | 'stop_loss' | 'manual' | 'cancelled';
  notes?: string;
}

interface PaperTradesModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

const PaperTradesModal: React.FC<PaperTradesModalProps> = ({ onClose, onUpdate }) => {
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'planned'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'pnl' | 'symbol'>('created_at');
  const [editingTrade, setEditingTrade] = useState<PaperTrade | null>(null);
  const [stats, setStats] = useState({
    total_trades: 0,
    active_trades: 0,
    closed_trades: 0,
    total_pnl: 0,
    win_rate: 0,
    avg_win: 0,
    avg_loss: 0,
    best_trade: 0,
    worst_trade: 0
  });

  const { timeZone } = useTimeZone();

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/paper-trades');
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
        setStats(data.stats || stats);
      } else {
        throw new Error('Ошибка загрузки бумажных сделок');
      }
    } catch (error) {
      console.error('Error loading paper trades:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const updateTrade = async (tradeId: number, updates: Partial<PaperTrade>) => {
    try {
      const response = await fetch(`/api/paper-trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await loadTrades();
        onUpdate();
      } else {
        throw new Error('Ошибка обновления сделки');
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      alert('Ошибка обновления сделки');
    }
  };

  const closeTrade = async (tradeId: number, reason: 'take_profit' | 'stop_loss' | 'manual') => {
    if (!confirm('Закрыть эту сделку?')) return;

    try {
      const response = await fetch(`/api/paper-trades/${tradeId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        await loadTrades();
        onUpdate();
      } else {
        throw new Error('Ошибка закрытия сделки');
      }
    } catch (error) {
      console.error('Error closing trade:', error);
      alert('Ошибка закрытия сделки');
    }
  };

  const deleteTrade = async (tradeId: number) => {
    if (!confirm('Удалить эту сделку? Это действие нельзя отменить.')) return;

    try {
      const response = await fetch(`/api/paper-trades/${tradeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTrades();
        onUpdate();
      } else {
        throw new Error('Ошибка удаления сделки');
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Ошибка удаления сделки');
    }
  };

  const openTradingView = (symbol: string) => {
    const cleanSymbol = symbol.replace('USDT', '');
    const url = `https://www.tradingview.com/chart/?symbol=BYBIT:${cleanSymbol}USDT.P&interval=1`;
    window.open(url, '_blank');
  };

  const getFilteredTrades = () => {
    let filtered = trades;

    if (filter !== 'all') {
      filtered = filtered.filter(trade => trade.status === filter);
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'pnl':
          return (b.current_pnl || 0) - (a.current_pnl || 0);
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-700">Загрузка бумажных сделок...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Бумажные сделки</h2>
            <p className="text-gray-600">Управление виртуальными сделками</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total_trades}</div>
              <div className="text-sm text-gray-600">Всего сделок</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.active_trades}</div>
              <div className="text-sm text-gray-600">Активных</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getPnlColor(stats.total_pnl)}`}>
                {stats.total_pnl >= 0 ? '+' : ''}${stats.total_pnl.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Общий PnL</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.win_rate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Винрейт</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">+${stats.avg_win.toFixed(2)}</div>
              <div className="text-lg font-bold text-red-600">-${Math.abs(stats.avg_loss).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Ср. прибыль/убыток</div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Фильтр:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все ({trades.length})</option>
                <option value="planned">Запланированные ({trades.filter(t => t.status === 'planned').length})</option>
                <option value="active">Активные ({trades.filter(t => t.status === 'active').length})</option>
                <option value="closed">Закрытые ({trades.filter(t => t.status === 'closed').length})</option>
              </select>

              <span className="text-sm font-medium text-gray-700 ml-4">Сортировка:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at">По дате</option>
                <option value="pnl">По PnL</option>
                <option value="symbol">По символу</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadTrades}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Calculator className="w-4 h-4" />
              <span>Обновить</span>
            </button>
          </div>
        </div>

        {/* Trades List */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadTrades}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          ) : getFilteredTrades().length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Нет бумажных сделок</p>
              <p className="text-sm text-gray-500 mt-2">
                Создайте бумажную сделку из алерта или через калькулятор торговли
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredTrades().map((trade) => (
                <div
                  key={trade.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        trade.direction === 'LONG' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg text-gray-900">{trade.symbol}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.direction === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.direction}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(trade.status)}`}>
                            {trade.status === 'planned' ? 'Запланирована' :
                             trade.status === 'active' ? 'Активна' :
                             trade.status === 'closed' ? 'Закрыта' : 'Отменена'}
                          </span>
                          {trade.leverage > 1 && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {trade.leverage}x
                            </span>
                          )}
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {trade.margin_type === 'isolated' ? 'Изолированная' : 'Кросс'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Создана: {formatTime(trade.created_at, timeZone)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openTradingView(trade.symbol)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Открыть в TradingView"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {trade.status === 'active' && (
                        <button
                          onClick={() => closeTrade(trade.id, 'manual')}
                          className="text-orange-600 hover:text-orange-800 p-1"
                          title="Закрыть сделку"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setEditingTrade(trade)}
                        className="text-gray-600 hover:text-gray-800 p-1"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteTrade(trade.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Trade Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Вход:</span>
                      <div className="font-mono text-gray-900">${trade.entry_price.toFixed(8)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Стоп-лосс:</span>
                      <div className="font-mono text-red-600">${trade.stop_loss.toFixed(8)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Тейк-профит:</span>
                      <div className="font-mono text-green-600">${trade.take_profit.toFixed(8)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Количество:</span>
                      <div className="font-mono text-gray-900">{trade.quantity.toFixed(8)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Риск:</span>
                      <div className="font-mono text-orange-600">
                        ${trade.risk_amount.toFixed(2)} ({trade.risk_percentage.toFixed(2)}%)
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">R:R:</span>
                      <div className="font-mono text-blue-600">1:{trade.risk_reward_ratio.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Current PnL */}
                  {trade.status === 'active' && trade.current_pnl !== undefined && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Текущий PnL:</span>
                        <div className="flex items-center space-x-4">
                          <span className={`font-bold text-lg ${getPnlColor(trade.current_pnl)}`}>
                            {trade.current_pnl >= 0 ? '+' : ''}${trade.current_pnl.toFixed(2)}
                          </span>
                          {trade.current_pnl_percentage !== undefined && (
                            <span className={`text-sm ${getPnlColor(trade.current_pnl)}`}>
                              ({trade.current_pnl_percentage >= 0 ? '+' : ''}{trade.current_pnl_percentage.toFixed(2)}%)
                            </span>
                          )}
                          {trade.current_price && (
                            <span className="text-sm text-gray-600">
                              @ ${trade.current_price.toFixed(8)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Closed Trade Info */}
                  {trade.status === 'closed' && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-600">Закрыта: </span>
                          <span className="text-gray-900">
                            {formatTime(trade.closed_at || trade.updated_at, timeZone)}
                          </span>
                          {trade.close_reason && (
                            <span className="ml-2 text-sm text-gray-600">
                              ({trade.close_reason === 'take_profit' ? 'Тейк-профит' :
                                trade.close_reason === 'stop_loss' ? 'Стоп-лосс' :
                                trade.close_reason === 'manual' ? 'Вручную' : 'Отменена'})
                            </span>
                          )}
                        </div>
                        {trade.current_pnl !== undefined && (
                          <span className={`font-bold text-lg ${getPnlColor(trade.current_pnl)}`}>
                            {trade.current_pnl >= 0 ? '+' : ''}${trade.current_pnl.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {trade.notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-900 text-sm">{trade.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Показано: {getFilteredTrades().length} из {trades.length} сделок
            </span>
            <div className="flex items-center space-x-4">
              <span>Общий PnL: <span className={getPnlColor(stats.total_pnl)}>
                {stats.total_pnl >= 0 ? '+' : ''}${stats.total_pnl.toFixed(2)}
              </span></span>
              <span>Винрейт: {stats.win_rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTradesModal;