import React, { useState } from 'react'
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    Tag,
    Popconfirm,
    Row,
    Col,
    Card,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
    selectUsers,
    selectUserLoading,
    addUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    type SystemUser,
} from '../../../store/slices/systemUserSlice'
import { selectActiveRoles } from '../../../store/slices/systemRoleSlice'
import type { ColumnsType } from 'antd/es/table'
import { logger } from '../../../utils/logger'
import uiMessage from '@/utils/uiMessage'

const { Option } = Select
const { Search } = Input

/**
 * 用户设置页面组件
 * 提供用户的增删改查功能
 */
const UserSettings: React.FC = () => {
    const dispatch = useAppDispatch()
    const users = useAppSelector(selectUsers)
    const loading = useAppSelector(selectUserLoading)
    const roles = useAppSelector(selectActiveRoles)

    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
    const [searchText, setSearchText] = useState('')
    const [form] = Form.useForm()

    // 过滤用户数据
    const filteredUsers = users.filter(
        user =>
            user.username.toLowerCase().includes(searchText.toLowerCase()) ||
            user.realName.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase())
    )

    // 处理编辑用户
    const handleEdit = (user: SystemUser) => {
        setEditingUser(user)
        setIsModalVisible(true)
        form.setFieldsValue(user)
    }

    // 处理删除用户
    const handleDelete = (id: string) => {
        dispatch(deleteUser(id))
        uiMessage.success('用户删除成功')
    }

    // 处理状态变更
    const handleStatusChange = (id: string, checked: boolean) => {
        dispatch(
            updateUserStatus({
                id,
                status: checked ? 'active' : 'inactive',
            })
        )
        uiMessage.success(`用户${checked ? '启用' : '禁用'}成功`)
    }

    // 表格列配置
    const columns: ColumnsType<SystemUser> = [
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
            width: 120,
            render: text => (
                <Space>
                    <UserOutlined />
                    {text}
                </Space>
            ),
        },
        {
            title: '真实姓名',
            dataIndex: 'realName',
            key: 'realName',
            width: 120,
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
            width: 130,
        },
        {
            title: '部门',
            dataIndex: 'department',
            key: 'department',
            width: 120,
        },
        {
            title: '职位',
            dataIndex: 'position',
            key: 'position',
            width: 120,
        },
        {
            title: '角色',
            dataIndex: 'roleIds',
            key: 'roleIds',
            width: 150,
            render: (roleIds: string[]) => (
                <Space wrap>
                    {roleIds.map(roleId => {
                        const role = roles.find(r => r.id === roleId)
                        return role ? (
                            <Tag key={roleId} color='blue'>
                                {role.name}
                            </Tag>
                        ) : null
                    })}
                </Space>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string, record: SystemUser) => (
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
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button
                        type='link'
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        size='small'
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title='确定要删除这个用户吗？'
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

    // 处理添加用户
    const handleAdd = () => {
        setEditingUser(null)
        setIsModalVisible(true)
        form.resetFields()
    }

    // 处理表单提交
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()

            if (editingUser) {
                // 更新用户
                dispatch(
                    updateUser({
                        ...editingUser,
                        ...values,
                    })
                )
                uiMessage.success('用户更新成功')
            } else {
                // 添加用户
                dispatch(addUser(values))
                uiMessage.success('用户添加成功')
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
        setEditingUser(null)
    }

    return (
        <div className='user-settings'>
            <Card title='用户管理' size='small'>
                {/* 操作栏 */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col flex='auto'>
                        <Search
                            placeholder='搜索用户名、姓名或邮箱'
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
                            添加用户
                        </Button>
                    </Col>
                </Row>

                {/* 用户表格 */}
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1400 }}
                    pagination={{
                        total: filteredUsers.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            {/* 添加/编辑用户模态框 */}
            <Modal
                title={editingUser ? '编辑用户' : '添加用户'}
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
                        roleIds: [],
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label='用户名'
                                name='username'
                                rules={[
                                    { required: true, message: '请输入用户名' },
                                    { min: 3, message: '用户名至少3个字符' },
                                ]}
                            >
                                <Input placeholder='请输入用户名' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label='真实姓名'
                                name='realName'
                                rules={[{ required: true, message: '请输入真实姓名' }]}
                            >
                                <Input placeholder='请输入真实姓名' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label='邮箱'
                                name='email'
                                rules={[
                                    { required: true, message: '请输入邮箱' },
                                    { type: 'email', message: '请输入有效的邮箱地址' },
                                ]}
                            >
                                <Input placeholder='请输入邮箱' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label='手机号'
                                name='phone'
                                rules={[
                                    { required: true, message: '请输入手机号' },
                                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                                ]}
                            >
                                <Input placeholder='请输入手机号' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label='部门'
                                name='department'
                                rules={[{ required: true, message: '请输入部门' }]}
                            >
                                <Input placeholder='请输入部门' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label='职位'
                                name='position'
                                rules={[{ required: true, message: '请输入职位' }]}
                            >
                                <Input placeholder='请输入职位' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label='角色'
                                name='roleIds'
                                rules={[{ required: true, message: '请选择角色' }]}
                            >
                                <Select mode='multiple' placeholder='请选择角色' allowClear>
                                    {roles.map(role => (
                                        <Option key={role.id} value={role.id}>
                                            {role.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label='状态'
                                name='status'
                                valuePropName='checked'
                                getValueFromEvent={checked => (checked ? 'active' : 'inactive')}
                                getValueProps={value => ({ checked: value === 'active' })}
                            >
                                <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    )
}

export default UserSettings
