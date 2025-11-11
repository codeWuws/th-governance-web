import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import type { NavigationState, RouteChangeEvent } from '../router/types'

export const useNavigation = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()

    // 编程式导航
    const navigateTo = useCallback(
        (path: string, options?: { replace?: boolean; state?: unknown }) => {
            navigate(path, {
                replace: options?.replace || false,
                state: options?.state,
            })
        },
        [navigate]
    )

    // 返回上一页
    const goBack = useCallback(() => {
        navigate(-1)
    }, [navigate])

    // 前进到下一页
    const goForward = useCallback(() => {
        navigate(1)
    }, [navigate])

    // 重定向（替换当前历史记录）
    const redirect = useCallback(
        (path: string, state?: unknown) => {
            navigate(path, { replace: true, state })
        },
        [navigate]
    )

    // 获取当前路径信息
    const currentPath = useMemo(() => location.pathname, [location.pathname])
    const currentSearch = useMemo(() => location.search, [location.search])
    const currentHash = useMemo(() => location.hash, [location.hash])
    const currentState = useMemo(() => location.state, [location.state])

    // 检查路径是否匹配
    const isPathMatch = useCallback(
        (path: string, exact = false) => {
            if (exact) {
                return currentPath === path
            }
            return currentPath.startsWith(path)
        },
        [currentPath]
    )

    // 检查是否在特定路由下
    const isUnderRoute = useCallback(
        (basePath: string) => {
            return currentPath.startsWith(basePath)
        },
        [currentPath]
    )

    // 获取路由参数
    const getParam = useCallback(
        (key: string) => {
            return params[key]
        },
        [params]
    )

    // 获取查询参数
    const getSearchParam = useCallback(
        (key: string) => {
            const searchParams = new URLSearchParams(currentSearch)
            return searchParams.get(key)
        },
        [currentSearch]
    )

    // 设置查询参数
    const setSearchParams = useCallback(
        (params: Record<string, string | null>) => {
            const searchParams = new URLSearchParams(currentSearch)

            Object.entries(params).forEach(([key, value]) => {
                if (value === null) {
                    searchParams.delete(key)
                } else {
                    searchParams.set(key, value)
                }
            })

            const newSearch = searchParams.toString()
            navigate(`${currentPath}${newSearch ? `?${newSearch}` : ''}`, { replace: true })
        },
        [currentPath, currentSearch, navigate]
    )

    // 构建完整的 URL
    const buildUrl = useCallback((path: string, searchParams?: Record<string, string>) => {
        let url = path
        if (searchParams) {
            const params = new URLSearchParams(searchParams)
            const queryString = params.toString()
            if (queryString) {
                url += `?${queryString}`
            }
        }
        return url
    }, [])

    // 导航状态
    const navigationState: NavigationState = useMemo(
        () => ({
            currentPath,
            previousPath: currentState?.from || null,
            canGoBack: window.history.length > 1,
            canGoForward: false, // 浏览器 API 限制，无法准确获取
            isNavigating: false, // 添加缺少的 isNavigating 属性
        }),
        [currentPath, currentState]
    )

    // 路由变化事件
    const createRouteChangeEvent = useCallback(
        (targetPath: string): RouteChangeEvent => ({
            from: currentPath,
            to: targetPath,
            timestamp: Date.now(), // 使用 Date.now() 返回数字类型
        }),
        [currentPath]
    )

    return {
        // 导航方法
        navigateTo,
        goBack,
        goForward,
        redirect,

        // 路径信息
        currentPath,
        currentSearch,
        currentHash,
        currentState,

        // 路径检查
        isPathMatch,
        isUnderRoute,

        // 参数处理
        getParam,
        getSearchParam,
        setSearchParams,

        // 工具方法
        buildUrl,

        // 状态信息
        navigationState,
        createRouteChangeEvent,

        // 原始 hooks（如果需要直接使用）
        location,
        params,
        navigate,
    }
}

// 面包屑导航 Hook
export const useBreadcrumbs = () => {
    const { currentPath } = useNavigation()

    const breadcrumbs = useMemo(() => {
        const pathSegments = currentPath.split('/').filter(Boolean)
        const crumbs = []

        // 添加首页
        crumbs.push({
            title: '首页',
            path: '/',
            isActive: currentPath === '/',
        })

        // 构建面包屑路径
        let currentBreadcrumbPath = ''
        pathSegments.forEach((segment, index) => {
            currentBreadcrumbPath += `/${segment}`
            const isLast = index === pathSegments.length - 1

            // 根据路径段生成标题
            let title = segment
            switch (segment) {
                case 'dashboard':
                    title = '仪表盘'
                    break
                case 'profile':
                    title = '个人资料'
                    break
                case 'settings':
                    title = '系统设置'
                    break
                case 'admin':
                    title = '管理后台'
                    break
                case 'users':
                    title = '用户管理'
                    break
                case 'system':
                    title = '系统设置'
                    break
                case 'examples':
                    title = '示例页面'
                    break
                case 'redux-demo':
                    title = 'Redux 演示'
                    break
                case 'redux-tools':
                    title = 'Redux 工具'
                    break
                default:
                    // 首字母大写
                    title = segment.charAt(0).toUpperCase() + segment.slice(1)
            }

            crumbs.push({
                title,
                path: currentBreadcrumbPath,
                isActive: isLast,
            })
        })

        return crumbs
    }, [currentPath])

    return breadcrumbs
}

// 路由权限检查 Hook
export const useRouteAuth = () => {
    const { currentPath } = useNavigation()

    const checkRoutePermission = useCallback(() => {
        // 这里应该从 Redux store 或其他状态管理中获取用户信息
        // 暂时返回 true，实际项目中需要实现具体的权限逻辑
        return true
    }, [])

    const isProtectedRoute = useMemo(() => {
        const protectedPaths = ['/dashboard', '/admin', '/profile']
        return protectedPaths.some(path => currentPath.startsWith(path))
    }, [currentPath])

    return {
        checkRoutePermission,
        isProtectedRoute,
    }
}

export default useNavigation
