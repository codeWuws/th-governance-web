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
    Switch,
    Alert,
    Typography,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ImportOutlined,
    ExportOutlined,
    EyeOutlined,
    DownloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import moment from 'moment'
import { exportToExcel, importFromExcel, downloadExcelTemplate } from '../../utils/excel'
import type { UploadProps } from 'antd'
import { Upload } from 'antd'

const { Search } = Input
const { Option } = Select

interface StateDictionary {
    id: string
    name: string // 状态名称
    code: string // 状态编码
    category: string // 分类
    description: string // 描述
    status: 'active' | 'inactive' // 启用状态
    createTime: string
    updateTime: string
    creator: string
}

const StateDictionaryManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<StateDictionary[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<StateDictionary | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    // 模拟数据 - 每个状态一条记录
    const mockData: StateDictionary[] = [
        {
            id: '1',
            name: '已审核',
            code: 'AUDITED',
            category: '工作流',
            description: '审核完成状态',
            status: 'active',
            createTime: '2024-01-15 10:30:00',
            updateTime: '2024-01-15 10:30:00',
            creator: '系统管理员',
        },
        {
            id: '2',
            name: '未审核',
            code: 'UNAUDITED',
            category: '工作流',
            description: '待审核状态',
            status: 'active',
            createTime: '2024-01-15 10:31:00',
            updateTime: '2024-01-15 10:31:00',
            creator: '系统管理员',
        },
        {
            id: '3',
            name: '已中止',
            code: 'TERMINATED',
            category: '工作流',
            description: '流程已中止状态',
            status: 'active',
            createTime: '2024-01-15 10:32:00',
            updateTime: '2024-01-15 10:32:00',
            creator: '系统管理员',
        },
        {
            id: '4',
            name: '已结束',
            code: 'COMPLETED',
            category: '工作流',
            description: '流程已结束状态',
            status: 'active',
            createTime: '2024-01-15 10:33:00',
            updateTime: '2024-01-15 10:33:00',
            creator: '系统管理员',
        },
        {
            id: '5',
            name: '草稿',
            code: 'DRAFT',
            category: '工作流',
            description: '草稿状态',
            status: 'active',
            createTime: '2024-01-16 09:00:00',
            updateTime: '2024-01-16 09:00:00',
            creator: '系统管理员',
        },
        {
            id: '6',
            name: '待审批',
            code: 'PENDING',
            category: '工作流',
            description: '等待审批状态',
            status: 'active',
            createTime: '2024-01-16 09:01:00',
            updateTime: '2024-01-16 09:01:00',
            creator: '系统管理员',
        },
        {
            id: '7',
            name: '已批准',
            code: 'APPROVED',
            category: '工作流',
            description: '审批通过状态',
            status: 'active',
            createTime: '2024-01-16 09:02:00',
            updateTime: '2024-01-16 09:02:00',
            creator: '系统管理员',
        },
        {
            id: '8',
            name: '已拒绝',
            code: 'REJECTED',
            category: '工作流',
            description: '审批被拒绝状态',
            status: 'active',
            createTime: '2024-01-16 09:03:00',
            updateTime: '2024-01-16 09:03:00',
            creator: '系统管理员',
        },
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        setLoading(true)
        setTimeout(() => {
            setData(mockData)
            setLoading(false)
        }, 500)
    }

    const handleSearch = () => {
        let filteredData = mockData

        if (searchText) {
            filteredData = filteredData.filter(
                item =>
                    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.code.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchText.toLowerCase())
            )
        }

        if (categoryFilter) {
            filteredData = filteredData.filter(item => item.category === categoryFilter)
        }

        if (statusFilter) {
            filteredData = filteredData.filter(item => item.status === statusFilter)
        }

        setData(filteredData)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: StateDictionary) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            status: record.status === 'active', // 将 'active'/'inactive' 转换为 boolean
        })
        setModalVisible(true)
    }

    const handleDelete = (record: StateDictionary) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除状态"${record.name}"吗？`,
            onOk: () => {
                message.success('删除成功')
                loadData()
            },
        })
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            // 将 Switch 的 boolean 值转换为 'active'/'inactive'
            const formData = {
                ...values,
                status: values.status ? 'active' : 'inactive',
                updateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            }

            if (editingRecord) {
                message.success('修改成功')
            } else {
                message.success('新增成功')
            }

            setModalVisible(false)
            loadData()
        } catch (error) {
            console.error('表单验证失败:', error)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
    }

    // Excel导出功能
    const handleExport = () => {
        try {
            const exportColumns = [
                { title: '状态名称', dataIndex: 'name', key: 'name' },
                { title: '状态编码', dataIndex: 'code', key: 'code' },
                { title: '分类', dataIndex: 'category', key: 'category' },
                { title: '描述', dataIndex: 'description', key: 'description' },
                { title: '状态', dataIndex: 'status', key: 'status' },
                { title: '创建人', dataIndex: 'creator', key: 'creator' },
                { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
                { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
            ]

            // 准备导出数据，转换状态
            const exportData = data.map(item => ({
                ...item,
                status: item.status === 'active' ? '启用' : '禁用',
            }))

            exportToExcel(exportData, exportColumns, '状态字典管理')
        } catch (error) {
            console.error('导出失败:', error)
        }
    }

    // Excel导入功能
    const handleImport = async (file: File) => {
        try {
            const importedData = await importFromExcel<Partial<StateDictionary>>(file, {
                columnMapping: {
                    '状态名称': 'name',
                    '状态编码': 'code',
                    '分类': 'category',
                    '描述': 'description',
                    '状态': 'status',
                },
                skipFirstRow: true,
                validateRow: (row) => {
                    // 验证必填字段
                    if (!row.name || !row.code) {
                        return false
                    }
                    return true
                },
                transformRow: (row) => {
                    const transformed: Partial<StateDictionary> = {
                        name: String(row.name || '').trim(),
                        code: String(row.code || '').trim(),
                        category: String(row.category || '').trim(),
                        description: String(row.description || '').trim(),
                        status:
                            String(row.status || '').trim() === '启用' ||
                            String(row.status || '').trim() === 'active' ||
                            String(row.status || '').trim() === 'ACTIVE'
                                ? 'active'
                                : 'inactive',
                    }
                    return transformed as StateDictionary
                },
            })

            if (importedData.length === 0) {
                message.warning('导入的数据为空或格式不正确')
                return false
            }

            // 添加到数据列表
            const newData: StateDictionary[] = importedData
                .filter(item => item.name && item.code) // 再次过滤确保必填字段存在
                .map(item => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: item.name || '',
                    code: item.code || '',
                    category: item.category || '',
                    description: item.description || '',
                    status: item.status || 'active',
                    createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                    updateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                    creator: '当前用户',
                }))

            setData([...data, ...newData])
            message.success(`成功导入 ${importedData.length} 条数据`)
            return false // 阻止自动上传
        } catch (error) {
            console.error('导入失败:', error)
            message.error('导入失败，请检查文件格式')
            return false
        }
    }

    // 下载导入模板
    const handleDownloadTemplate = () => {
        const templateColumns = [
            { title: '状态名称', dataIndex: 'name' },
            { title: '状态编码', dataIndex: 'code' },
            { title: '分类', dataIndex: 'category' },
            { title: '描述', dataIndex: 'description' },
            { title: '状态', dataIndex: 'status' },
        ]
        downloadExcelTemplate(templateColumns, '状态字典管理')
    }

    // 上传配置
    const uploadProps: UploadProps = {
        name: 'file',
        accept: '.xlsx,.xls',
        showUploadList: false,
        beforeUpload: (file) => {
            const isExcel =
                file.type ===
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'application/vnd.ms-excel' ||
                file.name.endsWith('.xlsx') ||
                file.name.endsWith('.xls')
            if (!isExcel) {
                message.error('只支持 Excel 格式的文件！')
                return false
            }
            const isLt5M = file.size / 1024 / 1024 < 5
            if (!isLt5M) {
                message.error('文件大小不能超过 5MB！')
                return false
            }
            handleImport(file)
            return false // 阻止自动上传
        },
    }

    const handlePreview = (record: StateDictionary) => {
        Modal.info({
            title: '状态详情',
            width: 600,
            content: (
                <div style={{ marginTop: 16 }}>
                    <p>
                        <strong>状态名称:</strong> {record.name}
                    </p>
                    <p>
                        <strong>状态编码:</strong> {record.code}
                    </p>
                    <p>
                        <strong>分类:</strong> {record.category}
                    </p>
                    <p>
                        <strong>描述:</strong> {record.description}
                    </p>
                    <p>
                        <strong>状态:</strong>{' '}
                        <Tag color={record.status === 'active' ? 'green' : 'red'}>
                            {record.status === 'active' ? '启用' : '禁用'}
                        </Tag>
                    </p>
                    <p>
                        <strong>创建人:</strong> {record.creator}
                    </p>
                    <p>
                        <strong>创建时间:</strong> {record.createTime}
                    </p>
                    <p>
                        <strong>更新时间:</strong> {record.updateTime}
                    </p>
                </div>
            ),
        })
    }

    const columns: ColumnsType<StateDictionary> = [
        {
            title: '状态名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '状态编码',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
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
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Button
                        type='link'
                        danger
                        size='small'
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    >
                        删除
                    </Button>
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
                    状态字典管理
                </Typography.Title>
                <Space>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增状态
                    </Button>
                    <Upload {...uploadProps}>
                        <Button icon={<ImportOutlined />}>导入</Button>
                    </Upload>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                        下载模板
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExport}>
                        导出
                    </Button>
                </Space>
            </div>
            <Alert
                message='状态字典管理'
                description='支持新增、导入、导出与搜索，维护标准化状态。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Space style={{ marginBottom: 16 }}></Space>

                    <Space style={{ marginBottom: 16 }}>
                        <Search
                            placeholder='搜索状态名称、编码或描述'
                            allowClear
                            style={{ width: 300 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={handleSearch}
                        />
                        <Select
                            placeholder='选择分类'
                            style={{ width: 150 }}
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            allowClear
                        >
                            <Option value='患者管理'>患者管理</Option>
                            <Option value='数据质量'>数据质量</Option>
                            <Option value='工作流'>工作流</Option>
                            <Option value='系统管理'>系统管理</Option>
                        </Select>
                        <Select
                            placeholder='选择状态'
                            style={{ width: 150 }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            allowClear
                        >
                            <Option value='active'>启用</Option>
                            <Option value='inactive'>禁用</Option>
                        </Select>
                        <Button type='primary' icon={<SearchOutlined />} onClick={handleSearch}>
                            查询
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey='id'
                    loading={loading}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            <Modal
                title={editingRecord ? '编辑状态' : '新增状态'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
            >
                <Form form={form} layout='vertical'>
                    <Form.Item
                        name='name'
                        label='状态名称'
                        rules={[{ required: true, message: '请输入状态名称' }]}
                    >
                        <Input placeholder='请输入状态名称' />
                    </Form.Item>

                    <Form.Item
                        name='code'
                        label='状态编码'
                        rules={[{ required: true, message: '请输入状态编码' }]}
                    >
                        <Input placeholder='请输入状态编码（大写英文字母和下划线）' />
                    </Form.Item>

                    <Form.Item
                        name='category'
                        label='分类'
                        rules={[{ required: true, message: '请选择分类' }]}
                    >
                        <Select placeholder='请选择分类'>
                            <Option value='患者管理'>患者管理</Option>
                            <Option value='数据质量'>数据质量</Option>
                            <Option value='工作流'>工作流</Option>
                            <Option value='系统管理'>系统管理</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <Input.TextArea rows={3} placeholder='请输入描述' />
                    </Form.Item>

                    <Form.Item
                        name='status'
                        label='状态'
                        valuePropName='checked'
                        initialValue={true}
                    >
                        <Switch checkedChildren='启用' unCheckedChildren='禁用' />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default StateDictionaryManagement
