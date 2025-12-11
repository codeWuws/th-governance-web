/**
 * RBAC系统模拟数据生成器
 * 提供用户、角色、权限的模拟数据
 */

import { User, Role, UserStatus, RoleStatus } from '@/types/rbac'
import { menuItems } from '@/components/Layout/Sidebar'

// 收集菜单叶子节点 key 作为权限项
const collectLeafKeys = (items: any[]): string[] => {
    const result: string[] = []
    const walk = (nodes: any[]) => {
        nodes.forEach(node => {
            const children = (node as any).children as any[] | undefined
            if (children && children.length) {
                walk(children)
            } else {
                if (typeof node.key === 'string' && node.key.startsWith('/')) {
                    result.push(node.key)
                }
            }
        })
    }
    walk(items)
    return result
}

const ALL_MENU_KEYS = collectLeafKeys(menuItems as any)

// 模拟角色数据
const mockRoles: Role[] = [
    {
        id: '1',
        name: '超级管理员',
        code: 'SUPER_ADMIN',
        description: '系统超级管理员，拥有所有权限',
        status: RoleStatus.ACTIVE,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        permissions: ALL_MENU_KEYS,
    },
    {
        id: '2',
        name: '系统管理员',
        code: 'SYSTEM_ADMIN',
        description: '系统管理员，拥有系统设置权限',
        status: RoleStatus.ACTIVE,
        sortOrder: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        permissions: [
            '/system-settings/users',
            '/system-settings/roles',
            '/system-settings/permissions',
        ],
    },
    {
        id: '3',
        name: '数据管理员',
        code: 'DATA_ADMIN',
        description: '数据管理员，拥有数据管理权限',
        status: RoleStatus.ACTIVE,
        sortOrder: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        permissions: [
            '/dashboard',
            '/data-management/metadata',
            '/data-management/standards',
            '/data-management/business-datasets',
            '/data-management/medical-dictionaries',
            '/data-management/state-dictionaries',
            '/data-management/relationships',
            '/data-management/auto-discovery',
            '/data-management/visualization',
            '/data-management/impact-analysis',
            '/data-management/index-rules',
            '/data-management/index-configuration',
            '/data-management/index-processing',
        ],
    },
    {
        id: '4',
        name: '普通用户',
        code: 'USER',
        description: '普通用户，仅拥有基本查看权限',
        status: RoleStatus.ACTIVE,
        sortOrder: 4,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        permissions: ['/dashboard'],
    },
]

// 模拟用户数据
const mockUsers: User[] = [
    {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        phone: '13800138000',
        realName: '超级管理员',
        avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
        status: UserStatus.ACTIVE,
        roles: [mockRoles[0]!],
        department: '技术部',
        position: '技术总监',
        lastLoginAt: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
    },
    {
        id: '2',
        username: 'system_admin',
        email: 'system@example.com',
        phone: '13800138001',
        realName: '系统管理员',
        avatar: 'https://gw.alipayobjects.com/zos/rmsportal/gaOngJwsRYRaVAuXXcmB.png',
        status: UserStatus.ACTIVE,
        roles: [mockRoles[1]!],
        department: '运维部',
        position: '系统管理员',
        lastLoginAt: '2024-01-14T15:20:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-14T15:20:00Z',
    },
    {
        id: '3',
        username: 'data_admin',
        email: 'data@example.com',
        phone: '13800138002',
        realName: '数据管理员',
        avatar: 'https://gw.alipayobjects.com/zos/rmsportal/WhxKECPNujWoWEFNdnJO.png',
        status: UserStatus.ACTIVE,
        roles: [mockRoles[2]!],
        department: '数据部',
        position: '数据分析师',
        lastLoginAt: '2024-01-13T09:15:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
    },
    {
        id: '4',
        username: 'user1',
        email: 'user1@example.com',
        phone: '13800138003',
        realName: '张三',
        avatar: 'https://gw.alipayobjects.com/zos/rmsportal/ubnKSIfAJTxIgXOKlciN.png',
        status: UserStatus.ACTIVE,
        roles: [mockRoles[3]!],
        department: '业务部',
        position: '业务专员',
        lastLoginAt: '2024-01-12T14:45:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-12T14:45:00Z',
    },
    {
        id: '5',
        username: 'user2',
        email: 'user2@example.com',
        phone: '13800138004',
        realName: '李四',
        avatar: 'https://gw.alipayobjects.com/zos/rmsportal/jZUIxmJycoymBheLOOtb.png',
        status: UserStatus.DISABLED,
        roles: [mockRoles[3]!],
        department: '业务部',
        position: '业务助理',
        lastLoginAt: '2024-01-10T11:30:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T11:30:00Z',
    },
]

