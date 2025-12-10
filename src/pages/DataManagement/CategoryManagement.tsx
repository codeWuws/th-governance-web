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
    Row,
    Col,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { CategoryRecord } from '@/types'
import { dataManagementService } from '@/services/dataManagementService'

const { Title } = Typography
const { Option } = Select
const { TextArea, Search } = Input

const CategoryManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<CategoryRecord[]>([])
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<CategoryRecord | null>(null)
    const [form] = Form.useForm()
    const [searchForm] = Form.useForm()

    // 搜索条件
    const [searchParams, setSearchParams] = useState<{
        condition?: string
        categoryName?: string
        categoryCode?: string
        categoryStatus?: number
        sortField?: string
        sortOrder?: 'asc' | 'desc'
    }>({
        sortField: 'create_time',
        sortOrder: 'desc',
    })

    useEffect(() => {
        fetchData()
    }, [currentPage, pageSize, searchParams])

    // 获取数据
    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await dataManagementService.getCategoryPage({
                condition: searchParams.condition,
                pageNum: currentPage,
                pageSize: pageSize,
                sortField: searchParams.sortField,
                sortOrder: searchParams.sortOrder,
                categoryName: searchParams.categoryName,
                categoryCode: searchParams.categoryCode,
                categoryStatus: searchParams.categoryStatus,
            })
            if (response.code === 0) {
                setData(response.data.records)
                setTotal(Number(response.data.total))
            } else {
                message.error(response.msg || '获取数据失败')
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : '获取数据失败')
        } finally {
            setLoading(false)
        }
    }

    // 新增
    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            id: 0,
            categoryStatus: 1,
        })
        setModalVisible(true)
    }

    // 编辑
    const handleEdit = async (record: CategoryRecord) => {
        try {
            setLoading(true)
            const response = await dataManagementService.getCategoryDetail(record.id)
            if (response.code === 0) {
                setEditingRecord(response.data)
                form.setFieldsValue({
                    id: response.data.id,
                    categoryName: response.data.categoryName,
                    categoryCode: response.data.categoryCode,
                    categoryStatus: response.data.categoryStatus,
                    remark: response.data.remark,
                })
                setModalVisible(true)
            } else {
                message.error(response.msg || '获取详情失败')
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : '获取详情失败')
        } finally {
            setLoading(false)
        }
    }

    // 删除
    const handleDelete = async (id: number) => {
        try {
            const response = await dataManagementService.deleteCategory(id)
            if (response.code === 0) {
                message.success('删除成功')
                // 如果当前页没有数据了，且不是第一页，则跳转到上一页
                if (data.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1)
                } else {
                    fetchData()
                }
            } else {
                message.error(response.msg || '删除失败')
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : '删除失败')
        }
    }

    // 保存（新增/编辑）
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            const params = {
                id: values.id || 0,
                categoryName: values.categoryName,
                categoryCode: values.categoryCode,
                categoryStatus: values.categoryStatus,
                remark: values.remark || '',
            }

            if (editingRecord) {
                // 编辑
                const response = await dataManagementService.updateCategory(params)
                if (response.code === 0) {
                    message.success('更新成功')
                    setModalVisible(false)
                    form.resetFields()
                    setEditingRecord(null)
                    fetchData()
                } else {
                    message.error(response.msg || '更新失败')
                }
            } else {
                // 新增
                const response = await dataManagementService.addCategory(params)
                if (response.code === 0) {
                    message.success('创建成功')
                    setModalVisible(false)
                    form.resetFields()
                    setEditingRecord(null)
                    fetchData()
                } else {
                    message.error(response.msg || '创建失败')
                }
            }
        } catch (error) {
            console.error('表单验证失败:', error)
            if (error instanceof Error) {
                message.error(error.message)
            }
        }
    }

    // 取消
    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
        setEditingRecord(null)
    }

    // 获取状态标签颜色
    const getStatusColor = (status: number) => {
        return status === 1 ? 'success' : 'default'
    }

    // 获取状态文本
    const getStatusText = (status: number) => {
        return status === 1 ? '启用' : '停用'
    }

    // 分页变化处理
    const handleTableChange = (page: number, size: number) => {
        setCurrentPage(page)
        setPageSize(size)
    }

    // 搜索处理
    const handleSearch = () => {
        const values = searchForm.getFieldsValue()
        setSearchParams({
            condition: values.condition,
            categoryName: values.categoryName,
            categoryCode: values.categoryCode,
            categoryStatus: values.categoryStatus,
            sortField: searchParams.sortField || 'create_time',
            sortOrder: searchParams.sortOrder || 'desc',
        })
        setCurrentPage(1) // 重置到第一页
    }

    // 重置搜索
    const handleReset = () => {
        searchForm.resetFields()
        setSearchParams({
            sortField: 'create_time',
            sortOrder: 'desc',
        })
        setCurrentPage(1)
    }

    // 表格列配置
    const columns: ColumnsType<CategoryRecord> = [
        {
            title: '类别名称',
            dataIndex: 'categoryName',
            key: 'categoryName',
            width: 200,
            fixed: 'left' as const,
        },
        {
            title: '类别编码',
            dataIndex: 'categoryCode',
            key: 'categoryCode',
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
            dataIndex: 'categoryStatus',
            key: 'categoryStatus',
            width: 120,
            render: (status: number) => (
                <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
            ),
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <span title={text} style={{ display: 'block', maxWidth: '200px' }}>
                    {text || '-'}
                </span>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            fixed: 'right' as const,
            render: (_: unknown, record: CategoryRecord) => (
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

            {/* 搜索表单 */}
            <Card style={{ marginBottom: 16 }}>
                <Form form={searchForm} layout='vertical' onFinish={handleSearch}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item label='关键字段' name='condition'>
                                <Search
                                    placeholder='请输入类别名称或编码'
                                    allowClear
                                    onSearch={handleSearch}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label='类别名称' name='categoryName'>
                                <Input placeholder='请输入类别名称' allowClear />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label='类别编码' name='categoryCode'>
                                <Input placeholder='请输入类别编码' allowClear />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label='类别状态' name='categoryStatus'>
                                <Select placeholder='请选择状态' allowClear>
                                    <Option value={1}>启用</Option>
                                    <Option value={0}>停用</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Space>
                                <Button type='primary' icon={<SearchOutlined />} onClick={handleSearch}>
                                    查询
                                </Button>
                                <Button onClick={handleReset}>重置</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Card>

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
                            total: total,
                            current: currentPage,
                            pageSize: pageSize,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            onChange: handleTableChange,
                            onShowSizeChange: handleTableChange,
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
                    initialValues={{ categoryStatus: 1 }}
                >
                    <Form.Item name='id' hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label='类别名称'
                        name='categoryName'
                        rules={[
                            { required: true, message: '请输入类别名称' },
                            { max: 50, message: '类别名称不能超过50个字符' },
                        ]}
                    >
                        <Input placeholder='请输入类别名称' />
                    </Form.Item>

                    <Form.Item
                        label='类别编码'
                        name='categoryCode'
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
                        name='categoryStatus'
                        rules={[{ required: true, message: '请选择类别状态' }]}
                    >
                        <Select placeholder='请选择类别状态'>
                            <Option value={1}>启用</Option>
                            <Option value={0}>停用</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label='备注'
                        name='remark'
                        rules={[{ max: 200, message: '备注不能超过200个字符' }]}
                    >
                        <TextArea
                            placeholder='请输入备注信息'
                            rows={4}
                            showCount
                            maxLength={200}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default CategoryManagement

