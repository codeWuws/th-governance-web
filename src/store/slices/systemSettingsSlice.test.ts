/**
 * 系统设置Redux状态管理测试
 * 测试用户角色分配等Redux状态管理功能
 */

/// <reference types="vitest" />
import { configureStore } from '@reduxjs/toolkit'
import systemSettingsReducer, {
    setUserRoleAssignments,
    setUserRoles,
    clearUserRoles,
    setUsers,
    setRoles,
    deleteUser,
} from './systemSettingsSlice'
import { RBACUser, Role, UserStatus, RoleStatus } from '@/types/rbac'

describe('SystemSettingsSlice', () => {
    let store: any

    beforeEach(() => {
        store = configureStore({
            reducer: {
                systemSettings: systemSettingsReducer,
            },
        })
    })

    describe('用户角色分配状态管理', () => {
        const mockUsers: RBACUser[] = [
            {
                id: 'user1',
                username: 'zhangsan',
                realName: '张三',
                email: 'zhangsan@example.com',
                phone: '13800138000',
                status: UserStatus.ACTIVE,
                roles: [],
                department: '技术部',
                position: '工程师',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
                roles: [],
            },
            {
                id: 'user2',
                username: 'lisi',
                realName: '李四',
                email: 'lisi@example.com',
                phone: '13900139000',
                status: UserStatus.ACTIVE,
                roles: [],
                department: '产品部',
                position: '产品经理',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
                roles: [],
            },
        ]

        const mockRoles: Role[] = [
            {
                id: 'role1',
                name: '管理员',
                code: 'admin',
                description: '系统管理员',
                status: RoleStatus.ACTIVE,
                sortOrder: 1,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            },
            {
                id: 'role2',
                name: '编辑',
                code: 'editor',
                description: '内容编辑',
                status: RoleStatus.ACTIVE,
                sortOrder: 2,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            },
            {
                id: 'role3',
                name: '访客',
                code: 'guest',
                description: '访客用户',
                status: RoleStatus.ACTIVE,
                sortOrder: 3,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            },
        ]

        it('应该设置用户角色分配数据', () => {
            const roleAssignments = {
                user1: ['role1', 'role2'],
                user2: ['role2'],
            }

            store.dispatch(setUserRoleAssignments(roleAssignments))

            const state = store.getState().systemSettings
            expect(state.userRoleAssignments).toEqual(roleAssignments)
        })

        it('应该为特定用户设置角色', () => {
            // 先设置一些初始数据
            store.dispatch(setUsers(mockUsers))
            store.dispatch(setRoles(mockRoles))

            // 为用户1设置角色
            store.dispatch(setUserRoles({ userId: 'user1', roleIds: ['role1', 'role3'] }))

            const state = store.getState().systemSettings
            expect(state.userRoleAssignments.user1).toEqual(['role1', 'role3'])
        })

        it('应该清除用户的角色分配', () => {
            // 先设置一些角色分配数据
            const roleAssignments = {
                user1: ['role1', 'role2'],
                user2: ['role2'],
            }
            store.dispatch(setUserRoleAssignments(roleAssignments))

            // 清除用户1的角色分配
            store.dispatch(clearUserRoles('user1'))

            const state = store.getState().systemSettings
            expect(state.userRoleAssignments.user1).toBeUndefined()
            expect(state.userRoleAssignments.user2).toEqual(['role2'])
        })

        it('应该在删除用户时清除其角色分配', () => {
            // 先设置用户和角色分配数据
            store.dispatch(setUsers(mockUsers))
            const roleAssignments = {
                user1: ['role1', 'role2'],
                user2: ['role2'],
            }
            store.dispatch(setUserRoleAssignments(roleAssignments))

            // 直接测试reducer逻辑
            const initialState = {
                users: mockUsers,
                selectedUserIds: [],
                userLoading: false,
                userSearchText: '',
                userRoleAssignments: roleAssignments,
                roles: [],
                selectedRoleIds: [],
                roleLoading: false,
                roleSearchText: '',
                activeTab: 'users' as const,
                modalVisible: false,
                drawerVisible: false,
                currentRecord: null,
                modalType: null as any,
            }

            // 使用deleteUser action creator
            const newState = systemSettingsReducer(initialState, deleteUser('user1'))

            expect(newState.userRoleAssignments.user1).toBeUndefined()
            expect(newState.userRoleAssignments.user2).toEqual(['role2'])
        })
    })

    describe('用户和角色状态管理', () => {
        it('应该设置用户列表', () => {
            const mockUsers: RBACUser[] = [
                {
                    id: 'user1',
                    username: 'testuser',
                    realName: '测试用户',
                    email: 'test@example.com',
                    phone: '13800138000',
                    status: UserStatus.ACTIVE,
                    roles: [],
                    department: '测试部门',
                    position: '测试职位',
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                    roles: [],
                },
            ]

            store.dispatch(setUsers(mockUsers))

            const state = store.getState().systemSettings
            expect(state.users).toEqual(mockUsers)
        })

        it('应该设置角色列表', () => {
            const mockRoles: Role[] = [
                {
                    id: 'role1',
                    name: '测试角色',
                    code: 'test_role',
                    description: '测试描述',
                    status: RoleStatus.ACTIVE,
                    sortOrder: 1,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                },
            ]

            store.dispatch(setRoles(mockRoles))

            const state = store.getState().systemSettings
            expect(state.roles).toEqual(mockRoles)
        })
    })
})
