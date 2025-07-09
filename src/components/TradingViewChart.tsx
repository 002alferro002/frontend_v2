"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
} from "lucide-react"

interface TradingViewChartProps {
  symbol: string
  alertPrice?: number
  alertTime?: number | string
  alerts?: any[]
  onClose: () => void
  onError?: () => void
  theme?: "light" | "dark"
}

declare global {
  interface Window {
    LightweightCharts: any
  }
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  alertPrice,
  alertTime,
  alerts = [],
  onClose,
  onError,
  theme = "light",
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candlestickSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const mountedRef = useRef(true)
  const scriptLoadedRef = useRef(false)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [interval, setInterval] = useState("1m")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [dataSource, setDataSource] = useState<"api" | "mock">("api")

  // Генерация mock данных
  const generateMockData = useCallback(() => {
    const now = Date.now()
    const data = []
    let price = alertPrice || 50000

    for (let i = 119; i >= 0; i--) {
      const timestamp = now - i * 60 * 1000
      const change = (Math.random() - 0.5) * price * 0.02
      const open = price
      const close = price + change
      const high = Math.max(open, close) + Math.random() * price * 0.01
      const low = Math.min(open, close) - Math.random() * price * 0.01
      const volume = Math.random() * 1000000

      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
        volume_usdt: volume * price,
        is_long: close > open,
      })

      price = close
    }

    return data
  }, [alertPrice])

  // Загрузка скрипта Lightweight Charts
  const loadLightweightCharts = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Если уже загружен
      if (window.LightweightCharts && scriptLoadedRef.current) {
        resolve()
        return
      }

      // Проверяем существующий скрипт
      const existingScript = document.querySelector('script[src*="lightweight-charts"]')
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement("script")
      script.src = "https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js"
      script.async = true
      script.crossOrigin = "anonymous"

      const timeout = setTimeout(() => {
        script.remove()
        reject(new Error("Timeout loading Lightweight Charts"))
      }, 10000)

      script.onload = () => {
        clearTimeout(timeout)
        if (window.LightweightCharts) {
          scriptLoadedRef.current = true
          console.log("✅ Lightweight Charts loaded successfully")
          resolve()
        } else {
          reject(new Error("LightweightCharts not available"))
        }
      }

      script.onerror = () => {
        clearTimeout(timeout)
        script.remove()
        reject(new Error("Failed to load Lightweight Charts"))
      }

      document.head.appendChild(script)
    })
  }, [])

  // Загрузка данных графика
  const loadChartData = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setError(null)
      let candleData = []

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(`/api/chart-data/${symbol}?interval=${interval}&hours=24`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          candleData = data.chart_data || data.data || data || []
          setDataSource("api")
          console.log("✅ API data loaded:", candleData.length, "candles")
        } else {
          throw new Error(`API returned ${response.status}`)
        }
      } catch (apiError) {
        console.warn("⚠️ API failed, using mock data:", apiError)
        candleData = generateMockData()
        setDataSource("mock")
      }

      if (mountedRef.current) {
        setChartData(candleData)
      }
    } catch (err) {
      console.error("❌ Chart data loading error:", err)
      if (mountedRef.current) {
        const mockData = generateMockData()
        setChartData(mockData)
        setDataSource("mock")
      }
    }
  }, [symbol, interval, generateMockData])

  // Создание графика
  const createChart = useCallback(() => {
    if (!containerRef.current || !window.LightweightCharts || !mountedRef.current || chartData.length === 0) {
      return
    }

    // Очищаем предыдущий график
    if (chartRef.current) {
      try {
        chartRef.current.remove()
      } catch (e) {
        console.warn("Chart cleanup warning:", e)
      }
      chartRef.current = null
    }

    try {
      const chart = window.LightweightCharts.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { color: theme === "dark" ? "#1e1e1e" : "#ffffff" },
          textColor: theme === "dark" ? "#ffffff" : "#333333",
        },
        grid: {
          vertLines: { color: theme === "dark" ? "#2a2a2a" : "#f0f0f0" },
          horzLines: { color: theme === "dark" ? "#2a2a2a" : "#f0f0f0" },
        },
        crosshair: {
          mode: window.LightweightCharts.CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: theme === "dark" ? "#485158" : "#cccccc",
        },
        timeScale: {
          borderColor: theme === "dark" ? "#485158" : "#cccccc",
          timeVisible: true,
          secondsVisible: false,
        },
      })

      chartRef.current = chart

      // Добавляем серию свечей
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      })

      candlestickSeriesRef.current = candlestickSeries

      // Добавляем серию объемов
      const volumeSeries = chart.addHistogramSeries({
        color: "#26a69a",
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "volume",
      })

      volumeSeriesRef.current = volumeSeries

      // Настраиваем шкалу объемов
      chart.priceScale("volume").applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      })

      // Подготавливаем данные
      const candleData = chartData
        .map((item) => ({
          time: Math.floor((item.timestamp || Date.now()) / 1000),
          open: Number(item.open) || 0,
          high: Number(item.high) || 0,
          low: Number(item.low) || 0,
          close: Number(item.close) || 0,
        }))
        .filter((item) => item.open > 0 && item.high > 0 && item.low > 0 && item.close > 0)
        .sort((a, b) => a.time - b.time)

      const volumeData = chartData
        .map((item) => ({
          time: Math.floor((item.timestamp || Date.now()) / 1000),
          value: Number(item.volume_usdt || item.volume) || 0,
          color: item.is_long ? "#26a69a" : "#ef5350",
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => a.time - b.time)

      if (candleData.length > 0) {
        candlestickSeries.setData(candleData)
      }

      if (volumeData.length > 0) {
        volumeSeries.setData(volumeData)
      }

      // Добавляем маркеры алертов
      if (alertPrice && candlestickSeries) {
        const alertTimestamp = alertTime
          ? Math.floor((typeof alertTime === "number" ? alertTime : new Date(alertTime).getTime()) / 1000)
          : Math.floor(Date.now() / 1000)

        const markers = [
          {
            time: alertTimestamp,
            position: "aboveBar" as const,
            color: "#f68410",
            shape: "circle" as const,
            text: `🎯 Alert: $${alertPrice.toFixed(6)}`,
          },
        ]

        candlestickSeries.setMarkers(markers)
      }

      // Подгоняем график
      chart.timeScale().fitContent()

      // Обработчик изменения размера
      const resizeHandler = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          })
        }
      }

      window.addEventListener("resize", resizeHandler)

      // Сохраняем обработчик для очистки
      ;(chart as any)._resizeHandler = resizeHandler

      setIsLoading(false)
      setError(null)

      console.log("✅ Chart created successfully with", chartData.length, "data points")
    } catch (error) {
      console.error("❌ Chart creation error:", error)
      if (mountedRef.current) {
        setError("Ошибка создания графика")
        setIsLoading(false)
      }
    }
  }, [chartData, theme, alertPrice, alertTime])

  // Инициализация
  const initialize = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setIsLoading(true)
      setError(null)

      // Загружаем скрипт
      await loadLightweightCharts()

      if (!mountedRef.current) return

      // Загружаем данные
      await loadChartData()
    } catch (err) {
      console.error("❌ Initialization error:", err)
      if (mountedRef.current) {
        setError("Ошибка загрузки графика")
        setIsLoading(false)
        if (onError) {
          setTimeout(() => onError(), 1000)
        }
      }
    }
  }, [loadLightweightCharts, loadChartData, onError])

  // Retry функция
  const retry = useCallback(() => {
    setError(null)
    setIsLoading(true)
    scriptLoadedRef.current = false

    // Очищаем график
    if (chartRef.current) {
      try {
        if ((chartRef.current as any)._resizeHandler) {
          window.removeEventListener("resize", (chartRef.current as any)._resizeHandler)
        }
        chartRef.current.remove()
      } catch (e) {
        console.warn("Cleanup warning:", e)
      }
      chartRef.current = null
    }

    // Удаляем скрипт
    const existingScript = document.querySelector('script[src*="lightweight-charts"]')
    if (existingScript) {
      existingScript.remove()
    }

    if (window.LightweightCharts) {
      delete window.LightweightCharts
    }

    setTimeout(() => {
      if (mountedRef.current) {
        initialize()
      }
    }, 500)
  }, [initialize])

  // Effects
  useEffect(() => {
    mountedRef.current = true
    initialize()

    return () => {
      mountedRef.current = false
      if (chartRef.current) {
        try {
          if ((chartRef.current as any)._resizeHandler) {
            window.removeEventListener("resize", (chartRef.current as any)._resizeHandler)
          }
          chartRef.current.remove()
        } catch (e) {
          console.warn("Cleanup warning:", e)
        }
      }
    }
  }, [initialize])

  useEffect(() => {
    if (chartData.length > 0 && window.LightweightCharts && mountedRef.current) {
      createChart()
    }
  }, [chartData, createChart])

  useEffect(() => {
    if (!isLoading && !error && mountedRef.current) {
      loadChartData()
    }
  }, [interval, loadChartData, isLoading, error])

  // Handlers
  const openInTradingView = () => {
    const cleanSymbol = symbol.replace("USDT", "")
    const tvInterval =
      interval === "1m"
        ? "1"
        : interval === "5m"
          ? "5"
          : interval === "15m"
            ? "15"
            : interval === "1h"
              ? "60"
              : interval === "4h"
                ? "240"
                : "1D"
    const url = `https://www.tradingview.com/chart/?symbol=BYBIT:${cleanSymbol}USDT.P&interval=${tvInterval}`
    window.open(url, "_blank")
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const intervals = [
    { value: "1m", label: "1м" },
    { value: "5m", label: "5м" },
    { value: "15m", label: "15м" },
    { value: "1h", label: "1ч" },
    { value: "4h", label: "4ч" },
    { value: "1d", label: "1д" },
  ]

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${
        isFullscreen ? "p-0" : ""
      }`}
    >
      <div
        className={`bg-white rounded-lg flex flex-col ${
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-[95vw] h-[90vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">{symbol}</h2>
            {alertPrice && (
              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Alert: ${alertPrice.toFixed(6)}
              </span>
            )}
            {alertTime && (
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(typeof alertTime === "number" ? alertTime : alertTime).toLocaleTimeString()}
              </span>
            )}
            {dataSource === "mock" && (
              <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Demo данные</span>
            )}
            <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Lightweight Charts</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Trading buttons */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors">
                <TrendingUp className="w-3 h-3" />
                <span>LONG</span>
              </button>
              <button className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors">
                <TrendingDown className="w-3 h-3" />
                <span>SHORT</span>
              </button>
            </div>

            {/* Intervals */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {intervals.map((int) => (
                <button
                  key={int.value}
                  onClick={() => setInterval(int.value)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    interval === int.value ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {int.label}
                </button>
              ))}
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-gray-600 hover:text-gray-800 p-2"
              title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={openInTradingView}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>TradingView</span>
            </button>

            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Загрузка графика...</p>
                <p className="text-xs text-gray-500 mt-2">
                  {dataSource === "mock" ? "Используются demo данные" : "Загрузка с API"}
                </p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center max-w-md">
                <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <p className="text-orange-600 mb-4">{error}</p>
                <div className="space-y-2">
                  <button
                    onClick={retry}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Попробовать снова</span>
                  </button>
                  <button
                    onClick={openInTradingView}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Открыть в TradingView
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={containerRef} className="w-full h-full" style={{ minHeight: "400px" }} />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Данные: {dataSource === "api" ? "API Backend" : "Demo данные"} • Powered by Lightweight Charts</span>
            <div className="flex items-center space-x-4">
              <span>📈 LONG: прибыль при росте</span>
              <span>📉 SHORT: прибыль при падении</span>
              <span>Свечей: {chartData.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradingViewChart
