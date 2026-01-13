import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, Space, Typography } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutUser, selectCurrentUser } from '@/store/slices/userSlice'
import { showDialog } from '@/utils/showDialog'
import UserProfileDialog from '@/components/UserProfileDialog'
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
    const handleLogout = async () => {
        try {
            // 调用登出接口
            await dispatch(logoutUser()).unwrap()
            // 登出成功后跳转到登录页
            navigate('/login', { replace: true })
        } catch (error) {
            // 即使登出接口失败，也跳转到登录页（本地状态已清除）
            navigate('/login', { replace: true })
        }
    }

    /**
     * 处理查看个人信息
     */
    const handleViewProfile = () => {
        showDialog(UserProfileDialog, {
            title: '个人信息',
        })
    }

    /**
     * 获取角色显示文本
     */
    const getRoleText = () => {
        if (!currentUser?.roles || currentUser.roles.length === 0) {
            return currentUser?.role === 'admin' ? '管理员' : currentUser?.role === 'user' ? '普通用户' : '访客'
        }
        // 根据角色列表显示，优先显示 admin
        if (currentUser.roles.includes('admin')) {
            return '管理员'
        }
        return currentUser.roles.join('、') || '普通用户'
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
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        {currentUser?.nickName || currentUser?.username}
                    </div>
                    {currentUser?.nickName && (
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>
                            {currentUser.username}
                        </div>
                    )}
                    {currentUser?.email && (
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>
                            {currentUser.email}
                        </div>
                    )}
                    {currentUser?.phoneNumber && (
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>
                            {currentUser.phoneNumber}
                        </div>
                    )}
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                        {getRoleText()}
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
            onClick: handleViewProfile,
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
                        {currentUser.nickName || currentUser.username}
                    </Text>
                    <Text type="secondary" className={styles.userRole}>
                        {getRoleText()}
                    </Text>
                </div>
            </Space>
        </Dropdown>
    )
}

export default UserInfo

