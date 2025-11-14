import React from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'

const { Content } = Layout

const DataManagement: React.FC = () => {
    return (
        <Layout style={{ minHeight: '100%', background: 'transparent' }}>
            <Content style={{ background: 'transparent' }}>
                <Outlet />
            </Content>
        </Layout>
    )
}

export default DataManagement
