import React, { useState } from 'react'
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Switch,
    Tag,
    Popconfirm,
    Row,
    Col,
    Card,
    Transfer,
    Descriptions,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
    selectRoles,
    selectRoleLoading,
    addRole,
    updateRole,
    deleteRole,
    updateRoleStatus,
    assignUsersToRole,
    type SystemRole,
} from '../../../store/slices/systemRoleSlice'
import { selectActiveUsers } from '../../../store/slices/systemUserSlice'
import type { ColumnsType } from 'antd/es/table'
import type { TransferProps } from 'antd/es/transfer'
import { logger } from '../../../utils/logger'
import uiMessage from '@/utils/uiMessage'

const { Search } = Input
const { TextArea } = Input

/**
 * 角色设置页面组件
 * 提供角色的增删改查和人员分配功能
 */
const RoleSettings: React.FC = () => {
    const dispatch = useAppDispatch()
    const roles = useAppSelector(selectRoles)
    const loading = useAppSelector(selectRoleLoading)
    const users = useAppSelector(selectActiveUsers)

    const [isModalVisible, setIsModalVisible] = useState(false)
    const [isUserModalVisible, setIsUserModalVisible] = useState(false)
    const [editingRole, setEditingRole] = useState<SystemRole | null>(null)
    const [assigningRole, setAssigningRole] = useState<SystemRole | null>(null)
    const [searchText, setSearchText] = useState('')
    const [form] = Form.useForm()

    // 过滤角色数据
    const filteredRoles = roles.filter(
        role =>
            role.name.toLowerCase().includes(searchText.toLowerCase()) ||
            role.code.toLowerCase().includes(searchText.toLowerCase()) ||
            role.description.toLowerCase().includes(searchText.toLowerCase())
    )

    // 处理编辑角色
    const handleEdit = (role: SystemRole) => {
        setEditingRole(role)
        setIsModalVisible(true)
        form.setFieldsValue(role)
    }

    // 处理删除角色
    const handleDelete = (id: string) => {
        dispatch(deleteRole(id))
        uiMessage.success('角色删除成功')
    }

    // 处理状态变更
    const handleStatusChange = (id: string, checked: boolean) => {
        dispatch(
            updateRoleStatus({
                id,
                status: checked ? 'active' : 'inactive',
            })
        )
        uiMessage.success(`角色${checked ? '启用' : '禁用'}成功`)
    }

    // 处理分配用户
    const handleAssignUsers = (role: SystemRole) => {
        setAssigningRole(role)
        setIsUserModalVisible(true)
    }

    // 表格列配置
    const columns: ColumnsType<SystemRole> = [
        {
            title: '角色名称',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            render: text => (
                <Space>
                    <TeamOutlined />
                    {text}
                </Space>
            ),
        },
        {
            title: '角色编码',
            dataIndex: 'code',
            key: 'code',
            width: 150,
            render: text => <Tag color='geekblue'>{text}</Tag>,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: '用户数量',
            dataIndex: 'userIds',
            key: 'userCount',
            width: 100,
            render: (userIds: string[]) => <Tag color='green'>{userIds.length}人</Tag>,
        },
        {
            title: '权限数量',
            dataIndex: 'permissionIds',
            key: 'permissionCount',
            width: 100,
            render: (permissionIds: string[]) => <Tag color='blue'>{permissionIds.length}项</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string, record: SystemRole) => (
                <Switch
                    checked={status === 'active'}
                    onChange={checked => handleStatusChange(record.id, checked)}
                    checkedChildren='启用'
                    unCheckedChildren='禁用'
                />
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: text => new Date(text).toLocaleString(),
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button
                        type='link'
                        icon={<UserOutlined />}
                        onClick={() => handleAssignUsers(record)}
                        size='small'
                    >
                        分配人员
                    </Button>
                    <Button
                        type='link'
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        size='small'
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title='确定要删除这个角色吗？'
                        onConfirm={() => handleDelete(record.id)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Button type='link' danger icon={<DeleteOutlined />} size='small'>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    // 处理添加角色
    const handleAdd = () => {
        setEditingRole(null)
        setIsModalVisible(true)
        form.resetFields()
    }

    // 处理表单提交
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()

            if (editingRole) {
                // 更新角色
                dispatch(
                    updateRole({
                        ...editingRole,
                        ...values,
                    })
                )
                uiMessage.success('角色更新成功')
            } else {
                // 添加角色
                dispatch(
                    addRole({
                        ...values,
                        permissionIds: [],
                        userIds: [],
                    })
                )
                uiMessage.success('角色添加成功')
            }

            setIsModalVisible(false)
            form.resetFields()
        } catch (error) {
            logger.error('表单验证失败:', error instanceof Error ? error : new Error(String(error)))
        }
    }

    // 处理取消
    const handleCancel = () => {
        setIsModalVisible(false)
        form.resetFields()
        setEditingRole(null)
    }

    // 处理用户分配
    const handleUserAssign = (
        targetKeys: React.Key[],
        _direction: unknown,
        _moveKeys: React.Key[]
    ) => {
        if (assigningRole) {
            dispatch(
                assignUsersToRole({
                    roleId: assigningRole.id,
                    userIds: targetKeys.map(key => String(key)),
                })
            )
            uiMessage.success('用户分配成功')
            setIsUserModalVisible(false)
            setAssigningRole(null)
        }
    }

    // 处理用户分配取消
    const handleUserAssignCancel = () => {
        setIsUserModalVisible(false)
        setAssigningRole(null)
    }

    // 准备穿梭框数据
    const transferData: TransferProps['dataSource'] = users.map(user => ({
        key: user.id,
        title: `${user.realName} (${user.username})`,
        description: `${user.department} - ${user.position}`,
    }))

    return (
        <div className='role-settings'>
            <Card title='角色管理' size='small'>
                {/* 操作栏 */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col flex='auto'>
                        <Search
                            placeholder='搜索角色名称、编码或描述'
                            allowClear
                            enterButton={<SearchOutlined />}
                            size='middle'
                            onSearch={setSearchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ maxWidth: 400 }}
                        />
                    </Col>
                    <Col>
                        <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                            添加角色
                        </Button>
                    </Col>
                </Row>

                {/* 角色表格 */}
                <Table
                    columns={columns}
                    dataSource={filteredRoles}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        total: filteredRoles.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            {/* 添加/编辑角色模态框 */}
            <Modal
                title={editingRole ? '编辑角色' : '添加角色'}
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={handleCancel}
                width={600}
                okText='确定'
                cancelText='取消'
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{
                        status: 'active',
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label='角色名称'
                                name='name'
                                rules={[
                                    { required: true, message: '请输入角色名称' },
                                    { min: 2, message: '角色名称至少2个字符' },
                                ]}
                            >
                                <Input placeholder='请输入角色名称' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label='角色编码'
                                name='code'
                                rules={[
                                    { required: true, message: '请输入角色编码' },
                                    {
                                        pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                                        message:
                                            '编码只能包含字母、数字和下划线，且以字母或下划线开头',
                                    },
                                ]}
                            >
                                <Input placeholder='请输入角色编码' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label='角色描述'
                        name='description'
                        rules={[{ required: true, message: '请输入角色描述' }]}
                    >
                        <TextArea rows={3} placeholder='请输入角色描述' maxLength={200} showCount />
                    </Form.Item>

                    <Form.Item
                        label='状态'
                        name='status'
                        valuePropName='checked'
                        getValueFromEvent={checked => (checked ? 'active' : 'inactive')}
                        getValueProps={value => ({ checked: value === 'active' })}
                    >
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 分配用户模态框 */}
            <Modal
                title={`分配用户 - ${assigningRole?.name}`}
                open={isUserModalVisible}
                onOk={() => {
                    // TODO: 实现用户分配逻辑
                }}
                onCancel={handleUserAssignCancel}
                width={800}
                footer={null}
            >
                {assigningRole && (
                    <>
                        <Descriptions size='small' style={{ marginBottom: 16 }}>
                            <Descriptions.Item label='角色名称'>
                                {assigningRole.name}
                            </Descriptions.Item>
                            <Descriptions.Item label='角色编码'>
                                {assigningRole.code}
                            </Descriptions.Item>
                            <Descriptions.Item label='当前用户数'>
                                {assigningRole.userIds.length}人
                            </Descriptions.Item>
                        </Descriptions>

                        <Transfer
                            dataSource={transferData}
                            targetKeys={assigningRole.userIds}
                            onChange={handleUserAssign}
                            render={item => item.title}
                            titles={['可分配用户', '已分配用户']}
                            showSearch
                            listStyle={{
                                width: 300,
                                height: 400,
                            }}
                        />
                    </>
                )}
            </Modal>
        </div>
    )
}

export default RoleSettings
