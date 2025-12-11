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
    Popconfirm,
    Row,
    Col,
} from 'antd'
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ImportOutlined,
    ExportOutlined,
    EyeOutlined,
    ReloadOutlined,
    DownloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { exportToExcel, importFromExcel, downloadExcelTemplate } from '../../utils/excel'
import type { UploadProps } from 'antd'
import { Upload } from 'antd'

const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface StandardDictionaryMapping {
    id: string
    standardName: string // 标准名称
    standardDatasetName: string // 标准数据集名称
    standardDatasetContent: string // 标准数据集内容
    originalDataSource: string // 原始数据源
    originalTableName: string // 原始表
    originalDataField: string // 原始字段
    originalDataset: string // 原始数据集
    targetDataSource: string // 目标源
    targetTableName: string // 目标表
    targetField: string // 目标字段
    status: 'active' | 'inactive'
    createTime: string
    updateTime: string
    creator: string
}

const StandardDictionaryMapping: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<StandardDictionaryMapping[]>([])
    const [filteredData, setFilteredData] = useState<StandardDictionaryMapping[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [editingRecord, setEditingRecord] = useState<StandardDictionaryMapping | null>(null)
    const [viewingRecord, setViewingRecord] = useState<StandardDictionaryMapping | null>(null)
    const [form] = Form.useForm()
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [dataSourceFilter, setDataSourceFilter] = useState<string>('')
    const [standardNameFilter, setStandardNameFilter] = useState<string>('')

    // 模拟数据
    const mockData: StandardDictionaryMapping[] = [
        {
            id: '1',
            standardName: '患者基本信息',
            standardDatasetName: '性别',
            standardDatasetContent: '男',
            originalDataSource: 'HIS系统',
            originalTableName: 'PAT_BASE_INFO',
            originalDataField: 'GENDER_CODE',
            originalDataset: '1',
            targetDataSource: '标准数据集',
            targetTableName: 'std_patient_basic_info',
            targetField: 'gender_code',
            status: 'active',
            createTime: '2024-01-15 10:00:00',
            updateTime: '2024-01-20 14:30:00',
            creator: '数据管理员',
        },
        {
            id: '2',
            standardName: '患者基本信息',
            standardDatasetName: '性别',
            standardDatasetContent: '女',
            originalDataSource: 'HIS系统',
            originalTableName: 'PAT_BASE_INFO',
            originalDataField: 'GENDER_CODE',
            originalDataset: '2',
            targetDataSource: '标准数据集',
            targetTableName: 'std_patient_basic_info',
            targetField: 'gender_code',
            status: 'active',
            createTime: '2024-01-15 10:05:00',
            updateTime: '2024-01-20 14:30:00',
            creator: '数据管理员',
        },
        {
            id: '3',
            standardName: '患者基本信息',
            standardDatasetName: '性别',
            standardDatasetContent: '未知',
            originalDataSource: 'HIS系统',
            originalTableName: 'PAT_BASE_INFO',
            originalDataField: 'GENDER_CODE',
            originalDataset: '0',
            targetDataSource: '标准数据集',
            targetTableName: 'std_patient_basic_info',
            targetField: 'gender_code',
            status: 'active',
            createTime: '2024-01-15 10:10:00',
            updateTime: '2024-01-20 14:30:00',
            creator: '数据管理员',
        },
        {
            id: '4',
            standardName: '疾病诊断',
            standardDatasetName: 'ICD-10编码',
            standardDatasetContent: 'I10',
            originalDataSource: 'EMR系统',
            originalTableName: 'DIAGNOSIS_RECORD',
            originalDataField: 'DISEASE_CODE',
            originalDataset: 'I10.000',
            targetDataSource: '标准数据集',
            targetTableName: 'std_diagnosis_info',
            targetField: 'icd10_code',
            status: 'active',
            createTime: '2024-01-16 09:20:00',
            updateTime: '2024-01-22 16:45:00',
            creator: '临床数据管理员',
        },
        {
            id: '5',
            standardName: '疾病诊断',
            standardDatasetName: 'ICD-10编码',
            standardDatasetContent: 'E11.9',
            originalDataSource: 'EMR系统',
            originalTableName: 'DIAGNOSIS_RECORD',
            originalDataField: 'DISEASE_CODE',
            originalDataset: 'E11.900',
            targetDataSource: '标准数据集',
            targetTableName: 'std_diagnosis_info',
            targetField: 'icd10_code',
            status: 'active',
            createTime: '2024-01-16 09:25:00',
            updateTime: '2024-01-22 16:45:00',
            creator: '临床数据管理员',
        },
        {
            id: '6',
            standardName: '检验项目',
            standardDatasetName: 'LOINC编码',
            standardDatasetContent: '718-7',
            originalDataSource: 'LIS系统',
            originalTableName: 'LAB_TEST_ITEM',
            originalDataField: 'TEST_CODE',
            originalDataset: 'HGB',
            targetDataSource: '标准数据集',
            targetTableName: 'std_lab_test_info',
            targetField: 'loinc_code',
            status: 'active',
            createTime: '2024-01-17 11:15:00',
            updateTime: '2024-01-23 10:30:00',
            creator: '检验数据管理员',
        },
        {
            id: '7',
            standardName: '检验项目',
            standardDatasetName: 'LOINC编码',
            standardDatasetContent: '789-8',
            originalDataSource: 'LIS系统',
            originalTableName: 'LAB_TEST_ITEM',
            originalDataField: 'TEST_CODE',
            originalDataset: 'WBC',
            targetDataSource: '标准数据集',
            targetTableName: 'std_lab_test_info',
            targetField: 'loinc_code',
            status: 'active',
            createTime: '2024-01-17 11:20:00',
            updateTime: '2024-01-23 10:30:00',
            creator: '检验数据管理员',
        },
        {
            id: '8',
            standardName: '民族',
            standardDatasetName: '民族编码',
            standardDatasetContent: '01',
            originalDataSource: 'HIS系统',
            originalTableName: 'PAT_BASE_INFO',
            originalDataField: 'NATION_CODE',
            originalDataset: 'HAN',
            targetDataSource: '标准数据集',
            targetTableName: 'std_patient_basic_info',
            targetField: 'ethnicity_code',
            status: 'active',
            createTime: '2024-01-18 14:00:00',
            updateTime: '2024-01-24 09:15:00',
            creator: '数据管理员',
        },
        {
            id: '9',
            standardName: '民族',
            standardDatasetName: '民族编码',
            standardDatasetContent: '02',
            originalDataSource: 'HIS系统',
            originalTableName: 'PAT_BASE_INFO',
            originalDataField: 'NATION_CODE',
            originalDataset: 'ZHUANG',
            targetDataSource: '标准数据集',
            targetTableName: 'std_patient_basic_info',
            targetField: 'ethnicity_code',
            status: 'active',
            createTime: '2024-01-18 14:05:00',
            updateTime: '2024-01-24 09:15:00',
            creator: '数据管理员',
        },
        {
            id: '10',
            standardName: '手术操作',
            standardDatasetName: 'ICD-9-CM-3编码',
            standardDatasetContent: '38.95',
            originalDataSource: 'EMR系统',
            originalTableName: 'OPERATION_RECORD',
            originalDataField: 'OP_CODE',
            originalDataset: 'OP001',
            targetDataSource: '标准数据集',
            targetTableName: 'std_operation_info',
            targetField: 'icd9cm3_code',
            status: 'active',
            createTime: '2024-01-19 10:30:00',
            updateTime: '2024-01-25 11:20:00',
            creator: '手术数据管理员',
        },
        {
            id: '11',
            standardName: '药品信息',
            standardDatasetName: 'ATC编码',
            standardDatasetContent: 'C09AA02',
            originalDataSource: 'HIS系统',
            originalTableName: 'DRUG_INFO',
            originalDataField: 'DRUG_CODE',
            originalDataset: 'D001234',
            targetDataSource: '标准数据集',
            targetTableName: 'std_drug_info',
            targetField: 'atc_code',
            status: 'active',
            createTime: '2024-01-20 08:45:00',
            updateTime: '2024-01-26 14:10:00',
            creator: '药品数据管理员',
        },
        {
            id: '12',
            standardName: '科室信息',
            standardDatasetName: '科室编码',
            standardDatasetContent: '01.01',
            originalDataSource: 'HIS系统',
            originalTableName: 'DEPT_INFO',
            originalDataField: 'DEPT_CODE',
            originalDataset: 'NEIKE',
            targetDataSource: '标准数据集',
            targetTableName: 'std_department_info',
            targetField: 'dept_code',
            status: 'active',
            createTime: '2024-01-21 13:20:00',
            updateTime: '2024-01-27 15:30:00',
            creator: '系统管理员',
        },
    ]

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        filterData()
    }, [searchText, statusFilter, dataSourceFilter, standardNameFilter, data])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setData(mockData)
            setFilteredData(mockData)
        } catch {
            message.error('获取标准字典对照失败')
        } finally {
            setLoading(false)
        }
    }

    const filterData = () => {
        let filtered = [...data]

        if (searchText) {
            filtered = filtered.filter(
                item =>
                    item.standardName?.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.standardDatasetName?.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.standardDatasetContent?.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.originalDataSource?.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.originalTableName?.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.originalDataField?.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.originalDataset?.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.targetDataSource?.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.targetTableName?.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.targetField?.toLowerCase().includes(searchText.toLowerCase())
            )
        }

        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter)
        }

        if (dataSourceFilter) {
            filtered = filtered.filter(item => item.originalDataSource === dataSourceFilter)
        }

        if (standardNameFilter) {
            filtered = filtered.filter(item => item.standardName === standardNameFilter)
        }

        setFilteredData(filtered)
    }

    const handleAdd = () => {
        setEditingRecord(null)
        form.resetFields()
        form.setFieldsValue({
            status: true,
        })
        setModalVisible(true)
    }

    const handleEdit = (record: StandardDictionaryMapping) => {
        setEditingRecord(record)
        form.setFieldsValue({
            ...record,
            status: record.status === 'active',
        })
        setModalVisible(true)
    }

    const handleDelete = (record: StandardDictionaryMapping) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除标准字典对照记录吗？`,
            onOk: () => {
                const newData = data.filter(item => item.id !== record.id)
                setData(newData)
                // 数据更新后，useEffect 会自动触发 filterData
                message.success('删除成功')
            },
        })
    }

    const handleView = (record: StandardDictionaryMapping) => {
        setViewingRecord(record)
        setDetailModalVisible(true)
    }

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields()
            const formData: StandardDictionaryMapping = {
                id: editingRecord?.id || Date.now().toString(),
                standardName: values.standardName,
                standardDatasetName: values.standardDatasetName,
                standardDatasetContent: values.standardDatasetContent,
                originalDataSource: values.originalDataSource,
                originalTableName: values.originalTableName,
                originalDataField: values.originalDataField,
                originalDataset: values.originalDataset,
                targetDataSource: values.targetDataSource,
                targetTableName: values.targetTableName,
                targetField: values.targetField,
                status: values.status ? 'active' : 'inactive',
                createTime: editingRecord?.createTime || new Date().toLocaleString('zh-CN'),
                updateTime: new Date().toLocaleString('zh-CN'),
                creator: editingRecord?.creator || '当前用户',
            }

            let newData: StandardDictionaryMapping[]
            if (editingRecord) {
                // 编辑
                newData = data.map(item => (item.id === editingRecord.id ? formData : item))
                setData(newData)
                message.success('修改成功')
            } else {
                // 新增
                newData = [...data, formData]
                setData(newData)
                message.success('新增成功')
            }

            // 数据更新后，useEffect 会自动触发 filterData

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

    // Excel导出功能
    const handleExport = () => {
        try {
            const exportColumns = [
                { title: '标准名称', dataIndex: 'standardName', key: 'standardName' },
                {
                    title: '标准数据集名称',
                    dataIndex: 'standardDatasetName',
                    key: 'standardDatasetName',
                },
                {
                    title: '标准数据集内容',
                    dataIndex: 'standardDatasetContent',
                    key: 'standardDatasetContent',
                },
                {
                    title: '原始数据源',
                    dataIndex: 'originalDataSource',
                    key: 'originalDataSource',
                },
                {
                    title: '原始表',
                    dataIndex: 'originalTableName',
                    key: 'originalTableName',
                },
                {
                    title: '原始字段',
                    dataIndex: 'originalDataField',
                    key: 'originalDataField',
                },
                {
                    title: '原始数据集',
                    dataIndex: 'originalDataset',
                    key: 'originalDataset',
                },
                {
                    title: '目标数据源',
                    dataIndex: 'targetDataSource',
                    key: 'targetDataSource',
                },
                {
                    title: '目标表',
                    dataIndex: 'targetTableName',
                    key: 'targetTableName',
                },
                { title: '目标字段', dataIndex: 'targetField', key: 'targetField' },
                { title: '状态', dataIndex: 'status', key: 'status' },
                { title: '创建人', dataIndex: 'creator', key: 'creator' },
                { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
                { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
            ]

            // 准备导出数据，转换状态
            const exportData = filteredData.map(item => ({
                ...item,
                status: item.status === 'active' ? '启用' : '禁用',
            }))

            exportToExcel(exportData, exportColumns, '标准字典关系对照')
        } catch (error) {
            console.error('导出失败:', error)
        }
    }

    // Excel导入功能
    const handleImport = async (file: File) => {
        try {
            const importedData = await importFromExcel<Partial<StandardDictionaryMapping>>(file, {
                columnMapping: {
                    '标准名称': 'standardName',
                    '标准数据集名称': 'standardDatasetName',
                    '标准数据集内容': 'standardDatasetContent',
                    '原始数据源': 'originalDataSource',
                    '原始表': 'originalTableName',
                    '原始字段': 'originalDataField',
                    '原始数据集': 'originalDataset',
                    '目标数据源': 'targetDataSource',
                    '目标表': 'targetTableName',
                    '目标字段': 'targetField',
                    '状态': 'status',
                },
                skipFirstRow: true,
                validateRow: (row) => {
                    // 验证必填字段
                    if (!row.standardName || !row.standardDatasetName) {
                        return false
                    }
                    return true
                },
                transformRow: (row) => {
                    const transformed: Partial<StandardDictionaryMapping> = {
                        standardName: String(row.standardName || '').trim(),
                        standardDatasetName: String(row.standardDatasetName || '').trim(),
                        standardDatasetContent: String(row.standardDatasetContent || '').trim(),
                        originalDataSource: String(row.originalDataSource || '').trim(),
                        originalTableName: String(row.originalTableName || '').trim(),
                        originalDataField: String(row.originalDataField || '').trim(),
                        originalDataset: String(row.originalDataset || '').trim(),
                        targetDataSource: String(row.targetDataSource || '').trim(),
                        targetTableName: String(row.targetTableName || '').trim(),
                        targetField: String(row.targetField || '').trim(),
                        status:
                            String(row.status || '').trim() === '启用' ||
                            String(row.status || '').trim() === 'active' ||
                            String(row.status || '').trim() === 'ACTIVE'
                                ? 'active'
                                : 'inactive',
                    }
                    return transformed as StandardDictionaryMapping
                },
            })

            if (importedData.length === 0) {
                message.warning('导入的数据为空或格式不正确')
                return false
            }

            // 添加到数据列表
            const newData: StandardDictionaryMapping[] = importedData
                .filter(item => item.standardName && item.standardDatasetName) // 再次过滤确保必填字段存在
                .map(item => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    standardName: item.standardName || '',
                    standardDatasetName: item.standardDatasetName || '',
                    standardDatasetContent: item.standardDatasetContent || '',
                    originalDataSource: item.originalDataSource || '',
                    originalTableName: item.originalTableName || '',
                    originalDataField: item.originalDataField || '',
                    originalDataset: item.originalDataset || '',
                    targetDataSource: item.targetDataSource || '',
                    targetTableName: item.targetTableName || '',
                    targetField: item.targetField || '',
                    status: item.status || 'active',
                    createTime: new Date().toLocaleString('zh-CN'),
                    updateTime: new Date().toLocaleString('zh-CN'),
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
            { title: '标准名称', dataIndex: 'standardName' },
            { title: '标准数据集名称', dataIndex: 'standardDatasetName' },
            { title: '标准数据集内容', dataIndex: 'standardDatasetContent' },
            { title: '原始数据源', dataIndex: 'originalDataSource' },
            { title: '原始表', dataIndex: 'originalTableName' },
            { title: '原始字段', dataIndex: 'originalDataField' },
            { title: '原始数据集', dataIndex: 'originalDataset' },
            { title: '目标数据源', dataIndex: 'targetDataSource' },
            { title: '目标表', dataIndex: 'targetTableName' },
            { title: '目标字段', dataIndex: 'targetField' },
            { title: '状态', dataIndex: 'status' },
        ]
        downloadExcelTemplate(templateColumns, '标准字典关系对照')
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

    // 获取所有数据源用于筛选
    const dataSources = Array.from(new Set(data.map(item => item.originalDataSource)))
    // 获取所有标准名称用于筛选
    const standardNames = Array.from(new Set(data.map(item => item.standardName)))

    const columns: ColumnsType<StandardDictionaryMapping> = [
        {
            title: '序号',
            key: 'index',
            width: 80,
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: '标准名称',
            dataIndex: 'standardName',
            key: 'standardName',
            width: 150,
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: '标准数据集名称',
            dataIndex: 'standardDatasetName',
            key: 'standardDatasetName',
            width: 150,
        },
        {
            title: '标准数据集内容',
            dataIndex: 'standardDatasetContent',
            key: 'standardDatasetContent',
            width: 150,
        },
        {
            title: '原始数据源',
            dataIndex: 'originalDataSource',
            key: 'originalDataSource',
            width: 120,
            render: (text: string) => <Tag color='orange'>{text}</Tag>,
        },
        {
            title: '原始表',
            dataIndex: 'originalTableName',
            key: 'originalTableName',
            width: 180,
        },
        {
            title: '原始字段',
            dataIndex: 'originalDataField',
            key: 'originalDataField',
            width: 120,
            render: (text: string) => <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>{text}</code>,
        },
        {
            title: '原始数据集',
            dataIndex: 'originalDataset',
            key: 'originalDataset',
            width: 150,
            render: (text: string) => <Tag color='purple'>{text}</Tag>,
        },
        {
            title: '目标源',
            dataIndex: 'targetDataSource',
            key: 'targetDataSource',
            width: 120,
            render: (text: string) => <Tag color='blue'>{text}</Tag>,
        },
        {
            title: '目标表',
            dataIndex: 'targetTableName',
            key: 'targetTableName',
            width: 180,
        },
        {
            title: '目标字段',
            dataIndex: 'targetField',
            key: 'targetField',
            width: 120,
            render: (text: string) => <code style={{ background: '#e6f7ff', padding: '2px 4px', borderRadius: '4px' }}>{text}</code>,
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
            width: 100,
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
            fixed: 'right',
            render: (_, record) => (
                <Space size='small'>
                    <Button
                        type='link'
                        size='small'
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                    >
                        查看
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
                        title='确认删除'
                        description='确定要删除这条记录吗？'
                        onConfirm={() => handleDelete(record)}
                        okText='确定'
                        cancelText='取消'
                    >
                        <Button type='link' danger size='small' icon={<DeleteOutlined />}>
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
                    标准字典对照
                </Typography.Title>
                <Space>
                    <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
                        新增对照
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
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>
                        刷新
                    </Button>
                </Space>
            </div>
            <Alert
                message='标准字典对照'
                description='管理标准数据集与原始数据之间的对照关系，用于数据标准化和映射。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Space>
                        <Search
                            placeholder='搜索标准名称、数据集名称、表名、字段名等'
                            allowClear
                            style={{ width: 300 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={filterData}
                        />
                        <Select
                            placeholder='选择标准名称'
                            style={{ width: 180 }}
                            value={standardNameFilter}
                            onChange={setStandardNameFilter}
                            allowClear
                        >
                            {standardNames.map(name => (
                                <Option key={name} value={name}>
                                    {name}
                                </Option>
                            ))}
                        </Select>
                        <Select
                            placeholder='选择数据源'
                            style={{ width: 180 }}
                            value={dataSourceFilter}
                            onChange={setDataSourceFilter}
                            allowClear
                        >
                            {dataSources.map(source => (
                                <Option key={source} value={source}>
                                    {source}
                                </Option>
                            ))}
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
                        <Button type='primary' icon={<SearchOutlined />} onClick={filterData}>
                            查询
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey='id'
                    loading={loading}
                    scroll={{ x: 1400 }}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: total => `共 ${total} 条记录`,
                    }}
                />
            </Card>

            {/* 新增/编辑模态框 */}
            <Modal
                title={editingRecord ? '编辑标准字典对照' : '新增标准字典对照'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                width={900}
                destroyOnClose
                okText='确定'
                cancelText='取消'
            >
                <Form form={form} layout='vertical'>
                    <div style={{ marginBottom: 16, padding: '12px', background: '#f0f9ff', borderRadius: '4px' }}>
                        <strong>标准信息</strong>
                    </div>
                    <Form.Item
                        name='standardName'
                        label='标准名称'
                        rules={[{ required: true, message: '请输入标准名称' }]}
                    >
                        <Input placeholder='请输入标准名称，如：患者基本信息' />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name='standardDatasetName'
                                label='标准数据集名称'
                                rules={[{ required: true, message: '请输入标准数据集名称' }]}
                            >
                                <Input placeholder='请输入标准数据集名称，如：性别' />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name='standardDatasetContent'
                                label='标准数据集内容'
                                rules={[{ required: true, message: '请输入标准数据集内容' }]}
                            >
                                <Input placeholder='请输入标准数据集内容，如：男' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
                        <strong>原始数据</strong>
                    </div>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='originalDataSource'
                                label='原始数据源'
                                rules={[{ required: true, message: '请选择原始数据源' }]}
                            >
                                <Select placeholder='请选择原始数据源'>
                                    <Option value='HIS系统'>HIS系统</Option>
                                    <Option value='EMR系统'>EMR系统</Option>
                                    <Option value='LIS系统'>LIS系统</Option>
                                    <Option value='PACS系统'>PACS系统</Option>
                                    <Option value='其他'>其他</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='originalTableName'
                                label='原始表'
                                rules={[{ required: true, message: '请输入原始表名称' }]}
                            >
                                <Input placeholder='请输入原始表名称' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='originalDataField'
                                label='原始字段'
                                rules={[{ required: true, message: '请输入原始字段名称' }]}
                            >
                                <Input placeholder='请输入原始字段名称' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name='originalDataset'
                        label='原始数据集'
                        rules={[{ required: true, message: '请输入原始数据集' }]}
                    >
                        <Input placeholder='请输入原始数据集，如：M' />
                    </Form.Item>

                    <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#e6f7ff', borderRadius: '4px' }}>
                        <strong>目标数据</strong>
                    </div>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name='targetDataSource'
                                label='目标源'
                                rules={[{ required: true, message: '请选择目标源' }]}
                            >
                                <Select placeholder='请选择目标源'>
                                    <Option value='标准数据集'>标准数据集</Option>
                                    <Option value='数据仓库'>数据仓库</Option>
                                    <Option value='数据湖'>数据湖</Option>
                                    <Option value='其他'>其他</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='targetTableName'
                                label='目标表'
                                rules={[{ required: true, message: '请输入目标表名称' }]}
                            >
                                <Input placeholder='请输入目标表名称' />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name='targetField'
                                label='目标字段'
                                rules={[{ required: true, message: '请输入目标字段名称' }]}
                            >
                                <Input placeholder='请输入目标字段名称' />
                            </Form.Item>
                        </Col>
                    </Row>

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

            {/* 详情查看模态框 */}
            <Modal
                title='标准字典对照详情'
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key='close' onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={800}
            >
                {viewingRecord && (
                    <div>
                        <div style={{ marginBottom: 16, padding: '12px', background: '#f0f9ff', borderRadius: '4px' }}>
                            <strong>标准信息</strong>
                        </div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={12}>
                                <div>
                                    <strong>标准名称：</strong>
                                    {viewingRecord.standardName}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>标准数据集名称：</strong>
                                    {viewingRecord.standardDatasetName}
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>标准数据集内容：</strong>
                                    <Tag color='green'>{viewingRecord.standardDatasetContent}</Tag>
                                </div>
                            </Col>
                        </Row>

                        <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
                            <strong>原始数据</strong>
                        </div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <div>
                                    <strong>原始数据源：</strong>
                                    <Tag color='orange'>{viewingRecord.originalDataSource}</Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>原始表：</strong>
                                    {viewingRecord.originalTableName}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>原始字段：</strong>
                                    <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>
                                        {viewingRecord.originalDataField}
                                    </code>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div>
                                    <strong>原始数据集：</strong>
                                    <Tag color='purple'>{viewingRecord.originalDataset}</Tag>
                                </div>
                            </Col>
                        </Row>

                        <div style={{ marginBottom: 16, marginTop: 24, padding: '12px', background: '#e6f7ff', borderRadius: '4px' }}>
                            <strong>目标数据</strong>
                        </div>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col span={8}>
                                <div>
                                    <strong>目标源：</strong>
                                    <Tag color='blue'>{viewingRecord.targetDataSource}</Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>目标表：</strong>
                                    {viewingRecord.targetTableName}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>目标字段：</strong>
                                    <code style={{ background: '#e6f7ff', padding: '2px 4px', borderRadius: '4px' }}>
                                        {viewingRecord.targetField}
                                    </code>
                                </div>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <div>
                                    <strong>状态：</strong>
                                    <Tag color={viewingRecord.status === 'active' ? 'green' : 'red'}>
                                        {viewingRecord.status === 'active' ? '启用' : '禁用'}
                                    </Tag>
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>创建人：</strong>
                                    {viewingRecord.creator}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>创建时间：</strong>
                                    {viewingRecord.createTime}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div>
                                    <strong>更新时间：</strong>
                                    {viewingRecord.updateTime}
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default StandardDictionaryMapping

