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
    type CategoryStandard,
    CategoryStandardService,
    mapCategoryStandardRecordToModel,
    type CategoryStandardPageParams,
    type AddCategoryStandardRequest,
    type UpdateCategoryStandardRequest,
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
    // 筛选条件
    const [condition, setCondition] = useState('') // 关键字段模糊查询
    const [categoryName, setCategoryName] = useState('') // 类别名称
    const [categoryCode, setCategoryCode] = useState('') // 类别编码
    const [categoryStatus, setCategoryStatus] = useState<number | undefined>(undefined) // 类别状态
    const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    useEffect(() => {
        fetchData({ pageNum: 1, pageSize: pagination.pageSize })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * 从后端分页接口获取类别标准数据
     * @param options 重载查询参数（页码、页大小、各种筛选条件）
     */
    const fetchData = async (options?: {
        pageNum?: number
        pageSize?: number
        condition?: string | null
        categoryName?: string | null
        categoryCode?: string | null
        categoryStatus?: number | null
    }) => {
        const pageNum = options?.pageNum ?? pagination.current
        const pageSize = options?.pageSize ?? pagination.pageSize
        
        // 如果 options 中明确传入了值（包括 null），使用传入的值；否则使用状态变量
        // null 表示明确清空，应该使用 undefined
        const searchCondition = options?.condition !== undefined 
            ? (options.condition === null ? undefined : (options.condition.trim() || undefined))
            : (condition ? condition.trim() : undefined)
        
        const searchCategoryName = options?.categoryName !== undefined 
            ? (options.categoryName === null ? undefined : (options.categoryName.trim() || undefined))
            : (categoryName ? categoryName.trim() : undefined)
        
        const searchCategoryCode = options?.categoryCode !== undefined 
            ? (options.categoryCode === null ? undefined : (options.categoryCode.trim() || undefined))
            : (categoryCode ? categoryCode.trim() : undefined)
        
        const searchStatus = options?.categoryStatus !== undefined 
            ? (options.categoryStatus === null ? undefined : options.categoryStatus)
            : categoryStatus

        setLoading(true)
        try {
            const params: CategoryStandardPageParams = {
                pageNum,
                pageSize,
                sortField: 'create_time',
                sortOrder: 'desc',
                condition: searchCondition,
                categoryName: searchCategoryName,
                categoryCode: searchCategoryCode,
                categoryStatus: typeof searchStatus === 'number' ? searchStatus : undefined,
            }

            const response = await CategoryStandardService.getCategoryStandardPage(params)
            const { records, total, size, current } = response.data
            setData(records.map(mapCategoryStandardRecordToModel))
            setPagination({
                current: Number(current) || pageNum,
                pageSize: Number(size) || pageSize,
                total: Number(total) || 0,
            })
        } catch (error) {
            // 统一错误提示，优先展示后端/服务封装的错误信息
            const errMsg = error instanceof Error ? error.message : '获取类别标准列表失败'
            message.error(errMsg)
        } finally {
            setLoading(false)
        }
    }

    /**
     * 处理关键字段模糊查询
     */
    const handleConditionSearch = (value: string) => {
        const keyword = value.trim()
        setCondition(keyword)
        setPagination(prev => ({ ...prev, current: 1 }))
        // 如果 keyword 为空，明确传入 null 表示清空；否则传入实际值
        const conditionValue = keyword ? keyword : null
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            condition: conditionValue,
        })
    }

    /**
     * 处理类别名称筛选
     */
    const handleCategoryNameChange = (value: string) => {
        const keyword = value.trim()
        setCategoryName(keyword)
        setPagination(prev => ({ ...prev, current: 1 }))
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            categoryName: keyword || null, // 空字符串时传入 null
        })
    }

    /**
     * 处理类别编码筛选
     */
    const handleCategoryCodeChange = (value: string) => {
        const keyword = value.trim()
        setCategoryCode(keyword)
        setPagination(prev => ({ ...prev, current: 1 }))
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            categoryCode: keyword || null, // 空字符串时传入 null
        })
    }

    /**
     * 处理状态筛选
     */
    const handleStatusChange = (value: number | undefined) => {
        setCategoryStatus(value)
        setPagination(prev => ({ ...prev, current: 1 }))
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            categoryStatus: value ?? null, // undefined 时传入 null
        })
    }

    /**
     * 重置所有筛选条件
     */
    const handleResetFilters = () => {
        setCondition('')
        setCategoryName('')
        setCategoryCode('')
        setCategoryStatus(undefined)
        setPagination(prev => ({ ...prev, current: 1 }))
        // 明确传入 null 表示清空所有筛选条件
        void fetchData({
            pageNum: 1,
            pageSize: pagination.pageSize,
            condition: null,
            categoryName: null,
            categoryCode: null,
            categoryStatus: null,
        })
    }

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
            await CategoryStandardService.deleteCategoryStandard(id)
            message.success('删除成功')
            // 刷新列表（如果当前页没有数据了，回到上一页）
            const currentPageDataCount = data.length
            const nextPageNum =
                currentPageDataCount === 1 && pagination.current > 1
                    ? pagination.current - 1
                    : pagination.current
            setPagination(prev => ({ ...prev, current: nextPageNum }))
            void fetchData({
                pageNum: nextPageNum,
                pageSize: pagination.pageSize,
            })
        } catch (error) {
            // 错误信息已在服务层处理，这里只做兜底提示
            const errMsg = error instanceof Error ? error.message : '删除失败'
            message.error(errMsg)
        }
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            const { name, code, description, status } = values

            if (editingRecord) {
                // 编辑：调用修改接口
                const updateParams: UpdateCategoryStandardRequest = {
                    id: editingRecord.id,
                    categoryName: name,
                    categoryCode: code,
                    categoryStatus: status ? 1 : 0,
                    remark: description || undefined,
                }

                await CategoryStandardService.updateCategoryStandard(updateParams)
                message.success('修改成功')
            } else {
                // 新增：调用新增接口
                const addParams: AddCategoryStandardRequest = {
                    categoryName: name,
                    categoryCode: code,
                    categoryStatus: status ? 1 : 0,
                    remark: description || undefined,
                }

                await CategoryStandardService.addCategoryStandard(addParams)
                message.success('新增成功')
            }

            // 关闭弹窗并重置表单
            setModalVisible(false)
            form.resetFields()
            setEditingRecord(null)

            // 刷新列表（回到第一页，显示最新数据）
            setPagination(prev => ({ ...prev, current: 1 }))
            void fetchData({
                pageNum: 1,
                pageSize: pagination.pageSize,
            })
        } catch (error) {
            // 错误信息已在服务层处理，这里只做兜底提示
            const errMsg = error instanceof Error ? error.message : '操作失败'
            message.error(errMsg)
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
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() =>
                            fetchData({
                                pageNum: 1,
                                pageSize: pagination.pageSize,
                            })
                        }
                        loading={loading}
                    >
                        刷新
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增类别标准
                    </Button>
                </Space>
            </div>

            <Card>
                <div style={{ marginBottom: 16 }}>
                    <Space wrap size='middle'>
                        
                        <Input
                            placeholder='类别名称'
                            allowClear
                            value={categoryName}
                            onChange={e => handleCategoryNameChange(e.target.value)}
                            onClear={() => {
                                setCategoryName('')
                                setPagination(prev => ({ ...prev, current: 1 }))
                                void fetchData({
                                    pageNum: 1,
                                    pageSize: pagination.pageSize,
                                    categoryName: null,
                                })
                            }}
                            style={{ width: 200 }}
                            onPressEnter={e => {
                                const target = e.target as HTMLInputElement
                                handleCategoryNameChange(target.value)
                            }}
                        />
                        <Input
                            placeholder='类别编码'
                            allowClear
                            value={categoryCode}
                            onChange={e => handleCategoryCodeChange(e.target.value)}
                            onClear={() => {
                                setCategoryCode('')
                                setPagination(prev => ({ ...prev, current: 1 }))
                                void fetchData({
                                    pageNum: 1,
                                    pageSize: pagination.pageSize,
                                    categoryCode: null,
                                })
                            }}
                            style={{ width: 200 }}
                            onPressEnter={e => {
                                const target = e.target as HTMLInputElement
                                handleCategoryCodeChange(target.value)
                            }}
                        />
                        <Select
                            placeholder='状态筛选'
                            style={{ width: 120 }}
                            allowClear
                            value={categoryStatus}
                            onChange={handleStatusChange}
                        >
                            <Option value={1}>启用</Option>
                            <Option value={0}>停用</Option>
                        </Select>
                        <Button onClick={handleResetFilters}>重置</Button>
                    </Space>
                </div>
                <Table
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    rowKey={record => record.id}
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, pageSize) => {
                            setPagination(prev => ({
                                ...prev,
                                current: page,
                                pageSize,
                            }))
                            void fetchData({ pageNum: page, pageSize })
                        },
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
