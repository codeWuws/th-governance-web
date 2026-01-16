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

    // 获取用户详情（新接口格式）
    getUserByIdNew: async (params: { id: string | number }) => {
        await delay(200)
        const userId = String(params.id)
        const user = users.find(u => u.id === userId)
        if (!user) {
            throw new Error('用户不存在')
        }
        
        // 转换为新接口格式
        return {
            data: {
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    nickName: user.realName,
                    email: user.email,
                    phoneNumber: user.phone || '',
                    sex: '1', // 默认值，mock数据中没有性别字段
                    avatar: user.avatar || '',
                    password: '', // 不返回密码
                    status: user.status === UserStatus.ACTIVE ? '0' : '1',
                    deptId: null,
                    deptName: user.department || null,
                    postId: null,
                    postName: user.position || null,
                    roles: null,
                    roleVos: user.roles.map(role => {
                        // 日期格式化函数：将 ISO 日期转换为 "YYYY-MM-DD HH:mm:ss" 格式
                        const formatDateTime = (dateStr: string | null | undefined): string | null => {
                            if (!dateStr) return null
                            const date = new Date(dateStr)
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const day = String(date.getDate()).padStart(2, '0')
                            const hours = String(date.getHours()).padStart(2, '0')
                            const minutes = String(date.getMinutes()).padStart(2, '0')
                            const seconds = String(date.getSeconds()).padStart(2, '0')
                            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
                        }
                        
                        return {
                            id: role.id,
                            roleName: role.name,
                            roleKey: role.code,
                            roleSort: role.sortOrder,
                            status: role.status === RoleStatus.ACTIVE ? '0' : '1',
                            userCount: null,
                            createBy: 'system',
                            createTime: formatDateTime(role.createdAt),
                            updateBy: null,
                            updateTime: formatDateTime(role.updatedAt),
                            remark: role.description || null,
                        }
                    }),
                },
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

    // 删除用户（新接口格式）
    deleteUserById: async (id: string) => {
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

    // 新增用户（新接口格式）
    addUser: async (userData: any) => {
        await delay(400)
        
        // 字段转换：将新接口格式转换为内部格式
        const newUser: User = {
            id: userData.id || generateId('user'),
            username: userData.username,
            email: userData.email,
            phone: userData.phoneNumber,
            realName: userData.nickName || userData.username,
            avatar: userData.avatar,
            status: userData.status === '0' ? UserStatus.ACTIVE : UserStatus.DISABLED,
            roles: userData.roleIds 
                ? roles.filter(role => userData.roleIds.includes(Number(role.id)))
                : [],
            department: userData.deptName,
            position: userData.postName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: null,
        }
        
        users.push(newUser)
        return {
            data: {
                success: true,
                data: newUser,
                message: '新增用户成功',
            },
        }
    },

    // 编辑用户（新接口格式）
    editUser: async (userData: any) => {
        await delay(400)
        
        if (!userData.id) {
            throw new Error('用户ID不能为空')
        }
        
        const index = users.findIndex(u => u.id === userData.id)
        if (index === -1) {
            throw new Error('用户不存在')
        }
        
        // 字段转换：将新接口格式转换为内部格式
        const existingUser = users[index]!
        const updatedUser: User = {
            ...existingUser,
            username: userData.username || existingUser.username,
            email: userData.email || existingUser.email,
            phone: userData.phoneNumber || existingUser.phone,
            realName: userData.nickName || existingUser.realName,
            avatar: userData.avatar !== undefined ? userData.avatar : existingUser.avatar,
            status: userData.status !== undefined 
                ? (userData.status === '0' ? UserStatus.ACTIVE : UserStatus.DISABLED)
                : existingUser.status,
            roles: userData.roleIds 
                ? roles.filter(role => userData.roleIds.includes(Number(role.id)))
                : existingUser.roles,
            department: userData.deptName !== undefined ? userData.deptName : existingUser.department,
            position: userData.postName !== undefined ? userData.postName : existingUser.position,
            updatedAt: new Date().toISOString(),
        }
        
        users[index] = updatedUser
        return {
            data: {
                success: true,
                data: updatedUser,
                message: '编辑用户成功',
            },
        }
    },

    // 分页查询用户列表（新接口格式）
    getUserPage: async (params: any) => {
        await delay(300)
        const {
            pageNum = 1,
            pageSize = 10,
            username,
            nickName,
            email,
            phoneNumber,
            postId,
            status,
        } = params

        // 过滤用户
        let filteredUsers = users.filter(user => {
            // 用户名模糊匹配
            const matchesUsername =
                !username || user.username.toLowerCase().includes(username.toLowerCase())

            // 昵称模糊匹配
            const matchesNickName =
                !nickName || user.realName.toLowerCase().includes(nickName.toLowerCase())

            // 邮箱精确匹配
            const matchesEmail = !email || user.email === email

            // 手机号匹配
            const matchesPhone = !phoneNumber || user.phone === phoneNumber

            // 职位ID匹配
            const matchesPostId = !postId || user.position === String(postId)

            // 状态匹配（支持数组）
            const userStatus = user.status === UserStatus.ACTIVE ? '0' : '1'
            const matchesStatus =
                !status || !status.length || status.includes(userStatus)

            return (
                matchesUsername &&
                matchesNickName &&
                matchesEmail &&
                matchesPhone &&
                matchesPostId &&
                matchesStatus
            )
        })

        // 分页
        const startIndex = (pageNum - 1) * pageSize
        const endIndex = startIndex + pageSize
        const records = filteredUsers.slice(startIndex, endIndex)

        // 转换为新接口格式
        const formattedRecords = records.map(user => ({
            id: user.id,
            username: user.username,
            nickName: user.realName,
            email: user.email,
            phoneNumber: user.phone || '',
            sex: '1', // 默认值，mock数据中没有性别字段
            avatar: user.avatar || null,
            password: '', // 不返回密码
            status: user.status === UserStatus.ACTIVE ? '0' : '1',
            deptId: null,
            deptName: user.department || null,
            postId: null,
            postName: user.position || null,
            roles: user.roles.map(role => role.name),
            roleVos: null,
        }))

        return {
            data: {
                success: true,
                data: {
                    records: formattedRecords,
                    total: String(filteredUsers.length),
                    size: String(pageSize),
                    current: String(pageNum),
                    pages: String(Math.ceil(filteredUsers.length / pageSize)),
                },
                message: '获取用户列表成功',
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

    // 新增角色（新接口格式）
    addRole: async (roleData: any) => {
        await delay(400)
        
        // 字段转换：将新接口格式转换为内部格式
        const newRole: Role = {
            id: roleData.id || generateId('role'),
            name: roleData.roleName,
            code: roleData.roleKey,
            sortOrder: roleData.roleSort,
            status: roleData.status === '0' ? RoleStatus.ACTIVE : RoleStatus.DISABLED,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            permissions: [],
        }
        
        roles.push(newRole)
        return {
            data: {
                success: true,
                data: newRole,
                message: '新增角色成功',
            },
        }
    },

    // 编辑角色（新接口格式）
    editRole: async (roleData: any) => {
        await delay(400)
        
        if (!roleData.id) {
            throw new Error('角色ID不能为空')
        }
        
        const index = roles.findIndex(r => r.id === roleData.id)
        if (index === -1) {
            throw new Error('角色不存在')
        }
        
        // 字段转换：将新接口格式转换为内部格式
        const existingRole = roles[index]!
        const updatedRole: Role = {
            ...existingRole,
            name: roleData.roleName || existingRole.name,
            code: roleData.roleKey || existingRole.code,
            sortOrder: roleData.roleSort !== undefined ? roleData.roleSort : existingRole.sortOrder,
            status: roleData.status !== undefined 
                ? (roleData.status === '0' ? RoleStatus.ACTIVE : RoleStatus.DISABLED)
                : existingRole.status,
            updatedAt: new Date().toISOString(),
        }
        
        roles[index] = updatedRole
        return {
            data: {
                success: true,
                data: updatedRole,
                message: '编辑角色成功',
            },
        }
    },

    // 分页查询角色列表（新接口格式）
    getRolePage: async (params: any) => {
        await delay(300)
        const {
            pageNum = 1,
            pageSize = 10,
            roleKey,
            roleName,
            sortField,
            sortOrder,
            status,
        } = params

        // 过滤角色
        let filteredRoles = roles.filter(role => {
            // 角色编码模糊匹配
            const matchesRoleKey =
                !roleKey || role.code.toLowerCase().includes(roleKey.toLowerCase())

            // 角色名称模糊匹配
            const matchesRoleName =
                !roleName || role.name.toLowerCase().includes(roleName.toLowerCase())

            // 状态匹配（支持数组）
            const roleStatus = role.status === RoleStatus.ACTIVE ? '0' : '1'
            const matchesStatus =
                !status || !status.length || status.includes(roleStatus)

            return matchesRoleKey && matchesRoleName && matchesStatus
        })

        // 排序处理
        if (sortField) {
            filteredRoles.sort((a, b) => {
                let aValue: any
                let bValue: any

                switch (sortField) {
                    case 'roleName':
                        aValue = a.name
                        bValue = b.name
                        break
                    case 'roleKey':
                        aValue = a.code
                        bValue = b.code
                        break
                    case 'roleSort':
                        aValue = a.sortOrder
                        bValue = b.sortOrder
                        break
                    case 'status':
                        aValue = a.status === RoleStatus.ACTIVE ? '0' : '1'
                        bValue = b.status === RoleStatus.ACTIVE ? '0' : '1'
                        break
                    default:
                        aValue = a.sortOrder
                        bValue = b.sortOrder
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortOrder === 'desc'
                        ? bValue.localeCompare(aValue)
                        : aValue.localeCompare(bValue)
                } else {
                    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
                }
            })
        } else {
            // 默认按排序字段排序
            filteredRoles.sort((a, b) => a.sortOrder - b.sortOrder)
        }

        // 分页
        const startIndex = (pageNum - 1) * pageSize
        const endIndex = startIndex + pageSize
        const records = filteredRoles.slice(startIndex, endIndex)

        // 日期格式化函数：将 ISO 日期转换为 "YYYY-MM-DD HH:mm:ss" 格式
        const formatDateTime = (dateStr: string | null | undefined): string | null => {
            if (!dateStr) return null
            const date = new Date(dateStr)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            const seconds = String(date.getSeconds()).padStart(2, '0')
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        }

        // 转换为新接口格式
        const formattedRecords = records.map(role => ({
            id: role.id,
            roleName: role.name,
            roleKey: role.code,
            roleSort: role.sortOrder,
            status: role.status === RoleStatus.ACTIVE ? '0' : '1',
            userCount: String(role.userCount || 0),
            createBy: 'system',
            createTime: formatDateTime(role.createdAt) || formatDateTime(new Date().toISOString())!,
            updateBy: null,
            updateTime: formatDateTime(role.updatedAt),
            remark: role.description || null,
        }))

        return {
            data: {
                success: true,
                data: {
                    records: formattedRecords,
                    total: String(filteredRoles.length),
                    size: String(pageSize),
                    current: String(pageNum),
                    pages: String(Math.ceil(filteredRoles.length / pageSize)),
                },
                message: '获取角色列表成功',
            },
        }
    },

    // 删除角色（新接口格式）
    deleteRoleById: async (data: any) => {
        await delay(300)
        
        // 支持两种格式：{ id: 1 } 或直接传入 id 字符串
        const roleId = typeof data === 'object' && data.id ? String(data.id) : String(data)
        
        const index = roles.findIndex(r => r.id === roleId)
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
