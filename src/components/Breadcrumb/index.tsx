import { HomeOutlined } from '@ant-design/icons'
import { Breadcrumb as AntBreadcrumb } from 'antd'
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './index.module.scss'

export interface BreadcrumbItem {
    title: string
    path?: string
    icon?: React.ReactNode
}

interface BreadcrumbProps {
    items?: BreadcrumbItem[]
    className?: string
}

/**
 * 面包屑导航组件
 * 支持自定义路径或自动根据当前路由生成
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
    const location = useLocation()

    // 路由映射配置
    const routeMap: Record<string, BreadcrumbItem> = {
        '/dashboard': { title: '仪表盘', icon: <HomeOutlined /> },
        '/database-connection': { title: '数据源管理' },
        '/data-governance': { title: '数据治理' },
        '/data-governance/workflow-config': { title: '工作流步骤' },
        '/data-governance/execution-history': { title: '执行历史' },
        '/data-governance/execution': { title: '执行详情' },
        '/data-quality-control': { title: '数据质控' },
        '/data-quality-control/text': { title: '文本质控' },
        '/data-quality-control/comprehensive': { title: '综合质控' },
        '/data-quality-control/completeness': { title: '完整性质控' },
        '/data-quality-control/basic-medical-logic': { title: '基础医疗逻辑质控' },
        '/data-quality-control/core-data': { title: '核心数据质控' },
        '/system-settings': { title: '系统设置' },
        '/system-settings/users': { title: '用户设置' },
        '/system-settings/roles': { title: '角色设置' },
    }

    /**
     * 根据当前路径自动生成面包屑项
     */
    const generateBreadcrumbItems = (): BreadcrumbItem[] => {
        const pathSegments = location.pathname.split('/').filter(Boolean)
        const breadcrumbItems: BreadcrumbItem[] = [
            { title: '首页', path: '/dashboard', icon: <HomeOutlined /> },
        ]

        let currentPath = ''
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`

            // 检查是否是动态路由参数（如 /data-governance/execution/123）
            const isLastSegment = index === pathSegments.length - 1
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))

            // 优先匹配完整路径
            let routeInfo = routeMap[currentPath]

            // 如果没有找到完整路径匹配，且是最后一个段，尝试匹配父路径
            if (!routeInfo && isLastSegment && routeMap[parentPath]) {
                routeInfo = routeMap[parentPath]
                // 对于动态路由，使用父路径作为当前路径
                currentPath = parentPath
            }

            if (routeInfo) {
                breadcrumbItems.push({
                    title: routeInfo.title,
                    path: isLastSegment ? undefined : currentPath,
                    icon: routeInfo.icon,
                })
            }
        })

        return breadcrumbItems
    }

    const breadcrumbItems = items || generateBreadcrumbItems()

    const antdItems = breadcrumbItems.map((item, index) => ({
        title: item.path ? (
            <Link to={item.path} className={styles.breadcrumbLink}>
                {item.icon && <span className={styles.breadcrumbIcon}>{item.icon}</span>}
                {item.title}
            </Link>
        ) : (
            <span className={styles.breadcrumbCurrent}>
                {item.icon && <span className={styles.breadcrumbIcon}>{item.icon}</span>}
                {item.title}
            </span>
        ),
        key: index,
    }))

    return (
        <div className={`${styles.breadcrumbWrapper} ${className || ''}`}>
            <AntBreadcrumb items={antdItems} separator='/' className={styles.breadcrumb} />
        </div>
    )
}

export default Breadcrumb
