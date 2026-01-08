import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, Space, Typography } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout, selectCurrentUser } from '@/store/slices/userSlice'
import styles from './UserInfo.module.scss'

const { Text } = Typography

/**
 * 用户信息组件
 * 展示在面包屑右侧
 */
const UserInfo: React.FC = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const currentUser = useAppSelector(selectCurrentUser)

    /**
     * 处理登出
     */
    const handleLogout = () => {
        dispatch(logout())
        navigate('/login', { replace: true })
    }

    /**
     * 用户菜单项
     */
    const userMenuItems = [
        {
            key: 'userInfo',
            type: 'group' as const,
            label: (
                <div style={{ padding: '4px 0' }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{currentUser?.username}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{currentUser?.email}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                        {currentUser?.role === 'admin' ? '管理员' : currentUser?.role === 'user' ? '普通用户' : '访客'}
                    </div>
                </div>
            ),
            disabled: true,
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'profile',
            label: (
                <Space>
                    <UserOutlined />
                    <span>个人信息</span>
                </Space>
            ),
            disabled: true, // 暂时禁用，后续可扩展
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            label: (
                <Space>
                    <LogoutOutlined />
                    <span>退出登录</span>
                </Space>
            ),
            onClick: handleLogout,
        },
    ]

    // 如果没有用户信息，显示默认状态
    if (!currentUser) {
        return (
            <Space className={styles.userInfo} size="small">
                <Avatar icon={<UserOutlined />} size="default" />
                <Text type="secondary">未登录</Text>
            </Space>
        )
    }

    return (
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className={styles.userInfo} size="small">
                <Avatar
                    src={currentUser.avatar}
                    icon={!currentUser.avatar && <UserOutlined />}
                    size="default"
                />
                <div className={styles.userText}>
                    <Text strong className={styles.username}>
                        {currentUser.username}
                    </Text>
                    <Text type="secondary" className={styles.userRole}>
                        {currentUser.role === 'admin' ? '管理员' : currentUser.role === 'user' ? '普通用户' : '访客'}
                    </Text>
                </div>
            </Space>
        </Dropdown>
    )
}

export default UserInfo

