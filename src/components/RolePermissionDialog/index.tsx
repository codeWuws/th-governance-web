/**
 * 角色权限分配弹窗
 * 展示权限树，支持对指定角色进行权限勾选并保存
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Tree, Spin, Empty } from 'antd'
import type { DataNode } from 'antd/es/tree'
import CustomDialog, { CustomDialogProps } from '@/components/CustomDialog'
import { roleApi } from '@/api/rbac'
import { uiMessage } from '@/utils/uiMessage'
import type { Role } from '@/types/rbac'
import type { PermissionTreeNode } from '@/types/rbac'
import styles from './index.module.scss'

/** 将权限树节点转换为 Ant Design Tree 的 DataNode 格式 */
function convertPermissionTreeToDataNode(nodes: PermissionTreeNode[]): DataNode[] {
    return nodes.map(node => {
        const children =
            node.children && node.children.length > 0
                ? convertPermissionTreeToDataNode(node.children)
                : undefined
        return {
            title: node.title,
            key: node.key,
            children,
        }
    })
}

/** 将权限 ID 列表转换为 Tree 的 key 列表（用于勾选） */
function convertIdsToKeys(
    ids: (string | number)[],
    nodes: PermissionTreeNode[]
): string[] {
    const idToKeyMap = new Map<string, string>()
    const buildMap = (list: PermissionTreeNode[]) => {
        list.forEach(node => {
            idToKeyMap.set(String(node.id), node.key)
            if (node.children?.length) buildMap(node.children)
        })
    }
    buildMap(nodes)
    return ids.map(id => idToKeyMap.get(String(id))).filter((k): k is string => k != null)
}

/** 将 Tree 的 key 列表转换为权限 ID 列表（用于提交） */
function convertKeysToIds(keys: string[], nodes: PermissionTreeNode[]): string[] {
    const keyToIdMap = new Map<string, string>()
    const buildMap = (list: PermissionTreeNode[]) => {
        list.forEach(node => {
            keyToIdMap.set(node.key, String(node.id))
            if (node.children?.length) buildMap(node.children)
        })
    }
    buildMap(nodes)
    return keys.map(k => keyToIdMap.get(k)).filter((id): id is string => id != null)
}

export interface RolePermissionDialogProps extends Omit<CustomDialogProps, 'children'> {
    /** 当前要分配权限的角色 */
    role: Role | null
    /** 保存成功后的回调（如刷新列表） */
    onSuccess?: () => void
    children?: React.ReactNode
}

const RolePermissionDialog: React.FC<RolePermissionDialogProps> = ({
    role,
    onSuccess,
    onOk,
    ...rest
}) => {
    const [treeNodes, setTreeNodes] = useState<PermissionTreeNode[]>([])
    const [checkedKeys, setCheckedKeys] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const treeData = useMemo(
        () => (treeNodes.length ? convertPermissionTreeToDataNode(treeNodes) : []),
        [treeNodes]
    )

    /** 加载该角色的权限树及已选权限 */
    useEffect(() => {
        if (!role?.id) {
            setTreeNodes([])
            setCheckedKeys([])
            return
        }
        let cancelled = false
        const load = async () => {
            setLoading(true)
            try {
                const response = await roleApi.getRolePermissionTree(role.id)
                let nodes: PermissionTreeNode[] = []
                let checkedIds: (string | number)[] = []
                const data = (response as any)?.data ?? response
                if (data && typeof data === 'object') {
                    if (Array.isArray(data.nodes)) nodes = data.nodes
                    else if (data.data && Array.isArray(data.data.nodes)) nodes = data.data.nodes
                    if (Array.isArray(data.checkedIds)) checkedIds = data.checkedIds
                    else if (data.data && Array.isArray(data.data.checkedIds)) checkedIds = data.data.checkedIds
                }
                if (cancelled) return
                setTreeNodes(nodes)
                setCheckedKeys(convertIdsToKeys(checkedIds, nodes))
            } catch (err: any) {
                if (!cancelled) {
                    uiMessage.handleSystemError(err?.message || '加载权限树失败')
                    setTreeNodes([])
                    setCheckedKeys([])
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [role?.id])

    const handleCheck = (keys: string[] | { checked: string[]; halfChecked: string[] }) => {
        const next = Array.isArray(keys) ? keys : (keys.checked ?? [])
        setCheckedKeys(next)
    }

    const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
        if (!role?.id) return
        if (onOk) await onOk(e)
        try {
            setSaving(true)
            const permissionIds = treeNodes.length
                ? convertKeysToIds(checkedKeys, treeNodes)
                : []
            await roleApi.authorizeRolePermissions(role.id, permissionIds)
            uiMessage.success('角色权限已保存')
            onSuccess?.()
        } catch (err: any) {
            uiMessage.error(err?.message || '保存失败')
            throw err
        } finally {
            setSaving(false)
        }
    }

    return (
        <CustomDialog
            width={720}
            okText="保存"
            cancelText="取消"
            onOk={handleOk}
            confirmLoading={saving}
            {...rest}
        >
            <div className={styles.wrap}>
                {role ? (
                    <>
                        <div className={styles.tip}>
                            角色：<strong>{role.name}</strong>（{role.code}）
                        </div>
                        {loading ? (
                            <div className={styles.loading}>
                                <Spin tip="加载权限树..." />
                            </div>
                        ) : treeData.length > 0 ? (
                            <div className={styles.treeWrap}>
                                <Tree
                                    checkable
                                    checkStrictly
                                    selectable={false}
                                    treeData={treeData}
                                    checkedKeys={checkedKeys}
                                    onCheck={handleCheck}
                                    blockNode
                                    className={styles.permissionTree}
                                />
                            </div>
                        ) : (
                            <Empty description="暂无权限数据" className={styles.empty} />
                        )}
                    </>
                ) : (
                    <Empty description="未选择角色" className={styles.empty} />
                )}
            </div>
        </CustomDialog>
    )
}

export default RolePermissionDialog
