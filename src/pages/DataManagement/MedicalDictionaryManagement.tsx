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

    const handleEdit = (record: MedicalDictionary) => {
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
            setData(data.filter(item => item.id !== id))
            message.success('删除成功')
        } catch (error) {
            message.error('删除失败')
        }
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
            // 将 Switch 的 boolean 值转换为 'active'/'inactive'
            const formData = {
                ...values,
                status: values.status ? 'active' : 'inactive',
            }

            if (editingRecord) {
                // 编辑
                setData(
                    data.map(item =>
                        item.id === editingRecord.id
                            ? { ...item, ...formData, updateTime: new Date().toLocaleString() }
                            : item
                    )
                )
                message.success('更新成功')
            } else {
                // 新增
                const newRecord: MedicalDictionary = {
                    ...formData,
                    id: Date.now().toString(),
                    createTime: new Date().toLocaleString(),
                    updateTime: new Date().toLocaleString(),
                    creator: '当前用户',
                    itemCount: 0,
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
                        total: data.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
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
                        <Select placeholder='请选择分类'>
                            <Option value='疾病分类'>疾病分类</Option>
                            <Option value='检验代码'>检验代码</Option>
                            <Option value='药品代码'>药品代码</Option>
                            <Option value='手术代码'>手术代码</Option>
                            <Option value='症状代码'>症状代码</Option>
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
