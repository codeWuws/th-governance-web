import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { refreshUserInfo, selectIsAuthenticated, selectUserLoading } from '@/store/slices/userSlice'

interface ProtectedRouteProps {
    children: React.ReactElement
}

/**
 * 路由守卫组件
 * 用于保护需要登录才能访问的路由
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const dispatch = useAppDispatch()
    const isAuthenticated = useAppSelector(selectIsAuthenticated)
    const loading = useAppSelector(selectUserLoading)
    const location = useLocation()
    const [hasChecked, setHasChecked] = useState(false)

    // 初始化时检查token和用户状态
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('access_token')
            
            // 如果没有token，直接标记检查完成（未登录）
            if (!token) {
                setHasChecked(true)
                return
            }

            // 如果有token，尝试通过 /auth/info 接口重新获取用户信息
            try {
                await dispatch(refreshUserInfo()).unwrap()
            } catch (error) {
                // 获取用户信息失败，清除token并跳转到登录页
                console.warn('刷新用户信息失败:', error)
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                localStorage.removeItem('token_type')
                localStorage.removeItem('mqtt_key')
                localStorage.removeItem('user_id')
                localStorage.removeItem('token_expires_at')
            } finally {
                setHasChecked(true)
            }
        }

        checkAuth()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // 只在组件挂载时执行一次

    // 监听认证状态变化
    useEffect(() => {
        if (isAuthenticated) {
            setHasChecked(true)
        }
    }, [isAuthenticated])

    // 如果正在检查或加载中，不渲染任何内容（避免闪烁）
    if (!hasChecked || loading) {
        return null
    }

    // 如果未登录，重定向到登录页，并保存当前路径以便登录后跳转
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}

export default ProtectedRoute

