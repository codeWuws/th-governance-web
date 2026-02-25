import type { MenuProps } from 'antd'
import type { PermissionMenu } from '@/types/rbac'
import { getMenuIcon } from './iconMap'

/** 路由 basename，与 router 配置一致 */
export const ROUTER_BASENAME = '/dataflow'

/** 仅展示目录(M)和菜单/页面(C)，不展示按钮(F) */
function filterMenuNodes(nodes: PermissionMenu[]): PermissionMenu[] {
    return nodes
        .filter(n => n.permissionType === 'M' || n.permissionType === 'C')
        .sort((a, b) => a.orderNum - b.orderNum)
}

/**
 * 将接口返回的权限菜单树转为 Ant Design Menu 的 items
 * 菜单项 key：C 使用完整路径（basename + path）便于选中与跳转；M 使用 key 用于展开
 */
export function permissionMenusToItems(
    menus: PermissionMenu[],
    basename: string = ROUTER_BASENAME
): MenuProps['items'] {
    function build(nodes: PermissionMenu[]): MenuProps['items'] {
        if (!nodes?.length) return undefined
        const filtered = filterMenuNodes(nodes)
        return filtered.map(node => {
            const icon = getMenuIcon(node.icon)
            const childrenFiltered = filterMenuNodes(node.children || [])

            if (node.permissionType === 'M') {
                return {
                    key: node.key,
                    icon: icon ?? undefined,
                    label: node.title,
                    children: childrenFiltered.length ? build(childrenFiltered) : undefined,
                }
            }

            // C: 页面/菜单，使用完整路径作为 key
            const path = node.path?.trim()
            const itemKey = path ? `${basename}${path.startsWith('/') ? path : `/${path}`}` : node.key
            return {
                key: itemKey,
                icon: icon ?? undefined,
                label: node.title,
            }
        })
    }

    return build(menus) ?? []
}

/**
 * 根据当前 pathname 从菜单树中解析出应选中的菜单项 key（与 permissionMenusToItems 中使用的 key 一致）
 * 用于左侧菜单选中态，完全由 key 控制
 */
export function getSelectedKeyFromMenus(
    menus: PermissionMenu[],
    pathname: string,
    basename: string = ROUTER_BASENAME
): string | null {
    const normalizedPath = pathname.startsWith(basename) ? pathname : `${basename}${pathname.startsWith('/') ? pathname : `/${pathname}`}`

    let matchedKey: string | null = null
    let longestMatchLen = 0

    function walk(nodes: PermissionMenu[]) {
        for (const node of nodes) {
            if (node.permissionType === 'F') continue
            if (node.permissionType === 'M') {
                const childrenFiltered = (node.children || []).filter(
                    c => c.permissionType === 'M' || c.permissionType === 'C'
                )
                walk(childrenFiltered)
            } else {
                const path = node.path?.trim()
                const itemKey = path ? `${basename}${path.startsWith('/') ? path : `/${path}`}` : node.key
                if (!path) continue
                const fullPath = `${basename}${path.startsWith('/') ? path : `/${path}`}`
                if (normalizedPath === fullPath) {
                    matchedKey = itemKey
                    longestMatchLen = Infinity
                }
                if (
                    longestMatchLen !== Infinity &&
                    fullPath.length < normalizedPath.length &&
                    normalizedPath.startsWith(fullPath + '/') &&
                    fullPath.length > longestMatchLen
                ) {
                    longestMatchLen = fullPath.length
                    matchedKey = itemKey
                }
            }
        }
    }

    walk(menus)
    return matchedKey
}

/**
 * 根据当前 pathname 从菜单树中收集需要展开的父级 key（仅 M 类型）
 */
export function getOpenKeysFromMenus(menus: PermissionMenu[], pathname: string): string[] {
    const keys: string[] = []
    const basename = ROUTER_BASENAME
    const normalizedPath = pathname.startsWith(basename) ? pathname : `${basename}${pathname.startsWith('/') ? pathname : `/${pathname}`}`

    function walk(nodes: PermissionMenu[], parentKeys: string[]): boolean {
        for (const node of nodes) {
            if (node.permissionType === 'F') continue
            if (node.permissionType === 'M') {
                const nextParents = [...parentKeys, node.key]
                const childrenFiltered = (node.children || []).filter(
                    c => c.permissionType === 'M' || c.permissionType === 'C'
                )
                if (childrenFiltered.length && walk(childrenFiltered, nextParents)) {
                    return true
                }
            } else {
                const path = node.path?.trim()
                const fullPath = path ? `${basename}${path.startsWith('/') ? path : `/${path}`}` : ''
                if (fullPath && normalizedPath === fullPath) {
                    keys.push(...parentKeys)
                    return true
                }
            }
        }
        return false
    }

    walk(menus, [])
    return keys
}
