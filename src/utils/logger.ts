/**
 * 日志工具函数
 */

import { getAppConfig, isDevelopment } from './env'

export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
} as const

export type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel]

const LOG_LEVEL_MAP: Record<string, LogLevelType> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
}

class Logger {
    private level: LogLevelType
    private prefix: string

    constructor(prefix = '🚀 App') {
        const configLevel = getAppConfig().logLevel || 'info'
        this.level = LOG_LEVEL_MAP[configLevel] || LogLevel.INFO
        this.prefix = prefix
    }

    private shouldLog(level: LogLevelType): boolean {
        return level >= this.level
    }

    private formatMessage(level: string, message: string, ...args: unknown[]): unknown[] {
        const timestamp = new Date().toLocaleTimeString()
        return [`[${timestamp}] ${this.prefix} ${level}:`, message, ...args]
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.DEBUG) && isDevelopment()) {
            console.log(...this.formatMessage('🐛 DEBUG', message, ...args))
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.INFO) && isDevelopment()) {
            console.info(...this.formatMessage('ℹ️ INFO', message, ...args))
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(...this.formatMessage('⚠️ WARN', message, ...args))
        }
    }

    error(message: string, error?: Error, ...args: unknown[]): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(...this.formatMessage('❌ ERROR', message, ...args), error)
        }
    }

    group(label: string): void {
        if (isDevelopment()) {
            console.group(label)
        }
    }

    groupEnd(): void {
        if (isDevelopment()) {
            console.groupEnd()
        }
    }

    table(data: unknown): void {
        if (isDevelopment()) {
            console.table(data)
        }
    }

    time(label: string): void {
        if (isDevelopment()) {
            console.time(label)
        }
    }

    timeEnd(label: string): void {
        if (isDevelopment()) {
            console.timeEnd(label)
        }
    }
}

// 创建默认日志实例
export const logger = new Logger()

// 创建特定模块的日志实例
export const createLogger = (prefix: string) => new Logger(prefix)

// 性能监控
export const performance = {
    mark: (name: string) => {
        if (isDevelopment() && 'performance' in window) {
            window.performance.mark(name)
        }
    },

    measure: (name: string, startMark: string, endMark?: string) => {
        if (isDevelopment() && 'performance' in window) {
            try {
                window.performance.measure(name, startMark, endMark)
                const entries = window.performance.getEntriesByName(name)
                const entry = entries[entries.length - 1]
                if (entry) {
                    logger.info(`⏱️ Performance: ${name} took ${entry.duration.toFixed(2)}ms`)
                }
            } catch (error) {
                logger.warn('Performance measurement failed:', error)
            }
        }
    },

    clearMarks: (name?: string) => {
        if (isDevelopment() && 'performance' in window) {
            window.performance.clearMarks(name)
        }
    },

    clearMeasures: (name?: string) => {
        if (isDevelopment() && 'performance' in window) {
            window.performance.clearMeasures(name)
        }
    },
}
