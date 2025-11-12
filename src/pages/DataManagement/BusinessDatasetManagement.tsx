import React, { useState, useEffect } from 'react'
import {
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
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    DownloadOutlined,
    UploadOutlined,
} from '@ant-design/icons'

const { Option } = Select

interface BusinessDataset {
    id: string
    name: string
    code: string
    category: string
    description: string
    diseaseType: string
    dataSource: string
    fieldCount: number
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
    version: string
}

const BusinessDatasetManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<BusinessDataset[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<BusinessDataset | null>(null)
    const [form] = Form.useForm()

    // 模拟数据
    const mockData: BusinessDataset[] = [
        {
            id: '1',
            name: '心血管疾病数据集',
            code: 'CVD_DATASET',
            category: '专病数据集',
            description: '心血管疾病相关的临床数据集，包含诊断、治疗、随访等信息',
            diseaseType: '心血管疾病',
            dataSource: 'HIS,EMR,LIS',
            fieldCount: 156,
            status: 'active',
            createTime: '2024-01-15 10:30:00',
            updateTime: '2024-02-20 14:20:00',
            creator: '张医生',
            version: 'v2.1.0',
        },
        {
            id: '2',
            name: '糖尿病管理数据集',
            code: 'DM_DATASET',
            category: '专病数据集',
            description: '糖尿病患者管理数据集，包含血糖监测、用药记录、并发症等',
            diseaseType: '糖尿病',
            dataSource: 'HIS,EMR,PHR',
            fieldCount: 203,
            status: 'active',
            createTime: '2024-01-20 09:15:00',
            updateTime: '2024-02-18 16:45:00',
            creator: '李医生',
            version: 'v1.8.2',
        },
    ]

    useEffect(() => {
        fetchData()
    }, [])

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

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        setModalVisible(true)
    }

    const handleEdit = (record: BusinessDataset) => {
        setEditingRecord(record)
        form.setFieldsValue(record)
        setModalVisible(true)
    }

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

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()

            if (editingRecord) {
                // 编辑
                setData(
                    data.map(item =>
                        item.id === editingRecord.id
                            ? { ...item, ...values, updateTime: new Date().toLocaleString() }
                            : item
                    )
                )
                message.success('更新成功')
            } else {
                // 新增
                const newRecord: BusinessDataset = {
                    ...values,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    creator: '当前用户',
                    fieldCount: 0,
                    status: 'active',
                }
                setData([...data, newRecord])
                message.success('创建成功')
            }

            setModalVisible(false)
            form.resetFields()
        } catch (error) {
            console.error('表单验证失败:', error)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        form.resetFields()
    }

    const handleExport = (record: BusinessDataset) => {
        message.info(`正在导出 ${record.name} 的模板...`)
        // 模拟导出操作
        setTimeout(() => {
            message.success('模板导出成功')
        }, 1000)
    }

    const handleImport = () => {
        message.info('导入功能开发中...')
    }

    const handlePreview = (record: BusinessDataset) => {
        Modal.info({
            title: '数据集预览',
            width: 800,
            content: (
                <div>
                    <p>
                        <strong>数据集名称：</strong>
                        {record.name}
                    </p>
                    <p>
                        <strong>编码：</strong>
                        {record.code}
                    </p>
                    <p>
                        <strong>疾病类型：</strong>
                        {record.diseaseType}
                    </p>
                    <p>
                        <strong>数据源：</strong>
                        {record.dataSource}
                    </p>
                    <p>
                        <strong>字段数量：</strong>
                        {record.fieldCount}
                    </p>
                    <p>
                        <strong>描述：</strong>
                        {record.description}
                    </p>
                    <p>
                        <strong>版本：</strong>
                        {record.version}
                    </p>
                </div>
            ),
        })
    }

    const columns = [
        {
            title: '数据集名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: '编码',
            dataIndex: 'code',
            key: 'code',
            width: 150,
        },
        {
            title: '疾病类型',
            dataIndex: 'diseaseType',
            key: 'diseaseType',
            width: 120,
        },
        {
            title: '数据源',
            dataIndex: 'dataSource',
            key: 'dataSource',
            width: 120,
            render: (sources: string) => (
                <Space size='small'>
                    {sources.split(',').map((source, index) => (
                        <Tag key={index} color='blue'>
                            {source}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: '字段数量',
            dataIndex: 'fieldCount',
            key: 'fieldCount',
            width: 80,
            align: 'center' as const,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? '启用' : '停用'}
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
            width: 200,
            fixed: 'right' as const,
            render: (_: any, record: BusinessDataset) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(record)}
                    >
                        预览
                    </Button>
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
                        size='small'
                        icon={<DownloadOutlined />}
                        onClick={() => handleExport(record)}
                    >
                        导出
                    </Button>
                    <Popconfirm
                        title='确定要删除这个数据集吗？'
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
        <div>
            <Card>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <h2>业务数据集管理</h2>
                        <p style={{ color: '#666' }}>
                            管理面向业务的专病数据集，支持创建、编辑、导入导出等功能
                        </p>
                    </div>
                    <Space>
                        <Button type='default' icon={<UploadOutlined />} onClick={handleImport}>
                            导入模板
                        </Button>
                        <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                            新建数据集
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        total: data.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            <Modal
                title={editingRecord ? '编辑数据集' : '新建数据集'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={600}
            >
                <Form form={form} layout='vertical' initialValues={{ status: 'active' }}>
                    <Form.Item
                        label='数据集名称'
                        name='name'
                        rules={[{ required: true, message: '请输入数据集名称' }]}
                    >
                        <Input placeholder='请输入数据集名称' />
                    </Form.Item>

                    <Form.Item
                        label='数据集编码'
                        name='code'
                        rules={[{ required: true, message: '请输入数据集编码' }]}
                    >
                        <Input placeholder='请输入数据集编码（大写英文字母和下划线）' />
                    </Form.Item>

                    <Form.Item
                        label='疾病类型'
                        name='diseaseType'
                        rules={[{ required: true, message: '请选择疾病类型' }]}
                    >
                        <Select placeholder='请选择疾病类型'>
                            <Option value='心血管疾病'>心血管疾病</Option>
                            <Option value='糖尿病'>糖尿病</Option>
                            <Option value='肿瘤'>肿瘤</Option>
                            <Option value='呼吸系统疾病'>呼吸系统疾病</Option>
                            <Option value='神经系统疾病'>神经系统疾病</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label='数据源'
                        name='dataSource'
                        rules={[{ required: true, message: '请选择数据源' }]}
                    >
                        <Select mode='tags' placeholder='请选择数据源'>
                            <Option value='HIS'>HIS</Option>
                            <Option value='EMR'>EMR</Option>
                            <Option value='LIS'>LIS</Option>
                            <Option value='PACS'>PACS</Option>
                            <Option value='PHR'>PHR</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label='描述'
                        name='description'
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <Input.TextArea rows={3} placeholder='请输入数据集描述' />
                    </Form.Item>

                    <Form.Item
                        label='分类'
                        name='category'
                        rules={[{ required: true, message: '请选择分类' }]}
                    >
                        <Select placeholder='请选择分类'>
                            <Option value='专病数据集'>专病数据集</Option>
                            <Option value='通用数据集'>通用数据集</Option>
                            <Option value='标准数据集'>标准数据集</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default BusinessDatasetManagement
