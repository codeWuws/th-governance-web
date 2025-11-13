/**
 * 角色分配组件
 * 用于给用户分配角色
 */

import React, { useState, useEffect } from 'react'
import { Transfer, Alert, Space, Typography } from 'antd'
import { RBACUser, Role } from '@/types/rbac'
import { useSystemSettings } from '@/store/hooks'

const { Text } = Typography

interface RoleAssignmentProps {
    user: RBACUser
    allRoles: Role[]
    onSubmit: (roleIds: string[]) => void
    onCancel: () => void
}

interface TransferItem {
    key: string
    title: string
    description?: string
    disabled?: boolean
}

/**
 * 角色分配组件
 */
const RoleAssignment: React.FC<RoleAssignmentProps> = ({ user, allRoles, onSubmit, onCancel }) => {
    const { getUserRoles, setUserRoles } = useSystemSettings()
    const [targetKeys, setTargetKeys] = useState<string[]>([])
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])

    // 从Redux状态初始化目标角色
    useEffect(() => {
        const savedRoles = getUserRoles(user.id)
        const userRoles = user.roles?.map(role => role.id) || []
        // 如果Redux中没有数据，使用用户当前的角色
        const initialRoles = savedRoles.length > 0 ? savedRoles : userRoles
        setTargetKeys(initialRoles)
    }, [user, getUserRoles])

    /**
     * 转换角色数据为Transfer组件格式
     */
    const convertRolesToTransferItems = (): TransferItem[] => {
        return allRoles.map(role => ({
            key: role.id,
            title: role.name,
            description: role.description || '暂无描述',
        }))
    }

    /**
     * 处理Transfer变化
     */
    const handleTransferChange = (nextTargetKeys: (string | number)[]) => {
        setTargetKeys(nextTargetKeys as string[])
    }

    /**
     * 处理选择变化
     */
    const handleSelectChange = (
        sourceSelectedKeys: (string | number)[],
        targetSelectedKeys: (string | number)[]
    ) => {
        setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys] as string[])
    }

    /**
     * 处理提交
     */
    const handleSubmit = () => {
        // 先保存到Redux状态
        setUserRoles(user.id, targetKeys)
        // 然后调用父组件的提交方法
        onSubmit(targetKeys)
    }

    /**
     * 处理取消
     */
    const handleCancel = () => {
        onCancel()
    }

    const dataSource = convertRolesToTransferItems()

    return (
        <div style={{ padding: '16px 0' }}>
            {/* 用户信息提示 */}
            <Alert
                message='角色分配'
                description={
                    <Space direction='vertical' style={{ width: '100%' }}>
                        <Text>
                            当前用户：
                            <strong>
                                {user.realName} ({user.username})
                            </strong>
                        </Text>
                        <Text type='secondary'>
                            请选择该用户拥有的角色，用户将获得所选角色的所有权限
                        </Text>
                    </Space>
                }
                type='info'
                showIcon
                style={{ marginBottom: 16 }}
            />

            {/* 角色分配Transfer */}
            <Transfer
                dataSource={dataSource}
                titles={['可选角色', '已分配角色']}
                targetKeys={targetKeys}
                selectedKeys={selectedKeys}
                onChange={handleTransferChange}
                onSelectChange={handleSelectChange}
                render={item => (
                    <div>
                        <div style={{ fontWeight: 500 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{item.description}</div>
                    </div>
                )}
                listStyle={{
                    width: 220,
                    height: 300,
                }}
                showSearch
                filterOption={(inputValue, item) =>
                    item.title.toLowerCase().includes(inputValue.toLowerCase())
                }
            />

            {/* 操作按钮 */}
            <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Space>
                    <button className='ant-btn' onClick={handleCancel}>
                        取消
                    </button>
                    <button className='ant-btn ant-btn-primary' onClick={handleSubmit}>
                        确认分配
                    </button>
                </Space>
            </div>
        </div>
    )
}

export default RoleAssignment
