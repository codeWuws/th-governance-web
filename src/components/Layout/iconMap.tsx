import {
    BarChartOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    HeartOutlined,
    LinkOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
    KeyOutlined,
    ToolOutlined,
    ApiOutlined,
    TagOutlined,
    SearchOutlined,
    LineChartOutlined,
    EyeOutlined,
    UserOutlined,
    TeamOutlined,
    SafetyOutlined,
} from '@ant-design/icons'
import React from 'react'

/** 菜单图标名称与组件的映射（与后端 permission 的 icon 字段一致） */
const iconMap: Record<string, React.ReactNode> = {
    DashboardOutlined: <DashboardOutlined />,
    DatabaseOutlined: <DatabaseOutlined />,
    SettingOutlined: <SettingOutlined />,
    ClockCircleOutlined: <ClockCircleOutlined />,
    SafetyCertificateOutlined: <SafetyCertificateOutlined />,
    FileTextOutlined: <FileTextOutlined />,
    CheckCircleOutlined: <CheckCircleOutlined />,
    HeartOutlined: <HeartOutlined />,
    TagOutlined: <TagOutlined />,
    LinkOutlined: <LinkOutlined />,
    KeyOutlined: <KeyOutlined />,
    ToolOutlined: <ToolOutlined />,
    ApiOutlined: <ApiOutlined />,
    SearchOutlined: <SearchOutlined />,
    LineChartOutlined: <LineChartOutlined />,
    EyeOutlined: <EyeOutlined />,
    UserOutlined: <UserOutlined />,
    TeamOutlined: <TeamOutlined />,
    SafetyOutlined: <SafetyOutlined />,
    BarChartOutlined: <BarChartOutlined />,
}

export function getMenuIcon(iconName: string | null): React.ReactNode {
    if (!iconName) return null
    return iconMap[iconName] ?? null
}

export default iconMap
