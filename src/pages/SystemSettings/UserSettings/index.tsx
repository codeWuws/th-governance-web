/**
 * 用户设置页面 - 用户管理
 * 实现RBAC系统中用户管理功能
 */

import React, { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Select,
    Tag,
    Avatar,
    Modal,
    Form,
    Switch,
    message,
    Popconfirm,
    Row,
    Col,
    Drawer,
    Descriptions,
    Badge,
    Tooltip,
} from 'antd'
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    KeyOutlined,
    UserOutlined,
    SafetyOutlined,
    ReloadOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { RootState, useSystemSettings } from '@/store'
import { RBACUser, UserStatus, UserQueryParams, UserFormData, Role } from '@/types/rbac'
import { mockApi } from '@/mock/rbac'
import { getAllRoles as mockGetAllRoles } from '@/mock/rbac'
import UserForm from './components/UserForm'
import RoleAssignment from './components/RoleAssignment'
import { formatDate } from '@/utils/date'

const { Search } = Input
const { Option } = Select

/**
 * 用户状态标签映射
 */
const userStatusMap = {
    [UserStatus.ACTIVE]: { color: 'success', text: '启用' },
    [UserStatus.DISABLED]: { color: 'warning', text: '禁用' },
    [UserStatus.LOCKED]: { color: 'error', text: '锁定' },
}

/**
 * 用户设置页面
 */
