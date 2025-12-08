import React, { useState, useEffect } from 'react'
import {
    Alert,
    Card,
    Table,
    Button,
    Space,
    Tag,
    Modal,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
    Typography,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Option } = Select

// 类别接口定义
interface Category {
    id: string
    name: string // 类别名称
    code: string // 类别编码
    status: 'active' | 'inactive' // 类别状态
    createTime: string // 创建时间
    updateTime: string // 更新时间
    creator: string // 创建人
}

// 模拟数据
const mockData: Category[] = [
    {
        id: '1',
        name: '科室分类',
        code: 'DEPT_001',
        status: 'active',
        createTime: '2024-01-10 09:00:00',
        updateTime: '2024-01-15 14:30:00',
        creator: '系统管理员',
    },
    {
        id: '2',
        name: '人员分类',
        code: 'PERSON_001',
        status: 'active',
        createTime: '2024-01-11 10:00:00',
        updateTime: '2024-01-16 16:45:00',
        creator: '系统管理员',
    },
    {
        id: '3',
        name: '疾病分类',
        code: 'DISEASE_001',
        status: 'inactive',
        createTime: '2024-01-12 11:00:00',
        updateTime: '2024-01-17 10:20:00',
        creator: '张医生',
    },
]

const CategoryManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<Category[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<Category | null>(null)
    const [form] = Form.useForm()

    useEffect(() => {
        fetchData()
    }, [])

    // 获取数据
    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockData)
        } catch (error) {
            message.error('获取数据失败')
        } finally {
            setLoading(false)
        }
    }

    // 新增
    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            status: 'active',
        })
        setModalVisible(true)
    }

    // 编辑
    const handleEdit = (record: Category) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

    // 删除
    const handleDelete = async (id: string) => {
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 300))
            setData(data.filter(item => item.id !== id))
            message.success('删除成功')
        } catch (error) {
            message.error('删除失败')
        }
    }

    // 保存（新增/编辑）
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()

            if (editingRecord) {
                // 编辑
                setData(
                    data.map(item =>
                        item.id === editingRecord.id
                            ? {
                                  ...item,
                                  ...values,
                                  updateTime: new Date().toLocaleString('zh-CN', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: false,
                                  }).replace(/\//g, '-'),
                              }
                            : item
                    )
                )
                message.success('更新成功')
            } else {
                // 新增
                const newRecord: Category = {
                    ...values,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }).replace(/\//g, '-'),
                    updateTime: new Date().toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }).replace(/\//g, '-'),
                    creator: '当前用户',
                }
                setData([...data, newRecord])
                message.success('创建成功')
            }

            setModalVisible(false)
            form.resetFields()
            setEditingRecord(null)
        } catch (error) {
            console.error('表单验证失败:', error)
        }
    }

    // 取消
    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
        setEditingRecord(null)
    }

    // 获取状态标签颜色
    const getStatusColor = (status: string) => {
        return status === 'active' ? 'success' : 'default'
    }

    // 获取状态文本
    const getStatusText = (status: string) => {
        return status === 'active' ? '启用' : '停用'
    }

    // 表格列配置
    const columns: ColumnsType<Category> = [
        {
            title: '类别名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            fixed: 'left' as const,
        },
        {
            title: '类别编码',
            dataIndex: 'code',
            key: 'code',
            width: 150,
            render: (text: string) => (
                <code
                    style={{
                        background: '#f5f5f5',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                    }}
                >
                    {text}
                </code>
            ),
        },
        {
            title: '类别状态',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 180,
        },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
            width: 180,
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            width: 120,
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            fixed: 'right' as const,
            render: (_: unknown, record: Category) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title='确定要删除这个类别吗？'
                        description='删除后无法恢复，请谨慎操作'
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

    return (
        <div style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    类别管理
                </Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增类别
                    </Button>
                </Space>
            </div>
            <Alert
                message='类别管理'
                description='管理数据类别信息，支持创建、编辑、删除等操作。类别名称列固定在左侧，方便查看。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Card
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    minHeight: 0,
                }}
                bodyStyle={{
                    padding: 16,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    minHeight: 0,
                }}
            >
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={data}
                        rowKey='id'
                        loading={loading}
                        scroll={{
                            x: 1200,
                            y: 'calc(100vh - 380px)', // 动态计算高度，确保不超出页面
                        }}
                        pagination={{
                            total: data.length,
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                        }}
                        size='middle'
                    />
                </div>
            </Card>

            {/* 新增/编辑弹窗 */}
            <Modal
                title={editingRecord ? '编辑类别' : '新增类别'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{ status: 'active' }}
                >
                    <Form.Item
                        label='类别名称'
                        name='name'
                        rules={[
                            { required: true, message: '请输入类别名称' },
                            { max: 50, message: '类别名称不能超过50个字符' },
                        ]}
                    >
                        <Input placeholder='请输入类别名称' />
                    </Form.Item>

                    <Form.Item
                        label='类别编码'
                        name='code'
                        rules={[
                            { required: true, message: '请输入类别编码' },
                            {
                                pattern: /^[A-Z_][A-Z0-9_]*$/,
                                message: '类别编码只能包含大写字母、数字和下划线，且必须以字母或下划线开头',
                            },
                            { max: 50, message: '类别编码不能超过50个字符' },
                        ]}
                    >
                        <Input placeholder='请输入类别编码，如：DEPT_001' />
                    </Form.Item>

                    <Form.Item
                        label='类别状态'
                        name='status'
                        rules={[{ required: true, message: '请选择类别状态' }]}
                    >
                        <Select placeholder='请选择类别状态'>
                            <Option value='active'>启用</Option>
                            <Option value='inactive'>停用</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default CategoryManagement

