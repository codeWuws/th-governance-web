import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Button, Layout, Menu, MenuProps } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectMenus } from '@/store/slices/menuSlice'
import {
    permissionMenusToItems,
    getOpenKeysFromMenus,
    getSelectedKeyFromMenus,
    ROUTER_BASENAME,
} from './menuUtils'

const { Sider } = Layout

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const menus = useAppSelector(selectMenus)

    const menuItems = useMemo(
        () => permissionMenusToItems(menus, ROUTER_BASENAME),
        [menus]
    )

    const selectedKeys = useMemo(() => {
        const key = getSelectedKeyFromMenus(menus, location.pathname, ROUTER_BASENAME)
        return key ? [key] : []
    }, [menus, location.pathname])

    const defaultOpenKeys = useMemo(
        () => getOpenKeysFromMenus(menus, location.pathname),
        [menus, location.pathname]
    )
    const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys)

    useEffect(() => {
        setOpenKeys(prev => {
            const next = getOpenKeysFromMenus(menus, location.pathname)
            return next.length ? next : prev
        })
    }, [menus, location.pathname])

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        navigate(key.startsWith(ROUTER_BASENAME) ? key.slice(ROUTER_BASENAME.length) || '/' : key)
    }

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
                zIndex: 999,
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
                selectedKeys={selectedKeys}
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