const UserSettings: React.FC = () => {
    // 使用系统设置Redux状态管理
    const {
        users,
        roles,
        userLoading: loading,
        setUsers,
        setRoles,
        setUserLoading,
        setUserRoleAssignments,
    } = useSystemSettings()

    // 本地状态管理
    const [total, setTotal] = useState(0)

    // 查询参数
    const [queryParams, setQueryParams] = useState<UserQueryParams>({
        page: 1,
        pageSize: 10,
        keyword: '',
        status: undefined,
        roleId: undefined,
    })

    // 模态框状态
    const [modalVisible, setModalVisible] = useState(false)
    const [drawerVisible, setDrawerVisible] = useState(false)
    const [roleModalVisible, setRoleModalVisible] = useState(false)
    const [editingUser, setEditingUser] = useState<RBACUser | null>(null)
    const [selectedUser, setSelectedUser] = useState<RBACUser | null>(null)

    // 当前登录用户信息
    const currentUser = useSelector((state: RootState) => state.user.userInfo)

    /**
     * 加载用户列表
     */
    const loadUsers = async () => {
        try {
            setUserLoading(true)
            const response = await mockApi.user.getUserList(queryParams)
            if (response.data.success) {
                setUsers(response.data.data.records)
                setTotal(response.data.data.total)

                // 初始化用户角色分配数据
                const roleAssignments: Record<string, string[]> = {}
                response.data.data.records.forEach((user: RBACUser) => {
                    roleAssignments[user.id] = user.roles?.map(role => role.id) || []
                })
                setUserRoleAssignments(roleAssignments)
            }
        } catch (error) {
            message.error('加载用户列表失败')
            console.error('Load users error:', error)
        } finally {
            setUserLoading(false)
        }
    }

    /**
     * 加载角色列表
     */
    const loadRoles = async () => {
        try {
            const list = mockGetAllRoles()
            setRoles(list)
        } catch (error) {
            console.error('Load roles error:', error)
        }
    }

    /**
     * 初始化数据
     */
    useEffect(() => {
        loadUsers()
        loadRoles()
    }, [queryParams])

    /**
     * 处理查询参数变化
     */
    const handleQueryChange = (key: keyof UserQueryParams, value: any) => {
        setQueryParams(prev => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? value : 1,
        }))
    }

    /**
     * 处理搜索
     */
    const handleSearch = (value: string) => {
        handleQueryChange('keyword', value)
    }

    /**
     * 处理状态筛选
     */
    const handleStatusFilter = (status: UserStatus | undefined) => {
        handleQueryChange('status', status)
    }

    /**
     * 处理角色筛选
     */
    const handleRoleFilter = (roleId: string | undefined) => {
        handleQueryChange('roleId', roleId)
    }

    /**
     * 处理新建用户
     */
    const handleCreate = () => {
        setEditingUser(null)
        setModalVisible(true)
    }

    /**
     * 处理编辑用户
     */
    const handleEdit = (user: RBACUser) => {
        setEditingUser(user)
        setModalVisible(true)
    }

    /**
     * 处理查看详情
     */
    const handleView = (user: RBACUser) => {
        setSelectedUser(user)
        setDrawerVisible(true)
    }

    /**
     * 处理分配角色
     */
    const handleAssignRoles = (user: RBACUser) => {
        setSelectedUser(user)
        setRoleModalVisible(true)
    }

    /**
     * 处理状态切换
     */
    const handleStatusToggle = async (user: RBACUser) => {
        try {
            const newStatus =
                user.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE
            const response = await mockApi.user.updateUser(user.id, { status: newStatus })
            if (response.data.success) {
                message.success('状态更新成功')
                loadUsers()
            }
        } catch (error) {
            message.error('状态更新失败')
            console.error('Update status error:', error)
        }
    }

    /**
     * 处理删除用户
     */
    const handleDelete = async (user: RBACUser) => {
        try {
            const response = await mockApi.user.deleteUser(user.id)
            if (response.data.success) {
                message.success('删除用户成功')
                loadUsers()
            }
        } catch (error) {
            message.error('删除用户失败')
            console.error('Delete user error:', error)
        }
    }

    /**
     * 处理表单提交
     */
    const handleFormSubmit = async (values: UserFormData) => {
        try {
            let response
            if (editingUser) {
                // 编辑用户
                response = await mockApi.user.updateUser(editingUser.id, values)
            } else {
                // 新建用户
                response = await mockApi.user.createUser(values)
            }

            if (response.data.success) {
                message.success(editingUser ? '更新用户成功' : '创建用户成功')
                setModalVisible(false)
                loadUsers()
            }
        } catch (error) {
            message.error(editingUser ? '更新用户失败' : '创建用户失败')
            console.error('Submit user error:', error)
        }
    }

    /**
     * 处理角色分配
     */
    const handleRoleAssignment = async (roleIds: string[]) => {
        if (!selectedUser) return

        try {
            const response = await mockApi.user.updateUserRoles(selectedUser.id, roleIds)
            if (response.data.success) {
                message.success('角色分配成功')
                setRoleModalVisible(false)
                loadUsers()
            }
        } catch (error) {
            message.error('角色分配失败')
            console.error('Assign roles error:', error)
        }
    }

    /**
     * 表格列定义
     */
    const columns = [
        {
            title: '用户',
            dataIndex: 'username',
            key: 'username',
            width: 200,
            render: (text: string, record: RBACUser) => (
                <Space>
                    <Avatar src={record.avatar} icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.realName || text}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{text}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            width: 200,
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
            render: (text?: string) => text || '-',
        },
        {
            title: '角色',
            dataIndex: 'roles',
            key: 'roles',
            width: 200,
            render: (roles: Role[]) => (
                <Space size={[0, 8]} wrap>
                    {roles?.map(role => (
                        <Tag key={role.id} color='blue'>
                            {role.name}
                        </Tag>
                    )) || '-'}
                </Space>
            ),
        },
        {
            title: '部门',
            dataIndex: 'department',
            key: 'department',
            width: 120,
            render: (text?: string) => text || '-',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: UserStatus) => {
                const statusInfo = userStatusMap[status]
                return <Badge status={statusInfo.color as any} text={statusInfo.text} />
            },
        },
        {
            title: '最后登录',
            dataIndex: 'lastLoginTime',
            key: 'lastLoginTime',
            width: 150,
            render: (text?: string) => (text ? formatDate(text) : '从未登录'),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (text: string) => formatDate(text),
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (text: string, record: RBACUser) => (
                <Space>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip title='编辑'>
                        <Button
                            type='text'
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title='分配角色'>
                        <Button
                            type='text'
                            icon={<SafetyOutlined />}
                            onClick={() => handleAssignRoles(record)}
                        />
                    </Tooltip>
                    <Tooltip title={record.status === UserStatus.ACTIVE ? '禁用' : '启用'}>
                        <Switch
                            checked={record.status === UserStatus.ACTIVE}
                            onChange={() => handleStatusToggle(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title='确定要删除这个用户吗？'
                        onConfirm={() => handleDelete(record)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Tooltip title='删除'>
                            <Button type='text' danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div className='user-settings'>
            <Card>
                {/* 搜索和操作区域 */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                        <Search
                            placeholder='搜索用户名、邮箱、姓名'
                            allowClear
                            enterButton={<SearchOutlined />}
                            onSearch={handleSearch}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col span={4}>
                        <Select
                            placeholder='状态筛选'
                            allowClear
                            style={{ width: '100%' }}
                            onChange={handleStatusFilter}
                        >
                            <Option value={UserStatus.ACTIVE}>启用</Option>
                            <Option value={UserStatus.DISABLED}>禁用</Option>
                            <Option value={UserStatus.LOCKED}>锁定</Option>
                        </Select>
                    </Col>
                    <Col span={4}>
                        <Select
                            placeholder='角色筛选'
                            allowClear
                            style={{ width: '100%' }}
                            onChange={handleRoleFilter}
                        >
                            {roles.map(role => (
                                <Option key={role.id} value={role.id}>
                                    {role.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col span={10} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    loadUsers()
                                    loadRoles()
                                }}
                            >
                                刷新
                            </Button>
                            <Button type='primary' icon={<PlusOutlined />} onClick={handleCreate}>
                                新建用户
                            </Button>
                        </Space>
                    </Col>
                </Row>

                {/* 用户表格 */}
                <Table
                    rowKey='id'
                    loading={loading}
                    columns={columns}
                    dataSource={users}
                    pagination={{
                        current: queryParams.page,
                        pageSize: queryParams.pageSize,
                        total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                        onChange: (page, pageSize) => {
                            handleQueryChange('page', page)
                            handleQueryChange('pageSize', pageSize)
                        },
                    }}
                    scroll={{ x: 1400 }}
                />
            </Card>

            {/* 用户表单模态框 */}
            <Modal
                title={editingUser ? '编辑用户' : '新建用户'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <UserForm
                    initialValues={editingUser}
                    roles={roles}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setModalVisible(false)}
                />
            </Modal>

            {/* 角色分配模态框 */}
            <Modal
                title='分配角色'
                open={roleModalVisible}
                onCancel={() => setRoleModalVisible(false)}
                footer={null}
                width={500}
            >
                {selectedUser && (
                    <RoleAssignment
                        user={selectedUser}
                        allRoles={roles}
                        onSubmit={handleRoleAssignment}
                        onCancel={() => setRoleModalVisible(false)}
                    />
                )}
            </Modal>

            {/* 用户详情抽屉 */}
            <Drawer
                title='用户详情'
                placement='right'
                width={600}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
            >
                {selectedUser && (
                    <Descriptions column={1} bordered>
                        <Descriptions.Item label='头像'>
                            <Avatar src={selectedUser.avatar} size={64} icon={<UserOutlined />} />
                        </Descriptions.Item>
                        <Descriptions.Item label='用户名'>
                            {selectedUser.username}
                        </Descriptions.Item>
                        <Descriptions.Item label='真实姓名'>
                            {selectedUser.realName}
                        </Descriptions.Item>
                        <Descriptions.Item label='邮箱'>{selectedUser.email}</Descriptions.Item>
                        <Descriptions.Item label='手机号'>
                            {selectedUser.phone || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='部门'>
                            {selectedUser.department || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='职位'>
                            {selectedUser.position || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='状态'>
                            <Badge
                                status={userStatusMap[selectedUser.status].color as any}
                                text={userStatusMap[selectedUser.status].text}
                            />
                        </Descriptions.Item>
                        <Descriptions.Item label='角色'>
                            <Space wrap>
                                {selectedUser.roles?.map(role => (
                                    <Tag key={role.id} color='blue'>
                                        {role.name}
                                    </Tag>
                                ))}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label='最后登录时间'>
                            {selectedUser.lastLoginTime
                                ? formatDate(selectedUser.lastLoginTime)
                                : '从未登录'}
                        </Descriptions.Item>
                        <Descriptions.Item label='最后登录IP'>
                            {selectedUser.lastLoginIp || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='创建时间'>
                            {formatDate(selectedUser.createdAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label='更新时间'>
                            {formatDate(selectedUser.updatedAt)}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </div>
    )
}

export default UserSettings
