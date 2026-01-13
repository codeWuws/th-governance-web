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
    accessToken: string
    refreshToken: string
    expiresIn: number
    tokenType: string
    mqttKey: string
    userId: number
}

/**
 * 用户详细信息（从 /auth/info 接口返回）
 */
export interface UserInfoDetail {
    userId: number
    deptId: number
    token: string
    loginTime: number
    expireTime: number
    ipaddr: string
    loginLocation: string
    browser: string
    os: string
    permissions: string[]
    roles: string[]
    user: {
        id: number
        createBy: string
        createTime: string
        updateBy: string
        updateTime: string
        remark: string
        delFlag: number
        username: string
        nickName: string
        email: string
        phoneNumber: string
        sex: string
        avatar: string
        password: string
        status: string
        deptId: number
        postId: number
    }
    mqttKey: string
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
        const response = await api.post<LoginResponse>('/auth/login', credentials, {
            returnDataOnly: true,
            skipErrorHandler: true, // 跳过全局错误处理，由页面统一处理
        })
        
        // 持久化存储 token 相关信息
        if (response.accessToken) {
            localStorage.setItem('access_token', response.accessToken)
        }
        if (response.refreshToken) {
            localStorage.setItem('refresh_token', response.refreshToken)
        }
        if (response.tokenType) {
            localStorage.setItem('token_type', response.tokenType)
        }
        if (response.mqttKey) {
            localStorage.setItem('mqtt_key', response.mqttKey)
        }
        if (response.userId) {
            localStorage.setItem('user_id', String(response.userId))
        }
        if (response.expiresIn) {
            // 计算过期时间并存储
            const expiresAt = Date.now() + response.expiresIn * 1000
            localStorage.setItem('token_expires_at', String(expiresAt))
        }
        
        return response
    }

    /**
     * 用户登出
     * @returns Promise<void>
     */
    static async logout(): Promise<void> {
        try {
            await api.post<void>('/auth/logout', {}, { returnDataOnly: true })
        } catch (error) {
            // 即使登出接口失败，也清除本地token
            console.warn('登出接口调用失败，但已清除本地凭证', error)
        } finally {
            // 清除本地存储的token和相关信息
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('token_type')
            localStorage.removeItem('mqtt_key')
            localStorage.removeItem('user_id')
            localStorage.removeItem('token_expires_at')
        }
    }

    /**
     * 获取当前用户信息（通过 /auth/info 接口）
     * @returns Promise<UserInfoDetail> 当前登录用户详细信息
     */
    static async getUserInfo(): Promise<UserInfoDetail> {
        return await api.get<UserInfoDetail>('/auth/info', { 
            returnDataOnly: true,
            skipErrorHandler: true, // 跳过全局错误处理，由调用方统一处理
        })
    }

    /**
     * 获取当前用户信息（兼容旧接口）
     * @returns Promise<User> 当前登录用户信息
     */
    static async getCurrentUser(): Promise<User> {
        return await api.get<User>('/auth/me', { returnDataOnly: true })
    }

    /**
     * 刷新token
     * @param refreshToken 刷新token
     * @returns Promise<{ token: string; refreshToken: string }>
     */
    static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
        return await api.post<{ token: string; refreshToken: string }>(
            '/auth/refresh',
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
    getUserInfo: AuthService.getUserInfo,
    getCurrentUser: AuthService.getCurrentUser,
    refreshToken: AuthService.refreshToken,
}

export default authService


