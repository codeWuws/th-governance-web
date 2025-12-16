/// <reference types="vite/client" />

/**
 * Vite 环境变量类型定义
 * 用于 TypeScript 类型检查和 IDE 自动补全
 */
interface ImportMetaEnv {
    /**
     * 应用版本模式
     * - dev: 开发版本，所有模块都支持接口调用
     * - demo: 演示版本，只保留数据治理模块的接口，其他模块使用模拟数据
     */
    readonly VITE_APP_VERSION: 'dev' | 'demo'

    /**
     * 应用标题
     */
    readonly VITE_APP_TITLE: string

    /**
     * API 基础地址
     */
    readonly VITE_APP_API_BASE_URL: string

    /**
     * API 请求超时时间（毫秒）
     */
    readonly VITE_APP_API_TIMEOUT: string

    /**
     * 是否启用开发工具
     */
    readonly VITE_APP_ENABLE_DEVTOOLS: string

    /**
     * 是否启用分析统计
     */
    readonly VITE_APP_ENABLE_ANALYTICS: string

    /**
     * 日志级别
     */
    readonly VITE_APP_LOG_LEVEL: string

    /**
     * 是否显示性能监控
     */
    readonly VITE_APP_SHOW_PERFORMANCE: string

    /**
     * 应用环境
     */
    readonly VITE_APP_ENV: string

    /**
     * 应用版本号
     */
    readonly VITE_APP_VERSION_NUMBER?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