// 模拟数据存储
let users = [...mockUsers]
let roles = [...mockRoles]

// 生成唯一ID
const generateId = (prefix: string) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 用户管理模拟API
export const mockUserApi = {
    // 获取用户列表
    getUserList: async (params: any) => {
        await delay(300)
        const { page = 1, pageSize = 10, keyword = '', status, roleId } = params

        let filteredUsers = users.filter(user => {
            const matchesKeyword =
                !keyword ||
                user.username.toLowerCase().includes(keyword.toLowerCase()) ||
                user.realName.toLowerCase().includes(keyword.toLowerCase()) ||
                user.email.toLowerCase().includes(keyword.toLowerCase())

            const matchesStatus = !status || user.status === status
            const matchesRole = !roleId || user.roles.some(role => role.id === roleId)

            return matchesKeyword && matchesStatus && matchesRole
        })

        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const records = filteredUsers.slice(startIndex, endIndex)

        return {
            data: {
                success: true,
                data: {
                    records,
                    total: filteredUsers.length,
                    page,
                    pageSize,
                },
                message: '获取用户列表成功',
            },
        }
    },

    // 获取用户详情
    getUserById: async (id: string) => {
        await delay(200)
        const user = users.find(u => u.id === id)
        if (!user) {
            throw new Error('用户不存在')
        }
        return {
            data: {
                success: true,
                data: user,
                message: '获取用户详情成功',
            },
        }
    },

    // 创建用户
    createUser: async (userData: any) => {
        await delay(400)
        const newUser: User = {
            id: generateId('user'),
            ...userData,
            status: userData.status || UserStatus.ACTIVE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: null,
        }
        users.push(newUser)
        return {
            data: {
                success: true,
                data: newUser,
                message: '创建用户成功',
            },
        }
    },

    // 更新用户
    updateUser: async (id: string, userData: any) => {
        await delay(400)
        const index = users.findIndex(u => u.id === id)
        if (index === -1) {
            throw new Error('用户不存在')
        }
        users[index] = {
            ...users[index],
            ...userData,
            updatedAt: new Date().toISOString(),
        }
        return {
            data: {
                success: true,
                data: users[index],
                message: '更新用户成功',
            },
        }
    },

    // 删除用户
    deleteUser: async (id: string) => {
        await delay(300)
        const index = users.findIndex(u => u.id === id)
        if (index === -1) {
            throw new Error('用户不存在')
        }
        users.splice(index, 1)
        return {
            data: {
                success: true,
                message: '删除用户成功',
            },
        }
    },

    // 批量删除用户
    batchDeleteUsers: async (ids: string[]) => {
        await delay(500)
        users = users.filter(u => !ids.includes(u.id))
        return {
            data: {
                success: true,
                message: '批量删除用户成功',
            },
        }
    },

    // 更新用户角色
    updateUserRoles: async (userId: string, roleIds: string[]) => {
        await delay(400)
        const userIndex = users.findIndex(u => u.id === userId)
        if (userIndex === -1) {
            throw new Error('用户不存在')
        }

        // 更新用户的角色对象数组
        const user = users[userIndex]
        if (!user) {
            throw new Error('用户不存在')
        }
        user.roles = roles.filter(role => roleIds.includes(role.id))
        user.updatedAt = new Date().toISOString()

        return {
            data: {
                success: true,
                data: users[userIndex],
                message: '角色分配成功',
            },
        }
    },
}

