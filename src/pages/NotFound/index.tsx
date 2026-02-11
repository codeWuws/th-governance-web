import { HomeOutlined } from '@ant-design/icons'
import { Button, Result } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * 404页面组件
 * 当访问不存在的路由时显示
 */
const NotFound: React.FC = () => {
    const navigate = useNavigate()

    return (
        <Result
            status="404"
            title="404"
            subTitle="抱歉，您访问的页面不存在。"
            extra={
                <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
                    返回首页
                </Button>
            }
        />
    )
}

export default NotFound





