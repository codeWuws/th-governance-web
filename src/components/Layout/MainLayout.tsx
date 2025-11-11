import { Layout, theme } from 'antd'
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Breadcrumb from '../Breadcrumb'
import TabBar from '../TabBar'
import Sidebar from './Sidebar'

const { Content } = Layout

const MainLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false)
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()

    const handleToggle = () => {
        setCollapsed(!collapsed)
    }

    return (
        <Layout style={{ minHeight: '100vh', position: 'relative' }}>
            <Sidebar collapsed={collapsed} onToggle={handleToggle} />

            <Layout style={{ marginLeft: collapsed ? 80 : 256, transition: 'margin-left 0.2s' }}>
                <Content
                    style={{
                        margin: '0 16px 24px',
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* 面包屑导航容器 */}
                    <div
                        style={{
                            padding: '16px 16px 14px',
                            borderBottom: '1px solid #f0f0f0',
                            backgroundColor: '#fafafa',
                            borderRadius: `${borderRadiusLG}px ${borderRadiusLG}px 0 0`,
                            minHeight: '52px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Breadcrumb />
                    </div>
                    <div style={{ padding: '0 16px', marginTop: 12, marginBottom: 8 }}>
                        <TabBar />
                    </div>
                    <div style={{ padding: 24, flex: 1 }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default MainLayout
