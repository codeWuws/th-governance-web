import React from 'react'
import { Card, Typography } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'

const { Title, Text } = Typography

const SystemSettings: React.FC = () => {
    const location = useLocation()

    const getHeaderTitle = () => {
        if (location.pathname.includes('/users')) {
            return '用户管理'
        }
        if (location.pathname.includes('/roles')) {
            return '角色管理'
        }
        return '系统设置'
    }

    const getHeaderDescription = () => {
        if (location.pathname.includes('/users')) {
            return '管理系统用户账户，分配角色权限'
        }
        if (location.pathname.includes('/roles')) {
            return '定义角色权限集合，管理角色成员'
        }
        return '基于角色的访问控制系统设置'
    }

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ marginBottom: '24px' }}>
                    <Title level={2} style={{ marginBottom: '8px' }}>
                        {getHeaderTitle()}
                    </Title>
                    <Text type='secondary' style={{ fontSize: '14px' }}>
                        {getHeaderDescription()}
                    </Text>
                </div>

                <Outlet />
            </Card>
        </div>
    )
}

export default SystemSettings
