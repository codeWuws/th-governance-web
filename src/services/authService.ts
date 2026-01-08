/**
 * 认证服务
 * 提供用户登录、登出、获取用户信息等API接口
 */

import type { ApiResponse } from '@/types/common'
import { api } from '@/utils/request'
import type { User } from '@/store/slices/userSlice'

/**
 * 登录请求参数
 */
export interface LoginRequest {
    username: string
    password: string
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
    token: string
    refreshToken?: string
    user: User
}

/**
 * 认证服务类
 */
export class AuthService {
    /**
     * 用户登录
     * @param credentials 登录凭证（用户名和密码）
     * @returns Promise<LoginResponse> 登录响应，包含token和用户信息
     */
    static async login(credentials: LoginRequest): Promise<LoginResponse> {
        return await api.post<LoginResponse>('/api/auth/login', credentials, {
            returnDataOnly: true,
        })
    }

    /**
     * 用户登出
     * @returns Promise<void>
     */
    static async logout(): Promise<void> {
        try {
            await api.post<void>('/api/auth/logout', {}, { returnDataOnly: true })
        } catch (error) {
            // 即使登出接口失败，也清除本地token
            console.warn('登出接口调用失败，但已清除本地凭证', error)
        } finally {
            // 清除本地存储的token
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
        }
    }

    /**
     * 获取当前用户信息
     * @returns Promise<User> 当前登录用户信息
     */
    static async getCurrentUser(): Promise<User> {
        return await api.get<User>('/api/auth/me', { returnDataOnly: true })
    }

    /**
     * 刷新token
     * @param refreshToken 刷新token
     * @returns Promise<{ token: string; refreshToken: string }>
     */
    static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
        return await api.post<{ token: string; refreshToken: string }>(
            '/api/auth/refresh',
            { refreshToken },
            { returnDataOnly: true }
        )
    }
}

/**
 * 认证服务实例
 */
export const authService = {
    login: AuthService.login,
    logout: AuthService.logout,
    getCurrentUser: AuthService.getCurrentUser,
    refreshToken: AuthService.refreshToken,
}

export default authService


