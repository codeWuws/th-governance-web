import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import { useCallback } from 'react'
import type { AppDispatch, RootState } from './index'
import {
    setUsers as setUsersAction,
    setUserRoleAssignments as setUserRoleAssignmentsAction,
    setUserRoles as setUserRolesAction,
    setRoles as setRolesAction,
    setUserLoading as setUserLoadingAction,
} from './slices/systemSettingsSlice'

// 类型安全的 useDispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>()

// 类型安全的 useSelector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// 系统设置相关的自定义 hooks
export const useSystemSettings = () => {
    const dispatch = useAppDispatch()
    const systemSettings = useAppSelector(state => state.systemSettings)

    // 用户管理相关的方法
    const setUsers = useCallback(
        (users: any[]) => {
            dispatch(setUsersAction(users))
        },
        [dispatch]
    )

    const setRoles = useCallback(
        (roles: any[]) => {
            dispatch(setRolesAction(roles))
        },
        [dispatch]
    )

    const setUserLoading = useCallback(
        (loading: boolean) => {
            dispatch(setUserLoadingAction(loading))
        },
        [dispatch]
    )

    const setUserRoleAssignments = useCallback(
        (assignments: Record<string, string[]>) => {
            dispatch(setUserRoleAssignmentsAction(assignments))
        },
        [dispatch]
    )

    const setUserRoles = useCallback(
        (userId: string, roleIds: string[]) => {
            dispatch(setUserRolesAction({ userId, roleIds }))
        },
        [dispatch]
    )

    const getUserRoles = useCallback(
        (userId: string): string[] => {
            return systemSettings.userRoleAssignments[userId] || []
        },
        [systemSettings.userRoleAssignments]
    )

    return {
        // 状态
        ...systemSettings,
        // 方法
        setUsers,
        setRoles,
        setUserLoading,
        setUserRoleAssignments,
        setUserRoles,
        getUserRoles,
    }
}

// 导出常用的 hooks
export { useDispatch, useSelector }
