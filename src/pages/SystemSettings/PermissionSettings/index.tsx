import React, { useEffect, useMemo, useState } from 'react'
import {
    Card,
    Tree,
    Select,
    Space,
    Button,
    Spin,
    Input,
    Tag,
    Badge,
    Typography,
    Progress,
} from 'antd'
import type { DataNode } from 'antd/es/tree'
import styles from './index.module.scss'
import { SafetyOutlined } from '@ant-design/icons'
import { uiMessage } from '@/utils/uiMessage'
import { roleApi, permissionApi } from '@/api/rbac'
import { Role, RolePageRequest, RolePageRecord, PermissionTreeNode } from '@/types/rbac'

/**
 * 将权限树节点转换为 Ant Design Tree 组件需要的格式
 */
const convertPermissionTreeToDataNode = (nodes: PermissionTreeNode[]): DataNode[] => {
    return nodes.map(node => {
        const children = node.children && node.children.length > 0
            ? convertPermissionTreeToDataNode(node.children)
            : undefined

        return {
            title: node.title,
            key: node.key,
            children,
        }
    })
}

/**
 * 收集所有叶子节点的 key（用于全选、反选等功能）
 */
const collectLeafKeys = (nodes: DataNode[]): string[] => {
    const result: string[] = []
    const walk = (arr: DataNode[]) => {
        arr.forEach(n => {
            const children = n.children
            if (children && children.length) {
                walk(children)
            } else {
                // 叶子节点，收集其 key
                if (typeof n.key === 'string') {
                    result.push(n.key)
                }
            }
        })
    }
    walk(nodes)
    return result
}

/**
 * 根据权限ID列表，从权限树中查找对应的 key 列表
 */
const convertIdsToKeys = (ids: (string | number)[], nodes: PermissionTreeNode[]): string[] => {
    const idToKeyMap = new Map<string, string>()
    
    // 递归遍历权限树，建立 id 到 key 的映射
    const buildIdKeyMap = (nodeList: PermissionTreeNode[]) => {
        nodeList.forEach(node => {
            // 将 id 转换为字符串作为 key，支持数字和字符串类型的 ID
            idToKeyMap.set(String(node.id), node.key)
            if (node.children && node.children.length > 0) {
                buildIdKeyMap(node.children)
            }
        })
    }
    
    buildIdKeyMap(nodes)
    
    // 将 ids 转换为 keys（统一转换为字符串进行比较）
    return ids
        .map(id => idToKeyMap.get(String(id)))
        .filter((key): key is string => key !== undefined)
}

/**
 * 根据权限key列表，从权限树中查找对应的 id 列表
 */
const convertKeysToIds = (keys: string[], nodes: PermissionTreeNode[]): string[] => {
    const keyToIdMap = new Map<string, string>()
    
    // 递归遍历权限树，建立 key 到 id 的映射
    const buildKeyIdMap = (nodeList: PermissionTreeNode[]) => {
        nodeList.forEach(node => {
            // 将 id 转换为字符串存储，支持数字和字符串类型的 ID
            keyToIdMap.set(node.key, String(node.id))
            if (node.children && node.children.length > 0) {
                buildKeyIdMap(node.children)
            }
        })
    }
    
    buildKeyIdMap(nodes)
    
    // 将 keys 转换为 ids
    return keys
        .map(key => keyToIdMap.get(key))
        .filter((id): id is string => id !== undefined)
}

