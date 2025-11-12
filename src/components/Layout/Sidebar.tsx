import {
    BarChartOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    HeartOutlined,
    LinkOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SafetyCertificateOutlined,
    SafetyOutlined,
    SettingOutlined,
    TeamOutlined,
    UserOutlined,
    MergeCellsOutlined,
    KeyOutlined,
    ToolOutlined,
    StarOutlined,
    ApiOutlined,
    TagOutlined,
    SearchOutlined,
    LineChartOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { Button, Layout, Menu, MenuProps } from 'antd'
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const { Sider } = Layout

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
}

type MenuItem = Required<MenuProps>['items'][number]

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
    const navigate = useNavigate()
    const location = useLocation()

    // 菜单项配置
    const menuItems: MenuItem[] = [
        {
            key: 'data-governance',
            icon: <DatabaseOutlined />,
            label: '数据治理',
            children: [
                {
                    key: '/dashboard',
                    icon: <DashboardOutlined />,
                    label: '仪表盘',
                },
                {
                    key: '/database-connection',
                    icon: <DatabaseOutlined />,
                    label: '数据源管理',
                },
                {
                    key: '/data-governance/workflow-config',
                    icon: <SettingOutlined />,
                    label: '工作流步骤',
                },
                {
                    key: '/data-governance/execution-history',
                    icon: <ClockCircleOutlined />,
                    label: '执行历史',
                },
            ],
        },
        {
            key: 'data-quality-control',
            icon: <SafetyCertificateOutlined />,
            label: '数据质控',
            children: [
                {
                    key: '/data-quality-control/text',
                    icon: <FileTextOutlined />,
                    label: '文本质控',
                },
                {
                    key: '/data-quality-control/comprehensive',
                    icon: <BarChartOutlined />,
                    label: '综合质控',
                },
                {
                    key: '/data-quality-control/completeness',
                    icon: <CheckCircleOutlined />,
                    label: '完整性质控',
                },
                {
                    key: '/data-quality-control/basic-medical-logic',
                    icon: <LinkOutlined />,
                    label: '基础医疗逻辑质控',
                },
                {
                    key: '/data-quality-control/core-data',
                    icon: <HeartOutlined />,
                    label: '核心数据质控',
                },
            ],
        },
        {
            key: 'data-management',
            icon: <DatabaseOutlined />,
            label: '数据管理',
            children: [
                {
                    key: '/data-management/metadata',
                    icon: <FileTextOutlined />,
                    label: '元数据管理',
                },
                {
                    key: 'data-standards',
                    icon: <CheckCircleOutlined />,
                    label: '标准数据集管理',
                    children: [
                        {
                            key: '/data-management/standards',
                            icon: <CheckCircleOutlined />,
                            label: '数据标准管理',
                        },
                        {
                            key: '/data-management/business-datasets',
                            icon: <FileTextOutlined />,
                            label: '业务数据集管理',
                        },
                        {
                            key: '/data-management/medical-dictionaries',
                            icon: <HeartOutlined />,
                            label: '医疗字典数据集',
                        },
                        {
                            key: '/data-management/state-dictionaries',
                            icon: <TagOutlined />,
                            label: '状态字典管理',
                        },
                    ],
                },
                {
                    key: 'table-relationships',
                    icon: <LinkOutlined />,
                    label: '关联关系管理',
                    children: [
                        {
                            key: '/data-management/relationships',
                            icon: <LinkOutlined />,
                            label: '表关联关系管理',
                        },
                        {
                            key: '/data-management/auto-discovery',
                            icon: <SearchOutlined />,
                            label: '自动关联发现',
                        },
                        {
                            key: '/data-management/visualization',
                            icon: <EyeOutlined />,
                            label: '可视化血缘图',
                        },
                        {
                            key: '/data-management/impact-analysis',
                            icon: <LineChartOutlined />,
                            label: '影响分析',
                        },
                    ],
                },
                {
                    key: 'master-index',
                    icon: <KeyOutlined />,
                    label: '主索引管理',
                    children: [
                        {
                            key: '/data-management/index-rules',
                            icon: <KeyOutlined />,
                            label: '主索引生成规则',
                        },
                        {
                            key: '/data-management/merge-rules',
                            icon: <MergeCellsOutlined />,
                            label: '主索引合并规则',
                        },
                        {
                            key: '/data-management/index-processing',
                            icon: <ToolOutlined />,
                            label: '主索引处理管理',
                        },
                    ],
                },
                {
                    key: 'data-quality',
                    icon: <SafetyCertificateOutlined />,
                    label: '数据质量管理',
                    children: [
                        {
                            key: '/data-management/quality-control',
                            icon: <SafetyCertificateOutlined />,
                            label: '数据质控',
                        },
                        {
                            key: '/data-management/quality-assessment',
                            icon: <StarOutlined />,
                            label: '数据质量评估',
                        },
                    ],
                },
            ],
        },
        {
            key: 'data-parsing',
            icon: <ApiOutlined />,
            label: '数据解析',
            children: [
                {
                    key: '/data-parsing',
                    icon: <ApiOutlined />,
                    label: '数据解析首页',
                },
                {
                    key: '/data-parsing/annotation',
                    icon: <TagOutlined />,
                    label: '数据标注',
                },
                {
                    key: '/data-parsing/medical-record',
                    icon: <FileTextOutlined />,
                    label: '电子病历解析',
                },
            ],
        },
        // 数据检索模块
        {
            key: 'data-retrieval',
            icon: <SearchOutlined />,
            label: '数据检索',
            children: [
                {
                    key: '/data-retrieval/fulltext',
                    icon: <SearchOutlined />,
                    label: '全文检索',
                },
                {
                    key: '/data-retrieval/advanced',
                    icon: <FileTextOutlined />,
                    label: '高级检索',
                },
                {
                    key: '/data-retrieval/condition-tree',
                    icon: <LinkOutlined />,
                    label: '条件树检索',
                },
                {
                    key: '/data-retrieval/analysis',
                    icon: <LineChartOutlined />,
                    label: '检索分析',
                },
                {
                    key: '/data-retrieval/visualization',
                    icon: <EyeOutlined />,
                    label: '可视化查看',
                },
            ],
        },
        {
            key: 'system-settings',
            icon: <SettingOutlined />,
            label: '系统设置',
            children: [
                {
                    key: '/system-settings/users',
                    icon: <UserOutlined />,
                    label: '用户设置',
                },
                {
                    key: '/system-settings/roles',
                    icon: <TeamOutlined />,
                    label: '角色设置',
                },
                {
                    key: '/system-settings/permissions',
                    icon: <SafetyOutlined />,
                    label: '权限设置',
                },
            ],
        },
        // {
        //     key: '/style-demo',
        //     icon: <BgColorsOutlined />,
        //     label: '样式演示',
        // },
    ]

    // 获取当前选中的菜单项
    const getSelectedKeys = () => {
        return [location.pathname]
    }

    // 获取当前展开的菜单项
    const getOpenKeys = () => {
        const pathSegments = location.pathname.split('/').filter(Boolean)
        if (pathSegments.length > 0) {
            // 如果是数据质控相关路径，展开数据质控菜单
            if (location.pathname.startsWith('/data-quality-control')) {
                return ['data-quality-control']
            }
            // 如果是数据治理相关路径，展开数据治理菜单
            if (
                location.pathname.startsWith('/dashboard') ||
                location.pathname.startsWith('/database-connection') ||
                location.pathname.startsWith('/data-governance')
            ) {
                return ['data-governance']
            }
            // 如果是系统设置相关路径，展开系统设置菜单
            if (location.pathname.startsWith('/system-settings')) {
                return ['system-settings']
            }
            // 如果是数据管理相关路径，展开数据管理菜单
            if (location.pathname.startsWith('/data-management')) {
                return ['data-management']
            }
            // 如果是数据解析相关路径，展开数据解析菜单
            if (location.pathname.startsWith('/data-parsing')) {
                return ['data-parsing']
            }
        }
        return []
    }

    const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys())

    // 处理菜单点击事件
    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        navigate(key)
    }

    // 处理子菜单展开/收起
    const handleOpenChange = (keys: string[]) => {
        setOpenKeys(keys)
    }

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={256}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                background: '#fff',
                borderRight: '1px solid #f0f0f0',
            }}
        >
            <div
                style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: collapsed ? 14 : 18,
                    fontWeight: 'bold',
                    color: '#1890ff',
                    padding: collapsed ? '0' : '0 16px',
                    position: 'relative',
                }}
            >
                <span>{collapsed ? '治理' : '数据治理平台'}</span>
                {!collapsed && (
                    <Button
                        type='text'
                        icon={<MenuFoldOutlined />}
                        onClick={onToggle}
                        style={{
                            fontSize: '16px',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#1890ff',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#e6f7ff'
                            e.currentTarget.style.transform = 'scale(1.1)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.transform = 'scale(1)'
                        }}
                    />
                )}
                {collapsed && (
                    <Button
                        type='text'
                        icon={<MenuUnfoldOutlined />}
                        onClick={onToggle}
                        style={{
                            fontSize: '16px',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#1890ff',
                            position: 'absolute',
                            right: -16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: '#fff',
                            border: '1px solid #f0f0f0',
                            borderRadius: '50%',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#e6f7ff'
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#fff'
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                )}
            </div>
            <Menu
                mode='inline'
                selectedKeys={getSelectedKeys()}
                openKeys={openKeys}
                onOpenChange={handleOpenChange}
                onClick={handleMenuClick}
                items={menuItems}
                style={{
                    borderRight: 0,
                    height: 'calc(100vh - 64px)',
                }}
            />
        </Sider>
    )
}

export default Sidebar
