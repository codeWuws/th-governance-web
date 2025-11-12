import React from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'

const { Content } = Layout

const DataManagement: React.FC = () => {
    return (
        <Layout style={{ minHeight: '100%', padding: '24px' }}>
            <Content>
                <Outlet />
            </Content>
        </Layout>
    )
}

export default DataManagement
