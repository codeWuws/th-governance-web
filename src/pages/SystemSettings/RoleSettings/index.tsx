/**
 * 角色设置页面 - 角色管理
 * 实现RBAC系统中角色管理功能
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
    Alert,
    Statistic,
} from 'antd'
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    SafetyOutlined,
    ReloadOutlined,
    TeamOutlined,
    LockOutlined,
    UnlockOutlined,
} from '@ant-design/icons'
import { Role, RoleQueryParams, RoleFormData } from '@/types/rbac'
import { mockApi } from '@/mock/rbac'
import RoleForm from './components/RoleForm'

import { formatDate } from '@/utils/date'

const { Search } = Input
const { Option } = Select

/**
 * 角色状态标签映射
 */
const roleStatusMap = {
    active: { color: 'success', text: '启用' },
    disabled: { color: 'warning', text: '禁用' },
}

/**
 * 角色设置页面
 */
const RoleSettings: React.FC = () => {
    // 状态管理
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)

    const [stats, setStats] = useState({
        totalRoles: 0,
        activeRoles: 0,
    })

    // 查询参数
    const [queryParams, setQueryParams] = useState<RoleQueryParams>({
        page: 1,
        pageSize: 10,
        keyword: '',
        status: undefined,
    })

    // 模态框状态
    const [modalVisible, setModalVisible] = useState(false)
    const [drawerVisible, setDrawerVisible] = useState(false)

    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)

    /**
     * 加载角色列表
     */
    const loadRoles = async () => {
        try {
            setLoading(true)
            const response = await mockApi.role.getRoleList(queryParams)
            if (response.data.success) {
                setRoles(response.data.data.records)
                setTotal(response.data.data.total)
            }
        } catch (error) {
            message.error('加载角色列表失败')
            console.error('Load roles error:', error)
        } finally {
            setLoading(false)
        }
    }


    /**
     * 加载统计信息
     */
    const loadStats = async () => {
        try {
            // 这里可以调用统计API
            const activeCount = roles.filter(role => role.status === 'active').length
            setStats({
                totalRoles: roles.length,
                activeRoles: activeCount,

            })
        } catch (error) {
            console.error('Load stats error:', error)
        }
    }

    /**
     * 初始化数据
     */
    useEffect(() => {
        loadRoles()

    }, [queryParams])

    useEffect(() => {
        loadStats()
    }, [roles])

    /**
     * 处理查询参数变化
     */
    const handleQueryChange = (key: keyof RoleQueryParams, value: any) => {
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
    const handleStatusFilter = (status: 'active' | 'disabled' | undefined) => {
        handleQueryChange('status', status)
    }

    /**
     * 处理新建角色
     */
    const handleCreate = () => {
        setEditingRole(null)
        setModalVisible(true)
    }

    /**
     * 处理编辑角色
     */
    const handleEdit = (role: Role) => {
        setEditingRole(role)
        setModalVisible(true)
    }

    /**
     * 处理查看详情
     */
    const handleView = (role: Role) => {
        setSelectedRole(role)
        setDrawerVisible(true)
    }


    /**
     * 处理状态切换
     */
    const handleStatusToggle = async (role: Role) => {
        try {
            const newStatus = role.status === 'active' ? 'disabled' : 'active'
            const response = await mockApi.role.updateRole(role.id, { status: newStatus })
            if (response.data.success) {
                message.success('状态更新成功')
                loadRoles()
            }
        } catch (error) {
            message.error('状态更新失败')
            console.error('Update status error:', error)
        }
    }

    /**
     * 处理删除角色
     */
    const handleDelete = async (role: Role) => {
        try {
            const response = await mockApi.role.deleteRole(role.id)
            if (response.data.success) {
                message.success('删除角色成功')
                loadRoles()
            }
        } catch (error) {
            message.error('删除角色失败')
            console.error('Delete role error:', error)
        }
    }

    /**
     * 处理表单提交
     */
    const handleFormSubmit = async (values: RoleFormData) => {
        try {
            let response
            if (editingRole) {
                // 编辑角色
                response = await mockApi.role.updateRole(editingRole.id, values)
            } else {
                // 新建角色
                response = await mockApi.role.createRole(values)
            }

            if (response.data.success) {
                message.success(editingRole ? '更新角色成功' : '创建角色成功')
                setModalVisible(false)
                loadRoles()
            }
        } catch (error) {
            message.error(editingRole ? '更新角色失败' : '创建角色失败')
            console.error('Submit role error:', error)
        }
    }


    /**
     * 表格列定义
     */
    const columns = [
        {
            title: '角色信息',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text: string, record: Role) => (
                <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>编码: {record.code}</div>
                </div>
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 250,
            render: (text?: string) => text || '-',
        },

        {
            title: '用户数量',
            dataIndex: 'userCount',
            key: 'userCount',
            width: 100,
            align: 'center' as const,
            render: (count?: number) => <Tag color='green'>{count || 0}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: string) => {
                const statusInfo = roleStatusMap[status as keyof typeof roleStatusMap]
                return <Badge status={statusInfo.color as any} text={statusInfo.text} />
            },
        },
        {
            title: '排序',
            dataIndex: 'sortOrder',
            key: 'sortOrder',
            width: 80,
            align: 'center' as const,
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
            render: (text: string, record: Role) => (
                <Space>
                    <Tooltip title='查看详情'>
                        <Button
                            type='text'
                            icon={<TeamOutlined />}
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

                    <Tooltip title={record.status === 'active' ? '禁用' : '启用'}>
                        <Switch
                            checked={record.status === 'active'}
                            onChange={() => handleStatusToggle(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title='确定要删除这个角色吗？'
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
        <div className='role-settings'>
            {/* 统计卡片 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title='角色总数'
                            value={stats.totalRoles}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title='启用角色'
                            value={stats.activeRoles}
                            prefix={<UnlockOutlined />}
                        />
                    </Card>
                </Col>

            </Row>

            <Card>
                {/* 搜索和操作区域 */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                        <Search
                            placeholder='搜索角色名称、编码'
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
                            <Option value='active'>启用</Option>
                            <Option value='disabled'>禁用</Option>
                        </Select>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={loadRoles}>
                                刷新
                            </Button>
                            <Button type='primary' icon={<PlusOutlined />} onClick={handleCreate}>
                                新建角色
                            </Button>
                        </Space>
                    </Col>
                </Row>

                {/* 角色表格 */}
                <Table
                    rowKey='id'
                    loading={loading}
                    columns={columns}
                    dataSource={roles}
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
                    scroll={{ x: 1200 }}
                />
            </Card>

            {/* 角色表单模态框 */}
            <Modal
                title={editingRole ? '编辑角色' : '新建角色'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <RoleForm
                    initialValues={editingRole || undefined}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setModalVisible(false)}
                />
            </Modal>


            {/* 角色详情抽屉 */}
            <Drawer
                title='角色详情'
                placement='right'
                width={600}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
            >
                {selectedRole && (
                    <>
                        <Alert
                            message='角色信息'
                            description={`角色编码: ${selectedRole.code}`}
                            type='info'
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label='角色名称'>
                                {selectedRole.name}
                            </Descriptions.Item>
                            <Descriptions.Item label='角色编码'>
                                {selectedRole.code}
                            </Descriptions.Item>
                            <Descriptions.Item label='描述'>
                                {selectedRole.description || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label='状态'>
                                <Badge
                                    status={roleStatusMap[selectedRole.status].color as any}
                                    text={roleStatusMap[selectedRole.status].text}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label='排序'>
                                {selectedRole.sortOrder}
                            </Descriptions.Item>

                            <Descriptions.Item label='用户数量'>
                                <Tag color='green'>{selectedRole.userCount || 0}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='创建时间'>
                                {formatDate(selectedRole.createdAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label='更新时间'>
                                {formatDate(selectedRole.updatedAt)}
                            </Descriptions.Item>
                        </Descriptions>


                    </>
                )}
            </Drawer>
        </div>
    )
}

export default RoleSettings
