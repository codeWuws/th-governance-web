import React from 'react'
import { Outlet } from 'react-router-dom'

/**
 * 系统设置主页面组件
 * 提供系统设置模块的子页面容器
 */
const SystemSettings: React.FC = () => {
    return (
        <div className='system-settings'>
            <Outlet />
        </div>
    )
}

export default SystemSettings
