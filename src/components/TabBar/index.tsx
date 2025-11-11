import { CloseOutlined, HomeOutlined } from '@ant-design/icons'
import { Tabs, TabsProps } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './index.module.scss'

export interface TabItem {
    key: string
    label: string
    path: string
    icon?: React.ReactNode
    closable?: boolean
}

interface TabBarProps {
    className?: string
    maxTabs?: number
    onTabChange?: (activeKey: string) => void
    onTabClose?: (targetKey: string) => void
}

/**
 * 页卡栏组件
 * 支持多页签管理、关闭功能和路由同步
 */
const TabBar: React.FC<TabBarProps> = ({ className, maxTabs = 10, onTabChange, onTabClose }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const [activeKey, setActiveKey] = useState<string>('')
    const [tabs, setTabs] = useState<TabItem[]>([])

    // 路由标签映射 - 使用useMemo优化
    const routeTabMap = React.useMemo(
        (): Record<string, { label: string; icon?: React.ReactNode; closable: boolean }> => ({
            '/dashboard': {
                label: '仪表盘',
                icon: <HomeOutlined />,
                closable: false,
            },
            '/database-connection': {
                label: '数据源管理',
                closable: true,
            },
            '/data-governance': {
                label: '数据治理',
                closable: true,
            },
            '/data-quality-control/text': {
                label: '文本质控',
                closable: true,
            },
            '/data-quality-control/comprehensive': {
                label: '综合质控',
                closable: true,
            },
            '/data-quality-control/completeness': {
                label: '完整性质控',
                closable: true,
            },
            '/data-quality-control/basic-medical-logic': {
                label: '基础医疗逻辑质控',
                closable: true,
            },
            '/data-quality-control/core-data': {
                label: '核心数据质控',
                closable: true,
            },
            '/system-settings/users': {
                label: '用户设置',
                closable: true,
            },
            '/system-settings/roles': {
                label: '角色设置',
                closable: true,
            },
            '/system-settings/permissions': {
                label: '权限设置',
                closable: true,
            },
        }),
        []
    )

    /**
     * 添加新标签页
     */
    const addTab = useCallback(
        (path: string) => {
            const tabInfo = routeTabMap[path]
            if (!tabInfo) return

            const newTab: TabItem = {
                key: path,
                path,
                ...tabInfo,
            }

            setTabs(prevTabs => {
                const existingTab = prevTabs.find(tab => tab.key === path)
                if (existingTab) {
                    return prevTabs
                }

                const newTabs = [...prevTabs, newTab]

                // 限制最大标签数量
                if (newTabs.length > maxTabs) {
                    // 移除最旧的可关闭标签
                    const closableIndex = newTabs.findIndex(tab => tab.closable !== false)
                    if (closableIndex !== -1) {
                        newTabs.splice(closableIndex, 1)
                    }
                }

                return newTabs
            })
        },
        [maxTabs, routeTabMap]
    )

    /**
     * 移除标签页
     */
    const removeTab = useCallback(
        (targetKey: string) => {
            setTabs(prevTabs => {
                const newTabs = prevTabs.filter(tab => tab.key !== targetKey)

                // 如果关闭的是当前激活的标签，需要切换到其他标签
                if (targetKey === activeKey) {
                    const targetIndex = prevTabs.findIndex(tab => tab.key === targetKey)
                    let nextActiveKey = ''

                    if (newTabs.length > 0) {
                        // 优先选择右侧标签，如果没有则选择左侧
                        if (targetIndex < newTabs.length) {
                            nextActiveKey = newTabs[targetIndex]?.key || ''
                        } else {
                            nextActiveKey = newTabs[newTabs.length - 1]?.key || ''
                        }

                        if (nextActiveKey) {
                            navigate(nextActiveKey)
                        }
                    }
                }

                return newTabs
            })

            onTabClose?.(targetKey)
        },
        [activeKey, navigate, onTabClose]
    )

    /**
     * 标签页切换
     */
    const handleTabChange = useCallback(
        (key: string) => {
            setActiveKey(key)
            navigate(key)
            onTabChange?.(key)
        },
        [navigate, onTabChange]
    )

    /**
     * 标签页编辑（关闭）
     */
    const handleTabEdit: TabsProps['onEdit'] = (targetKey, action) => {
        if (action === 'remove') {
            removeTab(targetKey as string)
        }
    }

    // 监听路由变化，自动添加标签页
    useEffect(() => {
        const currentPath = location.pathname
        setActiveKey(currentPath)
        addTab(currentPath)
    }, [location.pathname, addTab])

    // 初始化默认标签页
    useEffect(() => {
        if (tabs.length === 0) {
            addTab('/dashboard')
        }
    }, [tabs.length, addTab])

    const tabItems = tabs.map(tab => ({
        key: tab.key,
        label: (
            <span className={styles.tabLabel}>
                {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
                {tab.label}
            </span>
        ),
        closable: tab.closable !== false,
        closeIcon: <CloseOutlined className={styles.closeIcon} />,
    }))

    return (
        <div className={`${styles.tabBarWrapper} ${className || ''}`}>
            <Tabs
                type='editable-card'
                activeKey={activeKey}
                items={tabItems}
                onChange={handleTabChange}
                onEdit={handleTabEdit}
                className={styles.tabBar}
                size='small'
                hideAdd
            />
        </div>
    )
}

export default TabBar
