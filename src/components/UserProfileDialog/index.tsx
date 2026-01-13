import { Avatar, Descriptions, Spin } from 'antd'
import React, { useEffect, useState } from 'react'
import { AuthService, type UserInfoDetail } from '@/services/authService'
import CustomDialog from '../CustomDialog'
import styles from './index.module.scss'

/**
 * 用户个人信息弹窗组件
 */
const UserProfileDialog: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [userInfo, setUserInfo] = useState<UserInfoDetail | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // 获取用户详细信息
        const fetchUserInfo = async () => {
            try {
                setLoading(true)
                setError(null)
                const info = await AuthService.getUserInfo()
                setUserInfo(info)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : '获取用户信息失败'
                setError(errorMessage)
            } finally {
                setLoading(false)
            }
        }

        fetchUserInfo()
    }, [])

    // 格式化时间戳
    const formatTime = (timestamp: number) => {
        if (!timestamp) return '-'
        return new Date(timestamp).toLocaleString('zh-CN')
    }

    // 格式化性别
    const formatSex = (sex: string) => {
        const sexMap: Record<string, string> = {
            '0': '男',
            '1': '女',
            '2': '未知',
        }
        return sexMap[sex] || sex || '-'
    }

    // 格式化状态
    const formatStatus = (status: string) => {
        const statusMap: Record<string, string> = {
            '0': '正常',
            '1': '停用',
        }
        return statusMap[status] || status || '-'
    }

    return (
        <CustomDialog
            title="个人信息"
            width={600}
            footer={null}
            styles={{
                body: {
                    maxHeight: '70vh',
                    overflow: 'auto',
                },
            }}
        >
            <div className={styles.userProfileDialog}>
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" tip="加载中..." />
                    </div>
                ) : error ? (
                    <div className={styles.errorContainer}>
                        <p style={{ color: '#ff4d4f' }}>{error}</p>
                    </div>
                ) : userInfo ? (
                    <>
                        {/* 用户头像和基本信息 */}
                        <div className={styles.userHeader}>
                            <Avatar
                                src={userInfo.user.avatar}
                                size={80}
                                icon={!userInfo.user.avatar && <span>{userInfo.user.nickName?.[0] || userInfo.user.username[0]}</span>}
                            />
                            <div className={styles.userHeaderInfo}>
                                <h3>{userInfo.user.nickName || userInfo.user.username}</h3>
                                <p>{userInfo.user.username}</p>
                            </div>
                        </div>

                        {/* 详细信息 */}
                        <Descriptions column={1} bordered size="small" className={styles.descriptions}>
                            <Descriptions.Item label="用户ID">{userInfo.user.id}</Descriptions.Item>
                            <Descriptions.Item label="用户名">{userInfo.user.username}</Descriptions.Item>
                            <Descriptions.Item label="昵称">{userInfo.user.nickName || '-'}</Descriptions.Item>
                            <Descriptions.Item label="邮箱">{userInfo.user.email || '-'}</Descriptions.Item>
                            <Descriptions.Item label="手机号">{userInfo.user.phoneNumber || '-'}</Descriptions.Item>
                            <Descriptions.Item label="性别">{formatSex(userInfo.user.sex)}</Descriptions.Item>
                            <Descriptions.Item label="状态">{formatStatus(userInfo.user.status)}</Descriptions.Item>
                            <Descriptions.Item label="部门ID">{userInfo.deptId || '-'}</Descriptions.Item>
                            <Descriptions.Item label="岗位ID">{userInfo.user.postId || '-'}</Descriptions.Item>
                            <Descriptions.Item label="角色">
                                {userInfo.roles && userInfo.roles.length > 0 ? userInfo.roles.join('、') : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="权限">
                                {userInfo.permissions && userInfo.permissions.length > 0 ? (
                                    <div className={styles.permissionsList}>
                                        {userInfo.permissions.map((permission, index) => (
                                            <span key={index} className={styles.permissionTag}>
                                                {permission}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="登录时间">{formatTime(userInfo.loginTime)}</Descriptions.Item>
                            <Descriptions.Item label="过期时间">{formatTime(userInfo.expireTime)}</Descriptions.Item>
                            <Descriptions.Item label="登录IP">{userInfo.ipaddr || '-'}</Descriptions.Item>
                            <Descriptions.Item label="登录地点">{userInfo.loginLocation || '-'}</Descriptions.Item>
                            <Descriptions.Item label="浏览器">{userInfo.browser || '-'}</Descriptions.Item>
                            <Descriptions.Item label="操作系统">{userInfo.os || '-'}</Descriptions.Item>
                            <Descriptions.Item label="创建时间">
                                {userInfo.user.createTime ? new Date(userInfo.user.createTime).toLocaleString('zh-CN') : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="创建人">{userInfo.user.createBy || '-'}</Descriptions.Item>
                            {userInfo.user.updateTime && (
                                <Descriptions.Item label="更新时间">
                                    {new Date(userInfo.user.updateTime).toLocaleString('zh-CN')}
                                </Descriptions.Item>
                            )}
                            {userInfo.user.updateBy && (
                                <Descriptions.Item label="更新人">{userInfo.user.updateBy}</Descriptions.Item>
                            )}
                            {userInfo.user.remark && (
                                <Descriptions.Item label="备注">{userInfo.user.remark}</Descriptions.Item>
                            )}
                        </Descriptions>
                    </>
                ) : null}
            </div>
        </CustomDialog>
    )
}

export default UserProfileDialog

