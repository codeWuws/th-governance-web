import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import React from 'react'
import { RouterProvider } from 'react-router-dom'
import './App.css'
import { router } from './router'
import GlobalMessageHost from '@/components/GlobalMessageHost'

/**
 * 应用程序根组件
 * 配置 Ant Design 中文语言包和路由系统
 * 使用 App 组件包装以支持 message 等静态方法
 */
const App: React.FC = () => {
    return (
        <ConfigProvider locale={zhCN}>
            <AntdApp>
                <RouterProvider router={router} />
                {/* Mount message host so all uiMessage calls work in React 19 */}
                <GlobalMessageHost />
            </AntdApp>
        </ConfigProvider>
    )
}

export default App