// 角色管理模拟API
export const mockRoleApi = {
    // 获取角色列表
    getRoleList: async (params: any) => {
        await delay(300)
        const { page = 1, pageSize = 10, keyword = '', status } = params

        let filteredRoles = roles.filter(role => {
            const matchesKeyword =
                !keyword ||
                role.name.toLowerCase().includes(keyword.toLowerCase()) ||
                role.code.toLowerCase().includes(keyword.toLowerCase())

            const matchesStatus = !status || role.status === status

            return matchesKeyword && matchesStatus
        })

        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const records = filteredRoles.slice(startIndex, endIndex)

        return {
            data: {
                success: true,
                data: {
                    records,
                    total: filteredRoles.length,
                    page,
                    pageSize,
                },
                message: '获取角色列表成功',
            },
        }
    },

    // 获取角色详情
    getRoleById: async (id: string) => {
        await delay(200)
        const role = roles.find(r => r.id === id)
        if (!role) {
            throw new Error('角色不存在')
        }
        return {
            data: {
                success: true,
                data: role,
                message: '获取角色详情成功',
            },
        }
    },

    // 创建角色
    createRole: async (roleData: any) => {
        await delay(400)
        const newRole: Role = {
            id: generateId('role'),
            ...roleData,
            status: roleData.status || RoleStatus.ACTIVE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        roles.push(newRole)
        return {
            data: {
                success: true,
                data: newRole,
                message: '创建角色成功',
            },
        }
    },

    // 更新角色
    updateRole: async (id: string, roleData: any) => {
        await delay(400)
        const index = roles.findIndex(r => r.id === id)
        if (index === -1) {
            throw new Error('角色不存在')
        }
        roles[index] = {
            ...roles[index],
            ...roleData,
            updatedAt: new Date().toISOString(),
        }
        return {
            data: {
                success: true,
                data: roles[index],
                message: '更新角色成功',
            },
        }
    },

    // 删除角色
    deleteRole: async (id: string) => {
        await delay(300)
        const index = roles.findIndex(r => r.id === id)
        if (index === -1) {
            throw new Error('角色不存在')
        }
        roles.splice(index, 1)
        return {
            data: {
                success: true,
                message: '删除角色成功',
            },
        }
    },

    // 获取角色权限
    getRolePermissions: async (id: string) => {
        await delay(200)
        const role = roles.find(r => r.id === id)
        if (!role) {
            throw new Error('角色不存在')
        }
        return {
            data: {
                success: true,
                data: role.permissions || [],
                message: '获取角色权限成功',
            },
        }
    },

    // 更新角色权限
    updateRolePermissions: async (id: string, permissions: string[]) => {
        await delay(300)
        const index = roles.findIndex(r => r.id === id)
        if (index === -1) {
            throw new Error('角色不存在')
        }
        const role = roles[index]
        if (!role) {
            throw new Error('角色不存在')
        }
        roles[index] = {
            ...role,
            permissions: permissions,
            updatedAt: new Date().toISOString(),
        }
        return {
            data: {
                success: true,
                data: roles[index]!.permissions,
                message: '更新角色权限成功',
            },
        }
    },
}

// 获取所有角色（用于用户角色分配）
export const getAllRoles = () => [...roles]

// 获取所有用户（用于角色成员管理）
export const getAllUsers = () => [...users]

// 重置模拟数据
export const resetMockData = () => {
    users = [...mockUsers]
    roles = [...mockRoles]
}

// 统一的mockApi对象
export const mockApi = {
    user: mockUserApi,
    role: mockRoleApi,
}
