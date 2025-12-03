import { dataGovernanceService } from '@/services/dataGovernanceService'
import type { DbConnection } from '@/types'
import {
    CheckCircleOutlined,
    DatabaseOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'

const { Title } = Typography
const { Option } = Select

const DatabaseConnection: React.FC = () => {
    const [connections, setConnections] = useState<DbConnection[]>([])
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [editingConnection, setEditingConnection] = useState<DbConnection | null>(null)
    const [loading, setLoading] = useState(false)
    const [tableLoading, setTableLoading] = useState(false)
    const [testingConnections, setTestingConnections] = useState<Record<string, boolean>>({})
    const [statusStats, setStatusStats] = useState({
        totalConnections: 0,
        connectedCount: 0,
        abnormalCount: 0,
    })
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })
    const [form] = Form.useForm()

    // 获取数据库连接列表
    const fetchDbConnections = async (pageNo = 1, pageSize = 10) => {
        try {
            setTableLoading(true)
            const result = await dataGovernanceService.getDbConnectionPage({
                pageNo,
                pageSize,
            })

            if (result.code === 200) {
                // 直接使用API返回的数据，不再进行格式转换
                setConnections(result.data.list || [])
                setPagination({
                    current: result.data.pageNo || pageNo,
                    pageSize: result.data.pageSize || pageSize,
                    total: result.data.total || 0,
                })

                // 计算状态统计
                const totalConnections = result.data.list?.length || 0
                const connectedCount =
                    result.data.list?.filter((conn: DbConnection) => conn.dbStatus === 1)
                        .length || 0
                const abnormalCount = totalConnections - connectedCount

                setStatusStats({
                    totalConnections,
                    connectedCount,
                    abnormalCount,
                })
            } else {
                uiMessage.error(result.msg || '获取数据库连接列表失败')
            }
        } catch (error) {
            logger.error(
                '获取数据库连接列表失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            uiMessage.error('获取数据库连接列表失败')
        } finally {
            setTableLoading(false)
        }
    }

    // 编辑连接
    const handleEdit = (connection: DbConnection) => {
        setEditingConnection(connection)
        form.setFieldsValue({
            connectionName: connection.connectionName,
            type: connection.dbType,
            host: connection.dbHost,
            port: connection.dbPort,
            database: connection.dbName,
            username: connection.dbUsername,
            password: connection.dbPassword || '', // 回显密码
            remark: connection.remark,
        })
        setIsModalVisible(true)
    }

    // 删除连接
    const handleDelete = async (id: string) => {
        try {
            // 获取当前用户，如果没有则使用默认值
            const updateUser = 'system' // 可以从 store 或 localStorage 获取实际用户
            const result = await dataGovernanceService.deleteDbConnection(id, updateUser)
            if (result.code === 200) {
                uiMessage.success('删除成功')
                await fetchDbConnections(pagination.current, pagination.pageSize)
            } else {
                uiMessage.error(result.message || '删除失败')
            }
        } catch (error) {
            logger.error('删除连接失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('删除失败')
        }
    }

    // 测试连接
    const handleTestConnection = async (id: string) => {
        try {
            setTestingConnections(prev => ({ ...prev, [id]: true }))
            const result = await dataGovernanceService.testDbConnection(id)

            if (result.code === 200) {
                uiMessage.success('连接测试成功')
                // 刷新列表以更新连接状态
                await fetchDbConnections(pagination.current, pagination.pageSize)
            } else {
                uiMessage.error(result.message || '连接测试失败')
            }
        } catch (error) {
            logger.error('测试连接失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('连接测试失败')
        } finally {
            setTestingConnections(prev => ({ ...prev, [id]: false }))
        }
    }

    // 页面初始化时获取数据库连接列表
    useEffect(() => {
        fetchDbConnections()
    }, [])

    // 数据库类型配置
    const dbTypeOptions = [
        { value: 'mysql', label: 'MySQL', port: 3306 },
        { value: 'postgresql', label: 'PostgreSQL', port: 5432 },
        { value: 'oracle', label: 'Oracle', port: 1521 },
        { value: 'sqlserver', label: 'SQL Server', port: 1433 },
    ]

    // 状态标签渲染
    const renderStatusTag = (status: string) => {
        const statusConfig = {
            connected: { color: 'success', icon: <CheckCircleOutlined />, text: '已连接' },
            disconnected: { color: 'default', icon: <ExclamationCircleOutlined />, text: '未连接' },
            error: { color: 'error', icon: <ExclamationCircleOutlined />, text: '连接异常' },
        }

        const config = statusConfig[status as keyof typeof statusConfig]
        return (
            <Tag color={config.color} icon={config.icon}>
                {config.text}
            </Tag>
        )
    }

    // 表格列配置
    const columns: ColumnsType<DbConnection> = [
        {
            title: '连接名称',
            dataIndex: 'connectionName',
            key: 'connectionName',
            width: 150,
        },
        {
            title: '数据库名称',
            dataIndex: 'dbName',
            key: 'dbName',
            width: 150,
        },
        {
            title: '数据库类型',
            dataIndex: 'dbType',
            key: 'dbType',
            width: 120,
            render: (type: string) => {
                const typeConfig = dbTypeOptions.find(opt => opt.value === type)
                return typeConfig?.label || type.toUpperCase()
            },
        },
        {
            title: '主机地址',
            dataIndex: 'dbHost',
            key: 'dbHost',
            width: 150,
        },
        {
            title: '端口',
            dataIndex: 'dbPort',
            key: 'dbPort',
            width: 80,
        },
        {
            title: '用户名',
            dataIndex: 'dbUsername',
            key: 'dbUsername',
            width: 100,
        },
        {
            title: '状态',
            dataIndex: 'dbStatus',
            key: 'dbStatus',
            width: 100,
            render: (status: number) => {
                const statusMap = new Map([
                    [1, 'connected'],
                    [2, 'error'],
                    [0, 'disconnected'],
                ])
                const statusText = statusMap.get(status) || 'disconnected'
                return renderStatusTag(statusText)
            },
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 180,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space size='middle'>
                    <Button
                        type='link'
                        size='small'
                        loading={testingConnections[record.id]}
                        onClick={() => handleTestConnection(record.id)}
                    >
                        测试连接
                    </Button>
                    <Button
                        type='link'
                        size='small'
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title='确定要删除这个数据库连接吗？'
                        onConfirm={() => handleDelete(record.id)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Button type='link' size='small' danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    // 处理新增连接
    const handleAdd = () => {
        setEditingConnection(null)
        form.resetFields()
        setIsModalVisible(true)
    }

    // 处理表单提交
    const handleSubmit = async () => {
        try {
            setLoading(true)
            const values = await form.validateFields()

            if (editingConnection) {
                // 编辑模式 - 调用 updateDbConnection 接口
                const connectionData = {
                    connectionName: values.connectionName,
                    dbType: values.type,
                    dbHost: values.host,
                    dbPort: values.port.toString(),
                    dbName: values.database,
                    dbUsername: values.username,
                    dbPassword: values.password,
                    dbStatus: 1, // 默认启用状态
                    remark: values.remark || '',
                    updateUser: 'current_user', // 这里应该从用户上下文获取
                }
                try {
                    const result = await dataGovernanceService.updateDbConnection(
                        editingConnection.id,
                        connectionData
                    )

                    if (result.code === 200) {
                        // 更新本地状态
                        setConnections(prev =>
                            prev.map(conn =>
                                conn.id === editingConnection.id ? { ...conn, ...values } : conn
                            )
                        )
                        uiMessage.success('数据库连接已更新')

                        // 重新获取列表以确保数据同步
                        await fetchDbConnections(pagination.current, pagination.pageSize)
                    } else {
                        uiMessage.error(result.message || '更新数据库连接失败')
                    }
                } catch (apiError) {
                    logger.error(
                        'API调用失败:',
                        apiError instanceof Error ? apiError : new Error(String(apiError))
                    )
                    uiMessage.error(
                        apiError instanceof Error ? apiError.message : '更新数据库连接失败'
                    )
                }
            } else {
                // 新增模式 - 调用 addDbConnection 接口
                const connectionData = {
                    connectionName: values.connectionName,
                    dbType: values.type,
                    dbHost: values.host,
                    dbPort: values.port.toString(),
                    dbName: values.database,
                    dbUsername: values.username,
                    dbPassword: values.password,
                    dbStatus: 1, // 默认启用状态
                    remark: values.remark || '',
                    createUser: 'current_user', // 这里应该从用户上下文获取
                }

                try {
                    const result = await dataGovernanceService.addDbConnection(connectionData)

                    if (result.code === 200) {
                        uiMessage.success('数据库连接已成功添加')

                        // 重新获取列表以确保数据同步
                        await fetchDbConnections(pagination.current, pagination.pageSize)
                    } else {
                        uiMessage.error(result.message || '添加数据库连接失败')
                    }
                } catch (apiError) {
                    logger.error(
                        'API调用失败:',
                        apiError instanceof Error ? apiError : new Error(String(apiError))
                    )
                    uiMessage.error(
                        apiError instanceof Error ? apiError.message : '添加数据库连接失败'
                    )
                }
            }

            setIsModalVisible(false)
            form.resetFields()
        } catch (error) {
            logger.error('表单验证失败:', error instanceof Error ? error : new Error(String(error)))
            uiMessage.error('表单验证失败，请检查输入信息')
        } finally {
            setLoading(false)
        }
    }

    // 处理数据库类型变化
    const handleDbTypeChange = (type: string) => {
        const typeConfig = dbTypeOptions.find(opt => opt.value === type)
        if (typeConfig) {
            form.setFieldsValue({ port: typeConfig.port })
        }
    }

    return (
        <div>
            <Title level={2} style={{ marginBottom: 24 }}>
                <DatabaseOutlined style={{ marginRight: 8 }} />
                数据源管理
            </Title>

            {/* 统计信息 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                                {statusStats.totalConnections}
                            </div>
                            <div style={{ color: '#666' }}>总连接数</div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                                {statusStats.connectedCount}
                            </div>
                            <div style={{ color: '#666' }}>已连接</div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                                {statusStats.abnormalCount}
                            </div>
                            <div style={{ color: '#666' }}>连接异常</div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* 连接列表 */}
            <Card
                title='数据库连接列表'
                extra={
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增连接
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={connections}
                    rowKey='id'
                    loading={tableLoading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                        onChange: (page, size) => {
                            fetchDbConnections(page, size)
                        },
                        onShowSizeChange: (_current, size) => {
                            fetchDbConnections(1, size)
                        },
                    }}
                    scroll={{ x: 1200 }}
                />
            </Card>

            {/* 新增/编辑连接弹窗 */}
            <Modal
                title={editingConnection ? '编辑数据库连接' : '新增数据库连接'}
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={() => {
                    setIsModalVisible(false)
                    form.resetFields()
                }}
                width={600}
                confirmLoading={loading}
                okText='确定'
                cancelText='取消'
            >
                <Form form={form} layout='vertical' initialValues={{ port: 3306 }}>
                    <Form.Item
                        name='connectionName'
                        label='连接名称'
                        rules={[{ required: true, message: '请输入连接名称' }]}
                    >
                        <Input placeholder='请输入连接名称' />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='type'
                                label='数据库类型'
                                rules={[{ required: true, message: '请选择数据库类型' }]}
                            >
                                <Select
                                    placeholder='请选择数据库类型'
                                    onChange={handleDbTypeChange}
                                >
                                    {dbTypeOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='port'
                                label='端口'
                                rules={[{ required: true, message: '请输入端口号' }]}
                            >
                                <Input type='number' placeholder='请输入端口号' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='host'
                        label='主机地址'
                        rules={[{ required: true, message: '请输入主机地址' }]}
                    >
                        <Input placeholder='请输入主机地址' />
                    </Form.Item>

                    <Form.Item
                        name='database'
                        label='数据库名'
                        rules={[{ required: true, message: '请输入数据库名' }]}
                    >
                        <Input placeholder='请输入数据库名' />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='username'
                                label='用户名'
                                rules={[{ required: true, message: '请输入用户名' }]}
                            >
                                <Input placeholder='请输入用户名' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='password'
                                label='密码'
                                rules={[{ required: true, message: '请输入密码' }]}
                            >
                                <Input.Password placeholder='请输入密码' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name='remark' label='备注'>
                        <Input.TextArea
                            placeholder='请输入备注信息（可选）'
                            rows={3}
                            maxLength={200}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default DatabaseConnection
