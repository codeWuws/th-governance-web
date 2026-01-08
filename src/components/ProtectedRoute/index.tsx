import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchUserInfo, selectIsAuthenticated, selectUserLoading } from '@/store/slices/userSlice'

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

            // 如果已经认证，标记检查完成
            if (isAuthenticated) {
                setHasChecked(true)
                return
            }

            // 如果有token但未认证，尝试恢复用户状态
            if (token && !isAuthenticated) {
                const tokenMatch = token.match(/mock_jwt_token_(\w+)_/)
                if (tokenMatch) {
                    const username = tokenMatch[1]
                    const userIdMap: Record<string, number> = {
                        admin: 1,
                        doctor: 2,
                        researcher: 3,
                    }
                    const userId = userIdMap[username]
                    if (userId) {
                        try {
                            await dispatch(fetchUserInfo(userId)).unwrap()
                        } catch (error) {
                            // 恢复失败，清除token
                            localStorage.removeItem('access_token')
                        }
                    } else {
                        // 用户名无效，清除token
                        localStorage.removeItem('access_token')
                    }
                } else {
                    // token格式无效，清除token
                    localStorage.removeItem('access_token')
                }
            }
            
            setHasChecked(true)
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

