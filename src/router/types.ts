/**
 * 导航状态接口
 */
export interface NavigationState {
    /** 当前路径 */
    currentPath: string
    /** 上一个路径 */
    previousPath: string | null
    /** 是否可以后退 */
    canGoBack: boolean
    /** 是否可以前进 */
    canGoForward: boolean
    /** 是否正在导航 */
    isNavigating: boolean
}

/**
 * 路由变化事件接口
 */
export interface RouteChangeEvent {
    /** 来源路径 */
    from: string
    /** 目标路径 */
    to: string
    /** 时间戳 */
    timestamp: number
}
