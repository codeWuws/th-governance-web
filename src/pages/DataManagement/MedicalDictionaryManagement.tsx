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
    Switch,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import { dataManagementService } from '@/services/dataManagementService'
import type { CategoryItem, MedicalDictPageParams, MedicalDictRecord } from '@/types'

const { Option } = Select

interface MedicalDictionary {
    id: string
    name: string
    code: string
    category: string
    version: string
    source: string
    description: string
    itemCount: number
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
}

const MedicalDictionaryManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<MedicalDictionary[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<MedicalDictionary | null>(null)
    const [form] = Form.useForm()
    const [categoryList, setCategoryList] = useState<CategoryItem[]>([])
    const [categoryListLoading, setCategoryListLoading] = useState(false)
    
    // 分页状态
    const [pagination, setPagination] = useState<{ current: number; pageSize: number; total: number }>({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    // 模拟数据
    const mockData: MedicalDictionary[] = [
        {
            id: '1',
            name: 'ICD-10 国际疾病分类',
            code: 'ICD10',
            category: '疾病分类',
            version: '2019',
            source: '世界卫生组织（WHO）',
            description: '国际疾病分类第十次修订本，用于疾病和健康状况的分类',
            itemCount: 69837,
            status: 'active',
            createTime: '2024-01-10 09:00:00',
            updateTime: '2024-02-15 14:30:00',
            creator: '系统管理员',
        },
        {
            id: '2',
            name: 'LOINC 检验项目代码',
            code: 'LOINC',
            category: '检验代码',
            version: '2.72',
            source: '美国Regenstrief医学研究所',
            description: '实验室检验和临床观察的通用代码系统',
            itemCount: 84567,
            status: 'active',
            createTime: '2024-01-12 10:30:00',
            updateTime: '2024-02-18 16:45:00',
            creator: '李医生',
        },
        {
            id: '3',
            name: 'SNOMED CT 医学术语集',
            code: 'SNOMED_CT',
            category: '医学术语',
            version: '2023-09',
            source: 'SNOMED International',
            description: '系统化医学术语集，用于临床信息的标准化表达',
            itemCount: 350000,
            status: 'active',
            createTime: '2024-01-15 11:00:00',
            updateTime: '2024-02-20 10:15:00',
            creator: '系统管理员',
        },
        {
            id: '4',
            name: '国家卫健委疾病分类编码',
            code: 'NHCC_DISEASE',
            category: '疾病分类',
            version: '2023',
            source: '国家卫生健康委员会',
            description: '中国国家卫生健康委员会发布的疾病分类编码标准',
            itemCount: 25000,
            status: 'active',
            createTime: '2024-01-18 14:20:00',
            updateTime: '2024-02-22 16:30:00',
            creator: '系统管理员',
        },
        {
            id: '5',
            name: '国家药监局药品编码',
            code: 'NMPA_DRUG',
            category: '药品代码',
            version: '2024',
            source: '国家药品监督管理局',
            description: '国家药品监督管理局发布的药品编码标准',
            itemCount: 150000,
            status: 'active',
            createTime: '2024-01-20 09:30:00',
            updateTime: '2024-02-25 11:45:00',
            creator: '系统管理员',
        },
    ]

    useEffect(() => {
        fetchCategoryList()
        fetchData({ pageNum: 1, pageSize: pagination.pageSize })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * 将后端返回的记录转换为前端使用的模型
     */
    const mapMedicalDictRecordToModel = (record: MedicalDictRecord): MedicalDictionary => {
        return {
            id: record.id,
            name: record.dictName,
            code: record.dictCode,
            category: record.categoryName || '',
            version: record.version || '',
            source: record.source || '',
            description: record.remark || '',
            itemCount: 0, // 后端可能没有这个字段，使用默认值
            status: record.status === 1 ? 'active' : 'inactive',
            createTime: record.createTime,
            updateTime: record.updateTime || '',
            creator: record.creator || '',
        }
    }

    /**
     * 从后端分页接口获取医疗字典数据
     */
    const fetchData = async (options?: {
        pageNum?: number
        pageSize?: number
        condition?: string
        dictName?: string
        dictCode?: string
        categoryId?: number
        version?: string
        source?: string
        status?: number
    }) => {
        const pageNum = options?.pageNum ?? pagination.current
        const pageSize = options?.pageSize ?? pagination.pageSize

        setLoading(true)
        try {
            const params: MedicalDictPageParams = {
                pageNum,
                pageSize,
                condition: options?.condition ? options.condition.trim() : undefined,
                sortField: 'create_time',
                sortOrder: 'desc',
                dictName: options?.dictName ? options.dictName.trim() : undefined,
                dictCode: options?.dictCode ? options.dictCode.trim() : undefined,
                categoryId: options?.categoryId,
                version: options?.version ? options.version.trim() : undefined,
                source: options?.source ? options.source.trim() : undefined,
                status: typeof options?.status === 'number' ? options.status : undefined,
            }

            const response = await dataManagementService.getMedicalDictPage(params)
            const { records, total, size, current } = response.data
            setData(records.map(mapMedicalDictRecordToModel))
            setPagination({
                current: Number(current) || pageNum,
                pageSize: Number(size) || pageSize,
                total: Number(total) || 0,
            })
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '获取医疗字典列表失败'
            message.error(errMsg)
        } finally {
            setLoading(false)
        }
    }

    // 获取分类列表数据
    const fetchCategoryList = async () => {
        setCategoryListLoading(true)
        try {
            const response = await dataManagementService.getCategoryList()
            setCategoryList(response.data || [])
        } catch (error) {
            console.error('获取分类列表失败:', error)
            message.error('获取分类列表失败')
        } finally {
            setCategoryListLoading(false)
        }
    }

    const handleAdd = async () => {
        setEditingRecord(null)
        form.resetFields()
        // 确保分类列表数据已加载
        if (categoryList.length === 0) {
            await fetchCategoryList()
        }
        setModalVisible(true)
    }

    const handleEdit = async (record: MedicalDictionary) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            status: record.status === 'active', // 将 'active'/'inactive' 转换为 boolean
        })
        // 确保分类列表数据已加载
        if (categoryList.length === 0) {
            await fetchCategoryList()
        }
        setModalVisible(true)
    }

    const handleDelete = async (id: string) => {
        try {
            await dataManagementService.deleteMedicalDict(id)
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

    /**
     * 处理分页变化
     */
    const handleTableChange = (page: number, pageSize: number) => {
        setPagination(prev => ({ ...prev, current: page, pageSize }))
        void fetchData({ pageNum: page, pageSize })
    }

    const handleAutoMapping = () => {
        message.info('正在执行自动映射...')
        setTimeout(() => {
            message.success('自动映射完成，发现 23 个新的映射关系')
        }, 2000)
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()

            // 根据分类名称查找分类ID
            const categoryName = values.category
            const categoryItem = categoryList.find(item => item.categoryName === categoryName)
            if (!categoryItem) {
                message.error('请选择有效的分类')
                return
            }
            const categoryId = Number(categoryItem.id)

            // 将表单数据转换为接口需要的格式
            const requestData = {
                dictName: values.name,
                dictCode: values.code,
                categoryId,
                version: values.version,
                source: values.source,
                status: values.status ? 1 : 0, // boolean 转换为 0/1
                remark: values.description || '', // description 映射到 remark
            }

            if (editingRecord) {
                // 编辑：需要包含 id
                await dataManagementService.updateMedicalDict({
                    id: editingRecord.id,
                    ...requestData,
                })
                message.success('更新成功')
            } else {
                // 新增
                await dataManagementService.addMedicalDict(requestData)
                message.success('创建成功')
            }

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
            if (error && typeof error === 'object' && 'errorFields' in error) {
                // 表单验证错误，不需要额外提示
                console.error('表单验证失败:', error)
            } else {
                const errMsg = error instanceof Error ? error.message : '操作失败'
                message.error(errMsg)
            }
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
    }

    const columns = [
        {
            title: '字典名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: '编码',
            dataIndex: 'code',
            key: 'code',
            width: 120,
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            width: 100,
            render: (category: string) => <Tag color='blue'>{category}</Tag>,
        },
        {
            title: '版本',
            dataIndex: 'version',
            key: 'version',
            width: 80,
        },
        {
            title: '来源',
            dataIndex: 'source',
            key: 'source',
            width: 120,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 160,
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            width: 100,
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            fixed: 'right' as const,
            render: (_: any, record: MedicalDictionary) => (
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
                        title='确定要删除这个字典吗？'
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
        <div style={{ padding: 0 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Typography.Title level={2} style={{ margin: 0 }}>
                    医疗字典数据集管理
                </Typography.Title>
                <Space>
                    <Button type='default' icon={<SyncOutlined />} onClick={handleAutoMapping}>
                        自动映射
                    </Button>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新建字典
                    </Button>
                </Space>
            </div>
            <Alert
                message='医疗字典管理'
                description='维护ICD/LOINC等标准字典的映射与版本管理，支持搜索与导入。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                        onChange: handleTableChange,
                        onShowSizeChange: handleTableChange,
                    }}
                />
            </Card>

            <Modal
                title={editingRecord ? '编辑字典' : '新建字典'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
            >
                <Form
                    form={form}
                    layout='vertical'
                    initialValues={{ status: true }}
                >
                    <Form.Item
                        label='字典名称'
                        name='name'
                        rules={[{ required: true, message: '请输入字典名称' }]}
                    >
                        <Input placeholder='请输入字典名称' />
                    </Form.Item>

                    <Form.Item
                        label='字典编码'
                        name='code'
                        rules={[{ required: true, message: '请输入字典编码' }]}
                    >
                        <Input placeholder='请输入字典编码（大写英文字母）' />
                    </Form.Item>

                    <Form.Item
                        label='分类'
                        name='category'
                        rules={[{ required: true, message: '请选择分类' }]}
                    >
                        <Select
                            placeholder='请选择分类'
                            showSearch
                            optionFilterProp='children'
                            loading={categoryListLoading}
                        >
                            {categoryList.map(category => (
                                <Option key={category.id} value={category.categoryName}>
                                    {category.categoryName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label='版本'
                        name='version'
                        rules={[{ required: true, message: '请输入版本' }]}
                    >
                        <Input placeholder='请输入版本号' />
                    </Form.Item>

                    <Form.Item
                        label='来源'
                        name='source'
                        rules={[{ required: true, message: '请输入来源' }]}
                    >
                        <Input placeholder='请输入来源机构或标准组织' />
                    </Form.Item>

                    <Form.Item
                        label='描述'
                        name='description'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <Input.TextArea rows={3} placeholder='请输入字典描述' />
                    </Form.Item>

                    <Form.Item name='status' label='状态' valuePropName='checked'>
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default MedicalDictionaryManagement
