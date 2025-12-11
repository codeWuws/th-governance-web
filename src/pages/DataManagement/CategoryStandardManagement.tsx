import React, { useState, useEffect } from 'react'
import {
    Table,
    Button,
    Space,
    Card,
    Input,
    Select,
    Tag,
    message,
    Modal,
    Form,
    Popconfirm,
    Typography,
    Switch,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
    CategoryStandard,
    getCategoryStandards,
    updateCategoryStandards,
} from '@/services/categoryStandardService'

const { Search } = Input
const { Option } = Select
const { Title } = Typography

const CategoryStandardManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<CategoryStandard[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<CategoryStandard | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const result = await getCategoryStandards()
            setData(result)
        } catch (error) {
            message.error('获取数据失败')
        } finally {
            setLoading(false)
        }
    }

    // 过滤数据
    const filteredData = data.filter(item => {
        const matchesSearch =
            !searchText ||
            item.name.toLowerCase().includes(searchText.toLowerCase()) ||
            item.code.toLowerCase().includes(searchText.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchText.toLowerCase())
        const matchesStatus = !statusFilter || item.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            status: true, // Switch 使用 boolean，true 表示启用
        })
        setModalVisible(true)
    }

    const handleEdit = (record: CategoryStandard) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            status: record.status === 'active', // 将 'active'/'inactive' 转换为 boolean
        })
        setModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 300))
            const updatedData = data.filter(item => item.id !== id)
            setData(updatedData)
            // 更新共享数据
            updateCategoryStandards(updatedData)
            message.success('删除成功')
        } catch (error) {
            message.error('删除失败')
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            // 将 Switch 的 boolean 值转换为 'active'/'inactive'
            const formData = {
                ...values,
                status: values.status ? 'active' : 'inactive',
            }

            let updatedData: CategoryStandard[]
            if (editingRecord) {
                // 编辑
                updatedData = data.map(item =>
                    item.id === editingRecord.id
                        ? { ...item, ...formData, updateTime: new Date().toLocaleString() }
                        : item
                )
                message.success('更新成功')
            } else {
                // 新增
                const newRecord: CategoryStandard = {
                    ...formData,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    creator: '当前用户',
                }
                updatedData = [...data, newRecord]
                message.success('创建成功')
            }

            // 更新共享数据
            setData(updatedData)
            updateCategoryStandards(updatedData)

            setModalVisible(false)
            form.resetFields()
            setEditingRecord(null)
        } catch (error) {
            console.error('表单验证失败:', error)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
        setEditingRecord(null)
    }

    const columns: ColumnsType<CategoryStandard> = [
        {
            title: '类别名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: '类别编号',
            dataIndex: 'code',
            key: 'code',
            width: 150,
            render: (text: string) => (
                <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>
                    {text}
                </code>
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            width: 120,
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
            title: '操作',
            key: 'action',
            width: 150,
            fixed: 'right' as const,
            render: (_: unknown, record: CategoryStandard) => (
                <Space size='small'>
                    <Button
                        type='link'
                        icon={<EditOutlined />}
                        size='small'
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title='确定要删除这个类别标准吗？'
                        description='删除后无法恢复，请谨慎操作'
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

    return (
        <div style={{ padding: 0 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    类别标准管理
                </Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        刷新
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增类别标准
                    </Button>
                </Space>
            </div>

            <Card>
                <div style={{ marginBottom: 16 }}>
                    <Space wrap>
                        <Search
                            placeholder='搜索类别名称、编号或描述'
                            allowClear
                            onSearch={setSearchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                            prefix={<SearchOutlined />}
                        />
                        <Select
                            placeholder='状态筛选'
                            style={{ width: 120 }}
                            allowClear
                            value={statusFilter || undefined}
                            onChange={setStatusFilter}
                        >
                            <Option value='active'>启用</Option>
                            <Option value='inactive'>停用</Option>
                        </Select>
                    </Space>
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey={record => record.id}
                    scroll={{ x: 1200 }}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        defaultPageSize: 20,
                    }}
                />
            </Card>

            {/* 新增/编辑弹窗 */}
            <Modal
                title={editingRecord ? '编辑类别标准' : '新增类别标准'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{ status: true }}
                >
                    <Form.Item
                        name='name'
                        label='类别名称'
                        rules={[{ required: true, message: '请输入类别名称' }]}
                    >
                        <Input placeholder='请输入类别名称' />
                    </Form.Item>
                    <Form.Item
                        name='code'
                        label='类别编号'
                        rules={[{ required: true, message: '请输入类别编号' }]}
                    >
                        <Input placeholder='请输入类别编号' />
                    </Form.Item>
                    <Form.Item name='description' label='描述'>
                        <Input.TextArea rows={3} placeholder='请输入描述' maxLength={500} showCount />
                    </Form.Item>
                    <Form.Item name='status' label='状态' valuePropName='checked'>
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default CategoryStandardManagement