const PermissionSettings: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([])
    const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<string>('')
    const [checkedKeys, setCheckedKeys] = useState<string[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [saving, setSaving] = useState<boolean>(false)
    const [search, setSearch] = useState<string>('')
    const [permissionTreeNodes, setPermissionTreeNodes] = useState<PermissionTreeNode[]>([])
    const [treeLoading, setTreeLoading] = useState<boolean>(false)

    // 将权限树节点转换为 Tree 组件需要的格式
    const treeData = useMemo(() => {
        if (permissionTreeNodes.length === 0) {
            return []
        }
        return convertPermissionTreeToDataNode(permissionTreeNodes)
    }, [permissionTreeNodes])

    // 收集所有叶子节点的 key
    const allLeafKeys = useMemo(() => collectLeafKeys(treeData), [treeData])

    // 根据权限树节点生成分组统计
    const groupDefs = useMemo(() => {
        if (permissionTreeNodes.length === 0) {
            return []
        }
        return permissionTreeNodes.map(node => ({
            key: node.title,
            nodeId: node.id,
        }))
    }, [permissionTreeNodes])

    // 统计每个分组的权限使用情况
    const groupedAll = useMemo(() => {
        const g: Record<string, string[]> = {}
        
        // 递归收集每个分组下的所有叶子节点 key
        const collectGroupKeys = (nodes: PermissionTreeNode[], groupTitle: string) => {
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    // 有子节点，继续递归
                    collectGroupKeys(node.children, groupTitle)
                } else {
                    // 叶子节点，添加到对应分组
                    if (!g[groupTitle]) {
                        g[groupTitle] = []
                    }
                    g[groupTitle].push(node.key)
                }
            })
        }

        permissionTreeNodes.forEach(node => {
            collectGroupKeys([node], node.title)
        })

        return g
    }, [permissionTreeNodes])

    const metrics = useMemo(() => {
        return Object.keys(groupedAll).map(name => {
            const keys = groupedAll[name]
            if (!keys) {
                return { name, total: 0, used: 0, percent: 0 }
            }
            const total = keys.length
            const used = keys.filter(k => checkedKeys.includes(k)).length
            const percent = total ? Math.round((used / total) * 100) : 0
            return { name, total, used, percent }
        })
    }, [groupedAll, checkedKeys])

    /**
     * 加载权限树
     */
    useEffect(() => {
        const loadPermissionTree = async () => {
            try {
                setTreeLoading(true)
                const response = await permissionApi.getPermissionTree()
                
                // 处理响应数据
                // response 格式: {code: 200, msg: "操作成功", data: {nodes: [...], checkedIds: []}}
                let treeNodes: PermissionTreeNode[] = []
                if (response) {
                    // 情况1: response.data 直接包含 nodes
                    if (response.data && Array.isArray((response.data as any).nodes)) {
                        treeNodes = (response.data as any).nodes
                    }
                    // 情况2: response.data.data 包含 nodes（嵌套结构）
                    else if (response.data && (response.data as any).data && Array.isArray((response.data as any).data.nodes)) {
                        treeNodes = (response.data as any).data.nodes
                    }
                    // 情况3: response 直接是数据对象
                    else if (Array.isArray((response as any).nodes)) {
                        treeNodes = (response as any).nodes
                    }
                }
                
                setPermissionTreeNodes(treeNodes)
            } catch (err: any) {
                uiMessage.handleSystemError(err?.message || '加载权限树失败')
                console.error('Load permission tree error:', err)
            } finally {
                setTreeLoading(false)
            }
        }
        loadPermissionTree()
    }, [])

    /**
     * 加载角色列表
     */
    useEffect(() => {
        const loadRoles = async () => {
            try {
                setLoading(true)
                
                // 构建请求参数，获取所有角色
                const requestParams: RolePageRequest = {
                    pageNum: 1,
                    pageSize: 1000, // 获取所有角色
                }
                
                // 优先使用新接口
                let response: any
                try {
                    response = await roleApi.getRolePage(requestParams)
                } catch (apiError) {
                    // API调用失败，不显示错误，因为可能是权限问题
                    console.warn('API调用失败:', apiError)
                    return
                }
                
                // 处理响应数据
                let responseData: any = null
                
                if (response && typeof response === 'object') {
                    // 情况1: response 是 {code, msg, data}，且 data 包含 records
                    if (response.data && typeof response.data === 'object' && 'records' in response.data) {
                        responseData = response.data
                    }
                    // 情况2: response 直接是分页数据格式（mock返回的格式）
                    else if ('records' in response) {
                        responseData = response
                    }
                    // 情况3: response.data.data 包含分页数据（嵌套结构）
                    else if (response.data?.data && 'records' in response.data.data) {
                        responseData = response.data.data
                    }
                }
                
                let roleList: Role[] = []
                
                if (responseData && responseData.records && responseData.records.length > 0) {
                    // 将 RolePageRecord 转换为 Role 格式
                    roleList = responseData.records.map((record: RolePageRecord) => ({
                        id: record.id,
                        name: record.roleName,
                        code: record.roleKey,
                        sortOrder: record.roleSort,
                        status: record.status === '0' ? 'active' : 'disabled',
                        userCount: parseInt(record.userCount) || 0,
                        description: record.remark || undefined,
                        createdAt: record.createTime || new Date().toISOString(),
                        updatedAt: record.updateTime || record.createTime || new Date().toISOString(),
                        permissions: [],
                    }))
                }
                
                setRoles(roleList)
                setRoleOptions(roleList.map((r: Role) => ({ label: r.name, value: r.id })))
            } catch (err: any) {
                uiMessage.handleSystemError(err?.message || '加载角色列表失败')
                console.error('Load roles error:', err)
            } finally {
                setLoading(false)
            }
        }
        loadRoles()
    }, [])

    const handleRoleChange = async (roleId: string) => {
        setSelectedRoleId(roleId)
        if (!roleId) {
            setCheckedKeys([])
            return
        }
        try {
            setLoading(true)
            // 调用获取角色权限树的接口
            const response = await roleApi.getRolePermissionTree(roleId)
            
            // 处理响应数据
            // response 格式: {code: 200, msg: "操作成功", data: {nodes: [...], checkedIds: []}}
            let checkedIds: (string | number)[] = []
            if (response) {
                // 情况1: response.data 直接包含 checkedIds
                if (response.data && Array.isArray((response.data as any).checkedIds)) {
                    checkedIds = (response.data as any).checkedIds
                }
                // 情况2: response.data.data 包含 checkedIds（嵌套结构）
                else if (response.data && (response.data as any).data && Array.isArray((response.data as any).data.checkedIds)) {
                    checkedIds = (response.data as any).data.checkedIds
                }
                // 情况3: response 直接是数据对象
                else if (Array.isArray((response as any).checkedIds)) {
                    checkedIds = (response as any).checkedIds
                }
            }
            
            // 将权限ID转换为对应的key
            // 如果权限树数据还未加载，等待一下再转换
            if (permissionTreeNodes.length > 0) {
                const checkedKeys = convertIdsToKeys(checkedIds, permissionTreeNodes)
                setCheckedKeys(checkedKeys)
            } else {
                // 权限树数据未加载，先清空选中状态
                setCheckedKeys([])
                console.warn('权限树数据未加载，无法转换权限ID为key')
            }
        } catch (err: any) {
            uiMessage.handleSystemError(err?.message || '加载角色权限失败')
            setCheckedKeys([])
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!selectedRoleId) {
            uiMessage.warning('请先选择角色')
            return
        }
        try {
            setSaving(true)
            
            // 将选中的 key 数组转换为权限 ID 数组
            let permissionIds: string[] = []
            if (permissionTreeNodes.length > 0) {
                permissionIds = convertKeysToIds(checkedKeys, permissionTreeNodes)
            } else {
                uiMessage.warning('权限树数据未加载，无法保存权限')
                setSaving(false)
                return
            }
            
            // 调用保存角色权限的接口
            // 响应拦截器已经处理了错误情况，如果接口调用成功（没有抛出异常），就说明保存成功
            await roleApi.authorizeRolePermissions(selectedRoleId, permissionIds)
            
            // 接口调用成功（没有抛出异常），显示成功提示
            uiMessage.success('权限已保存')
        } catch (err: any) {
            // 错误已经被全局错误处理器处理，但为了确保用户能看到提示，这里也显示一次
            console.error('保存权限失败:', err)
            const errorMsg = err?.message || '保存权限失败，请稍后重试'
            // 使用 setTimeout 确保错误消息在下一个事件循环中显示，避免与全局错误处理器冲突
            setTimeout(() => {
                uiMessage.error(errorMsg)
            }, 100)
        } finally {
            setSaving(false)
        }
    }

    const handleSelectAll = () => {
        setCheckedKeys(allLeafKeys)
    }

    const handleClear = () => {
        setCheckedKeys([])
    }

    const handleInvert = () => {
        const inverted = allLeafKeys.filter(k => !checkedKeys.includes(k))
        setCheckedKeys(inverted)
    }

    const toggleRole = async (roleId: string) => {
        const next = selectedRoleId === roleId ? '' : roleId
        await handleRoleChange(next)
    }

    return (
        <div className={styles.container}>
            <Card className={styles.headerCard} bordered={false} bodyStyle={{ padding: 0 }}>
                <div className={styles.header}>
                    <Space direction='vertical' size={4}>
                        <div className={styles.title}>
                            <SafetyOutlined /> 权限管理
                        </div>
                        <div className={styles.subtitle}>
                            按左侧菜单进行授权，精确控制角色可访问的模块与页面
                        </div>
                    </Space>
                    <div className={styles.stats}>
                        <Badge count={checkedKeys.length} title='已勾选' color='#52c41a' />
                        <Badge count={allLeafKeys.length} title='可授权项' color='#1677ff' />
                    </div>
                </div>
            </Card>

            <div className={styles.layout}>
                <div className={styles.rightPanel}>
                    <Card bordered bodyStyle={{ paddingBottom: 0 }}>
                        <div className={styles.toolbar}>
                            <div className={styles.filters}>
                                <Input.Search
                                    placeholder='搜索权限项'
                                    allowClear
                                    onChange={e => setSearch(e.target.value.trim())}
                                    style={{ width: 280 }}
                                />
                                <Select
                                    className={styles.roleSelect}
                                    placeholder='选择角色'
                                    options={roleOptions}
                                    value={selectedRoleId || undefined}
                                    onChange={handleRoleChange}
                                    allowClear
                                    showSearch
                                    style={{ minWidth: 240 }}
                                />
                                <div className={styles.actions}>
                                    <Button onClick={handleSelectAll}>全选</Button>
                                    <Button onClick={handleInvert}>反选</Button>
                                    <Button onClick={handleClear}>清空</Button>
                                </div>
                            </div>
                            <Space>
                                <Button type='primary' onClick={handleSave} loading={saving}>
                                    保存权限
                                </Button>
                            </Space>
                        </div>
                        <div className={styles.roleTags}>
                            {roles.length ? (
                                roles.map(r => (
                                    <Tag
                                        key={r.id}
                                        color={selectedRoleId === r.id ? 'geekblue' : 'default'}
                                        onClick={() => toggleRole(r.id)}
                                        style={{
                                            cursor: 'pointer',
                                            fontWeight: selectedRoleId === r.id ? 600 : 400,
                                        }}
                                    >
                                        {r.name}（{r.code}）
                                    </Tag>
                                ))
                            ) : (
                                <Typography.Text type='secondary'>暂无角色</Typography.Text>
                            )}
                        </div>
                    </Card>

                    <div className={styles.metricsGrid}>
                        {metrics.map(m => (
                            <div key={m.name} className={styles.metricCard}>
                                <Progress type='circle' percent={m.percent} size={64} />
                                <div>
                                    <div className={styles.metricTitle}>{m.name}</div>
                                    <div className={styles.metricValue}>
                                        授权 {m.used} / {m.total}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card
                        className={styles.treeCard}
                        bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        <Spin spinning={treeLoading || loading}>
                            <div className={styles.treeWrap}>
                                {treeData.length > 0 ? (
                                    <Tree
                                        checkable
                                        selectable={false}
                                        treeData={treeData}
                                        checkedKeys={checkedKeys}
                                        onCheck={keys => setCheckedKeys(keys as string[])}
                                        defaultExpandAll
                                        showLine
                                        titleRender={node => {
                                            // 判断是否为叶子节点
                                            const isLeaf = !node.children || node.children.length === 0
                                            return (
                                                <Space size={6}>
                                                    <span>{String(node.title)}</span>
                                                    {isLeaf ? (
                                                        <Tag color='processing'>页面</Tag>
                                                    ) : (
                                                        <Tag color='default'>模块</Tag>
                                                    )}
                                                </Space>
                                            )
                                        }}
                                        filterTreeNode={node => {
                                            if (!search) return true
                                            const title = String(node.title || '')
                                            const key = String(node.key || '')
                                            return (
                                                title.toLowerCase().includes(search.toLowerCase()) ||
                                                key.toLowerCase().includes(search.toLowerCase())
                                            )
                                        }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                        {treeLoading ? '加载中...' : '暂无权限数据'}
                                    </div>
                                )}
                            </div>
                        </Spin>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default PermissionSettings
