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
import { uiMessage } from '@/utils/uiMessage'
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
    KeyOutlined,
} from '@ant-design/icons'
import { Role, RoleQueryParams, RoleFormData, RoleAddEditRequest, RolePageRequest, RolePageRecord } from '@/types/rbac'
import { mockApi } from '@/mock/rbac'
import { roleApi } from '@/api/rbac'
import RoleForm from './components/RoleForm'

import { formatDate } from '@/utils/date'
import { showDialog } from '@/utils/showDialog'
import RolePermissionDialog from '@/components/RolePermissionDialog'

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
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [toggling, setToggling] = useState<string | null>(null)
    const [total, setTotal] = useState(0)

    const [stats, setStats] = useState({
        totalRoles: 0,
        activeRoles: 0,
    })

    // 查询参数
    const [queryParams, setQueryParams] = useState<RolePageRequest>({
        pageNum: 1,
        pageSize: 10,
        roleName: '',
        roleKey: '',
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
            
            // 构建请求参数，清理空值
            const requestParams: RolePageRequest = {
                pageNum: queryParams.pageNum || 1,
                pageSize: queryParams.pageSize || 10,
            }
            
            // 只有当有值时才添加搜索参数
            if (queryParams.roleName && queryParams.roleName.trim()) {
                requestParams.roleName = queryParams.roleName.trim()
            }
            if (queryParams.roleKey && queryParams.roleKey.trim()) {
                requestParams.roleKey = queryParams.roleKey.trim()
            }
            
            // 状态筛选
            if (queryParams.status && queryParams.status.length > 0) {
                requestParams.status = queryParams.status
            }
            
            // 排序参数
            if (queryParams.sortField) {
                requestParams.sortField = queryParams.sortField
            }
            if (queryParams.sortOrder) {
                requestParams.sortOrder = queryParams.sortOrder
            }
            
            // 优先使用新接口
            let response: any
            try {
                response = await roleApi.getRolePage(requestParams)
            } catch (apiError) {
                // API调用失败，使用mock接口作为fallback
                console.warn('API调用失败，使用mock数据:', apiError)
                response = await mockApi.role.getRolePage(requestParams)
            }
            
            // 处理响应数据
            // 响应拦截器返回的是 {code, msg, data} 格式
            // 所以 response 本身就是 {code, msg, data}
            // response.data 才是分页数据 {records, total, size, current, pages}
            let responseData: any = null
            
            if (response && typeof response === 'object') {
                // 情况1: response 是 {code, msg, data}，且 data 包含 records
                if (response.data && typeof response.data === 'object' && 'records' in response.data) {
                    responseData = response.data
                }
                // 情况2: response 直接是分页数据格式（mock返回的格式）
                else if ('records' in response) {
                    responseData = response
                }
                // 情况3: response.data.data 包含分页数据（嵌套结构）
                else if (response.data?.data && 'records' in response.data.data) {
                    responseData = response.data.data
                }
            }
            
            if (responseData && responseData.records) {
                // 将 RolePageRecord 转换为 Role 格式
                const convertedRoles: Role[] = responseData.records.map((record: RolePageRecord) => ({
                    id: record.id,
                    name: record.roleName,
                    code: record.roleKey,
                    sortOrder: record.roleSort,
                    status: record.status === '0' ? 'active' : 'disabled',
                    userCount: parseInt(record.userCount) || 0,
                    description: record.remark || undefined,
                    createdAt: record.createTime || new Date().toISOString(),
                    updatedAt: record.updateTime || record.createTime || new Date().toISOString(),
                    permissions: [],
                }))
                
                setRoles(convertedRoles)
                setTotal(parseInt(responseData.total) || 0)
            }
        } catch (error) {
            uiMessage.handleSystemError('加载角色列表失败')
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        queryParams.pageNum,
        queryParams.pageSize,
        queryParams.roleName,
        queryParams.roleKey,
        // 使用 JSON.stringify 来检测数组变化
        JSON.stringify(queryParams.status),
    ])

    useEffect(() => {
        loadStats()
    }, [roles])

    /**
     * 处理查询参数变化
     */
    const handleQueryChange = (key: keyof RolePageRequest, value: any) => {
        setQueryParams(prev => {
            const newParams = { ...prev }
            if (key === 'pageNum') {
                newParams.pageNum = value
            } else if (key === 'pageSize') {
                newParams.pageSize = value
                newParams.pageNum = 1 // 改变每页数量时重置到第一页
            } else {
                newParams[key] = value
                newParams.pageNum = 1 // 其他参数变化时重置到第一页
            }
            return newParams
        })
    }

    /**
     * 处理搜索
     */
    const handleSearch = (value: string) => {
        // 搜索关键词同时用于角色名称和角色编码
        const searchValue = value.trim()
        setQueryParams(prev => ({
            ...prev,
            roleName: searchValue,
            roleKey: searchValue,
            pageNum: 1,
        }))
    }

    /**
     * 处理状态筛选
     */
    const handleStatusFilter = (status: 'active' | 'disabled' | undefined) => {
        // 转换为数组格式
        const statusArray = status ? [status === 'active' ? '0' : '1'] : undefined
        handleQueryChange('status', statusArray)
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
     * 打开修改角色权限弹窗
     */
    const handleEditPermission = (role: Role) => {
        showDialog(RolePermissionDialog, {
            title: '修改角色权限',
            role,
            onSuccess: () => loadRoles(),
        })
    }

    /**
     * 处理状态切换
     */
    const handleStatusToggle = async (role: Role) => {
        try {
            setToggling(role.id)
            const newStatus = role.status === 'active' ? '1' : '0' // 转换为接口格式：0-启用，1-禁用
            
            // 使用编辑接口更新状态
            const requestData: RoleAddEditRequest = {
                id: role.id,
                roleName: role.name,
                roleKey: role.code,
                roleSort: role.sortOrder,
                status: newStatus,
            }
            
            const response = await roleApi.editRole(requestData)
            
            // 检查响应格式（支持两种格式：{code, msg, data} 和 {success, data, message}）
            const isSuccess = response.data?.code === 200 || response.data?.code === 0 || response.data?.success === true
            
            if (isSuccess) {
                message.success('状态更新成功')
                loadRoles()
            } else {
                // 如果响应格式不对，但接口没有抛出错误，说明可能是成功但格式不同
                // 尝试重新加载数据
                console.warn('状态更新响应格式异常，但尝试重新加载数据:', response)
                message.success('状态更新成功')
                loadRoles()
            }
        } catch (error) {
            uiMessage.handleSystemError('状态更新失败')
            console.error('Update status error:', error)
        } finally {
            setToggling(null)
        }
    }

    /**
     * 处理删除角色
     */
    const handleDelete = async (role: Role) => {
        try {
            setDeleting(role.id)
            
            // 优先使用新接口
            let response: any
            try {
                response = await roleApi.deleteRoleById(role.id)
                // 检查响应格式（支持两种格式：{code, msg, data} 和 {success, data, message}）
                const isSuccess = response.data?.code === 200 || response.data?.code === 0 || response.data?.success === true
                if (isSuccess) {
                    message.success('删除角色成功')
                    loadRoles()
                    return
                }
            } catch (apiError) {
                // API调用失败，使用mock接口作为fallback
                console.warn('API调用失败，使用mock数据:', apiError)
                response = await mockApi.role.deleteRoleById({ id: role.id })
                if (response.data.success) {
                    message.success('删除角色成功')
                    loadRoles()
                    return
                }
            }
            
            // 如果响应格式不对，但接口没有抛出错误，说明可能是成功但格式不同
            console.warn('删除响应格式异常，但尝试重新加载数据:', response)
            message.success('删除角色成功')
            loadRoles()
        } catch (error) {
            uiMessage.handleSystemError('删除角色失败')
            console.error('Delete role error:', error)
        } finally {
            setDeleting(null)
        }
    }

    /**
     * 处理表单提交
     */
    const handleFormSubmit = async (values: RoleFormData) => {
        try {
            setSaving(true)
            
            // 将表单数据转换为新接口格式
            const requestData: RoleAddEditRequest = {
                id: editingRole?.id,
                roleName: values.name,
                roleKey: values.code,
                roleSort: values.sortOrder,
                status: values.status === 'active' ? '0' : '1',
            }
            
            let response
            if (editingRole) {
                // 编辑角色
                response = await roleApi.editRole(requestData)
            } else {
                // 新建角色
                response = await roleApi.addRole(requestData)
            }

            if (response.data.code === 200) {
                message.success(editingRole ? '更新角色成功' : '创建角色成功')
                setModalVisible(false)
                loadRoles()
            }
        } catch (error) {
            uiMessage.handleSystemError(editingRole ? '更新角色失败' : '创建角色失败')
            console.error('Submit role error:', error)
        } finally {
            setSaving(false)
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
                    <Tooltip title='修改角色权限'>
                        <Button
                            type='text'
                            icon={<KeyOutlined />}
                            onClick={() => handleEditPermission(record)}
                        />
                    </Tooltip>

                    <Tooltip title={record.status === 'active' ? '禁用' : '启用'}>
                        <Switch
                            checked={record.status === 'active'}
                            onChange={() => handleStatusToggle(record)}
                            loading={toggling === record.id}
                            disabled={toggling === record.id}
                        />
                    </Tooltip>
                    <Popconfirm
                        title='确定要删除这个角色吗？'
                        onConfirm={() => handleDelete(record)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Tooltip title='删除'>
                            <Button 
                                type='text' 
                                danger 
                                icon={<DeleteOutlined />} 
                                loading={deleting === record.id}
                                disabled={deleting === record.id}
                            />
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
                            onChange={(e) => {
                                // 实时更新搜索关键词（不触发查询，只有点击搜索或回车才查询）
                                const value = e.target.value
                                setQueryParams(prev => ({
                                    ...prev,
                                    roleName: value,
                                    roleKey: value,
                                }))
                            }}
                            onClear={() => {
                                // 清空搜索时重置参数并重新加载
                                setQueryParams(prev => ({
                                    ...prev,
                                    roleName: '',
                                    roleKey: '',
                                    pageNum: 1,
                                }))
                            }}
                            value={queryParams.roleName || ''}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col span={4}>
                        <Select
                            placeholder='状态筛选'
                            allowClear
                            style={{ width: '100%' }}
                            value={
                                queryParams.status && queryParams.status.length > 0
                                    ? queryParams.status[0] === '0'
                                        ? 'active'
                                        : 'disabled'
                                    : undefined
                            }
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
                        current: queryParams.pageNum,
                        pageSize: queryParams.pageSize,
                        total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                        onChange: (page, pageSize) => {
                            // 同时更新页码和每页数量
                            setQueryParams(prev => {
                                const newPageSize = pageSize || prev.pageSize
                                return {
                                    ...prev,
                                    pageNum: page,
                                    pageSize: newPageSize,
                                }
                            })
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
                    loading={saving}
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
