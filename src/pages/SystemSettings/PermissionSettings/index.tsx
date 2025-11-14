import React, { useEffect, useMemo, useState } from 'react'
import {
    Card,
    Tree,
    Select,
    Space,
    Button,
    message,
    Spin,
    Input,
    Tag,
    Badge,
    Typography,
    Progress,
} from 'antd'
import type { DataNode } from 'antd/es/tree'
import styles from './index.module.scss'
import { menuItems } from '@/components/Layout/Sidebar'
import { mockApi } from '@/mock/rbac'
import { getAllRoles as mockGetAllRoles } from '@/mock/rbac'
import { SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons'

const toTreeData = (items: any[]): DataNode[] => {
    const mapNode = (node: any): DataNode => {
        const children = (node.children || []) as any[]
        return {
            title: node.label,
            key: node.key,
            children: children.length ? children.map(mapNode) : undefined,
        }
    }
    return items.map(mapNode)
}

const collectLeafKeys = (nodes: DataNode[]): string[] => {
    const result: string[] = []
    const walk = (arr: DataNode[]) => {
        arr.forEach(n => {
            const children = n.children
            if (children && children.length) {
                walk(children)
            } else {
                if (typeof n.key === 'string' && (n.key as string).startsWith('/')) {
                    result.push(n.key as string)
                }
            }
        })
    }
    walk(nodes)
    return result
}

const PermissionSettings: React.FC = () => {
    const [roles, setRoles] = useState<any[]>([])
    const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<string>('')
    const [checkedKeys, setCheckedKeys] = useState<string[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [saving, setSaving] = useState<boolean>(false)
    const [search, setSearch] = useState<string>('')

    const treeData = useMemo(() => toTreeData(menuItems as any), [])
    const allLeafKeys = useMemo(() => collectLeafKeys(treeData), [treeData])

    const groupDefs = useMemo(
        () => [
            {
                key: '数据治理',
                prefixes: ['/dashboard', '/database-connection', '/data-governance'],
            },
            { key: '数据质控', prefixes: ['/data-quality-control'] },
            { key: '数据管理', prefixes: ['/data-management'] },
            { key: '数据解析', prefixes: ['/data-parsing'] },
            { key: '数据检索', prefixes: ['/data-retrieval'] },
            { key: '系统设置', prefixes: ['/system-settings'] },
        ],
        []
    )
    const groupedAll = useMemo(() => {
        const g: Record<string, string[]> = {}
        groupDefs.forEach(def => {
            g[def.key] = []
        })
        allLeafKeys.forEach(k => {
            const hit = groupDefs.find(def => def.prefixes.some(p => String(k).startsWith(p)))
            if (hit) g[hit.key].push(k)
        })
        return g
    }, [allLeafKeys, groupDefs])
    const metrics = useMemo(() => {
        return Object.keys(groupedAll).map(name => {
            const total = groupedAll[name].length
            const used = groupedAll[name].filter(k => checkedKeys.includes(k)).length
            const percent = total ? Math.round((used / total) * 100) : 0
            return { name, total, used, percent }
        })
    }, [groupedAll, checkedKeys])

    useEffect(() => {
        const loadRoles = async () => {
            try {
                setLoading(true)
                const res = await mockApi.role.getRoleList({ page: 1, pageSize: 100 })
                let records = res?.data?.data?.records || []
                if (!records.length) {
                    records = mockGetAllRoles()
                }
                setRoles(records)
                setRoleOptions(records.map((r: any) => ({ label: r.name, value: r.id })))
            } catch (err: any) {
                message.error(err?.message || '加载角色列表失败')
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
            const res = await mockApi.role.getRolePermissions(roleId)
            const perms: string[] = res?.data?.data || []
            setCheckedKeys(perms)
        } catch (err: any) {
            message.error(err?.message || '加载角色权限失败')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!selectedRoleId) {
            message.warning('请先选择角色')
            return
        }
        try {
            setSaving(true)
            await mockApi.role.updateRolePermissions(selectedRoleId, checkedKeys)
            message.success('权限已保存')
        } catch (err: any) {
            message.error(err?.message || '保存权限失败')
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
                        <Spin spinning={loading}>
                            <div className={styles.treeWrap}>
                                <Tree
                                    checkable
                                    selectable={false}
                                    treeData={treeData}
                                    checkedKeys={checkedKeys}
                                    onCheck={keys => setCheckedKeys(keys as string[])}
                                    defaultExpandAll
                                    showLine
                                    titleRender={node => (
                                        <Space size={6}>
                                            <span>{String(node.title)}</span>
                                            {typeof node.key === 'string' &&
                                            String(node.key).startsWith('/') ? (
                                                <Tag color='processing'>页面</Tag>
                                            ) : (
                                                <Tag color='default'>模块</Tag>
                                            )}
                                        </Space>
                                    )}
                                    filterTreeNode={node => {
                                        if (!search) return false
                                        const title = String(node.title || '')
                                        const key = String(node.key || '')
                                        return (
                                            title.toLowerCase().includes(search.toLowerCase()) ||
                                            key.toLowerCase().includes(search.toLowerCase())
                                        )
                                    }}
                                />
                            </div>
                        </Spin>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default PermissionSettings
