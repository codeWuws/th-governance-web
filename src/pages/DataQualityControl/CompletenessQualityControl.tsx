import {
    CheckCircleOutlined,
    DatabaseOutlined,
    ExclamationCircleOutlined,
    PieChartOutlined,
    SearchOutlined,
    TableOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import uiMessage from '@/utils/uiMessage'

const { Title, Text } = Typography

interface TableCompleteness {
    key: string
    tableName: string
    tableComment: string
    totalRecords: number
    completenessRate: number
    incompleteRecords: number
    status: 'excellent' | 'good' | 'warning' | 'poor'
}

interface FieldCompleteness {
    key: string
    fieldName: string
    fieldComment: string
    dataType: string
    totalRecords: number
    filledRecords: number
    emptyRecords: number
    fillRate: number
    isRequired: boolean
}

interface CompletenessFormValues {
    database: string
    tableType: string
    tableFilter?: string
}

type AutoProps = { autoStart?: boolean; onAutoDone?: () => void }

const CompletenessQualityControl: React.FC<AutoProps> = ({ autoStart, onAutoDone }) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [tableCompleteness, setTableCompleteness] = useState<TableCompleteness[]>([])
    const [fieldCompleteness, setFieldCompleteness] = useState<FieldCompleteness[]>([])
    const [selectedTable, setSelectedTable] = useState<string>('')
    const [showRequiredOnly, setShowRequiredOnly] = useState(false)
    const [overallStats, setOverallStats] = useState({
        totalTables: 0,
        avgCompleteness: 0,
        excellentTables: 0,
        poorTables: 0,
    })

    // 数据库选项
    const databaseOptions = [
        { label: 'HIS数据库', value: 'his_db' },
        { label: 'EMR数据库', value: 'emr_db' },
        { label: 'LIS数据库', value: 'lis_db' },
        { label: 'PACS数据库', value: 'pacs_db' },
        { label: '数据仓库', value: 'dw_db' },
    ]

    // 表类型选项
    const tableTypeOptions = [
        { label: '全部表', value: 'all' },
        { label: '患者信息表', value: 'patient' },
        { label: '诊疗信息表', value: 'medical' },
        { label: '检查检验表', value: 'examination' },
        { label: '药品处方表', value: 'prescription' },
        { label: '手术信息表', value: 'surgery' },
    ]

    // 执行完整性检查
    const handleCompletenessCheck = async (_values: CompletenessFormValues) => {
        setLoading(true)
        try {
            // 模拟完整性检查过程
            await new Promise(resolve => setTimeout(resolve, 2500))

            // 模拟表级完整性结果
            const mockTableData: TableCompleteness[] = [
                {
                    key: '1',
                    tableName: 'patient_info',
                    tableComment: '患者基本信息表',
                    totalRecords: 50000,
                    completenessRate: 95.2,
                    incompleteRecords: 2400,
                    status: 'excellent',
                },
                {
                    key: '2',
                    tableName: 'medical_record',
                    tableComment: '病历记录表',
                    totalRecords: 120000,
                    completenessRate: 87.5,
                    incompleteRecords: 15000,
                    status: 'good',
                },
                {
                    key: '3',
                    tableName: 'examination_result',
                    tableComment: '检查结果表',
                    totalRecords: 80000,
                    completenessRate: 72.3,
                    incompleteRecords: 22160,
                    status: 'warning',
                },
                {
                    key: '4',
                    tableName: 'prescription_detail',
                    tableComment: '处方明细表',
                    totalRecords: 200000,
                    completenessRate: 91.8,
                    incompleteRecords: 16400,
                    status: 'excellent',
                },
                {
                    key: '5',
                    tableName: 'surgery_record',
                    tableComment: '手术信息表',
                    totalRecords: 15000,
                    completenessRate: 65.4,
                    incompleteRecords: 5190,
                    status: 'poor',
                },
            ]

            let filtered = mockTableData
            if (_values.tableFilter) {
                const q = _values.tableFilter.toLowerCase()
                filtered = filtered.filter(
                    item =>
                        item.tableName.toLowerCase().includes(q) ||
                        item.tableComment.toLowerCase().includes(q)
                )
            }
            if (_values.tableType && _values.tableType !== 'all') {
                const t = _values.tableType
                filtered = filtered.filter(item => item.tableName.includes(t))
            }

            setTableCompleteness(filtered)

            // 计算整体统计
            const totalTables = mockTableData.length
            const avgCompleteness = Math.round(
                mockTableData.reduce((sum, item) => sum + item.completenessRate, 0) / totalTables
            )
            const excellentTables = mockTableData.filter(item => item.status === 'excellent').length
            const poorTables = mockTableData.filter(item => item.status === 'poor').length

            setOverallStats({
                totalTables,
                avgCompleteness,
                excellentTables,
                poorTables,
            })

            uiMessage.success('完整性检查完成！')
        } catch (error) {
            logger.error(
                '完整性检查失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            uiMessage.error('完整性检查失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    // 查看表字段详情
    const handleViewTableDetail = (tableName: string) => {
        setSelectedTable(tableName)

        // 模拟字段级完整性数据
        const mockFieldData: FieldCompleteness[] = [
            {
                key: '1',
                fieldName: 'patient_id',
                fieldComment: '患者ID',
                dataType: 'VARCHAR(20)',
                totalRecords: 50000,
                filledRecords: 50000,
                emptyRecords: 0,
                fillRate: 100,
                isRequired: true,
            },
            {
                key: '2',
                fieldName: 'patient_name',
                fieldComment: '患者姓名',
                dataType: 'VARCHAR(50)',
                totalRecords: 50000,
                filledRecords: 49850,
                emptyRecords: 150,
                fillRate: 99.7,
                isRequired: true,
            },
            {
                key: '3',
                fieldName: 'id_card',
                fieldComment: '身份证号',
                dataType: 'VARCHAR(18)',
                totalRecords: 50000,
                filledRecords: 47500,
                emptyRecords: 2500,
                fillRate: 95.0,
                isRequired: true,
            },
            {
                key: '4',
                fieldName: 'phone',
                fieldComment: '联系电话',
                dataType: 'VARCHAR(15)',
                totalRecords: 50000,
                filledRecords: 42000,
                emptyRecords: 8000,
                fillRate: 84.0,
                isRequired: false,
            },
            {
                key: '5',
                fieldName: 'address',
                fieldComment: '家庭地址',
                dataType: 'VARCHAR(200)',
                totalRecords: 50000,
                filledRecords: 35000,
                emptyRecords: 15000,
                fillRate: 70.0,
                isRequired: false,
            },
        ]
        setFieldCompleteness(mockFieldData)
    }

    const exportCsv = (rows: Record<string, unknown>[], filename: string) => {
        try {
            if (!rows || rows.length === 0) {
                uiMessage.warning('暂无可导出的数据')
                return
            }
            const firstRow = rows[0]
            if (!firstRow) {
                uiMessage.warning('暂无可导出的数据')
                return
            }
            const headers = Object.keys(firstRow)
            const escape = (val: unknown) => {
                const s = String(val ?? '')
                const needQuote = /[",\n]/.test(s)
                const escaped = s.replace(/"/g, '""')
                return needQuote ? `"${escaped}"` : escaped
            }
            const csv = [
                headers.join(','),
                ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
            ].join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            window.URL.revokeObjectURL(url)
            uiMessage.success('导出成功')
        } catch (e) {
            logger.error('导出失败', e instanceof Error ? e : new Error(String(e)))
            uiMessage.error('导出失败，请重试')
        }
    }

    const handleExportTables = () => {
        const rows = tableCompleteness.map(t => ({
            tableName: t.tableName,
            tableComment: t.tableComment,
            totalRecords: t.totalRecords,
            completenessRate: t.completenessRate,
            incompleteRecords: t.incompleteRecords,
            status: t.status,
        }))
        exportCsv(rows, '完整性质控_表级.csv')
    }

    const handleExportFields = () => {
        const rows = fieldCompleteness.map(f => ({
            fieldName: f.fieldName,
            fieldComment: f.fieldComment,
            dataType: f.dataType,
            totalRecords: f.totalRecords,
            filledRecords: f.filledRecords,
            emptyRecords: f.emptyRecords,
            fillRate: f.fillRate,
            isRequired: f.isRequired ? '是' : '否',
        }))
        exportCsv(rows, `完整性质控_字段_${selectedTable || '未选择'}.csv`)
    }

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            if (!autoStart || loading) return
            try {
                await handleCompletenessCheck({ database: 'dw_db', tableType: 'all' })
            } finally {
                if (!cancelled) onAutoDone && onAutoDone()
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [autoStart])

    // 表级完整性表格列配置
    const tableColumns: ColumnsType<TableCompleteness> = [
        {
            title: '表名',
            dataIndex: 'tableName',
            key: 'tableName',
            width: 150,
            render: (text: string) => (
                <Text code style={{ fontSize: 12 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: '表注释',
            dataIndex: 'tableComment',
            key: 'tableComment',
            width: 150,
        },
        {
            title: '总记录数',
            dataIndex: 'totalRecords',
            key: 'totalRecords',
            width: 100,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '完整性',
            dataIndex: 'completenessRate',
            key: 'completenessRate',
            width: 120,
            render: (rate: number) => (
                <Progress
                    percent={rate}
                    size='small'
                    status={rate >= 90 ? 'success' : rate >= 70 ? 'active' : 'exception'}
                />
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: string) => {
                const statusConfig = {
                    excellent: { color: '#52c41a', text: '优秀' },
                    good: { color: '#1890ff', text: '良好' },
                    warning: { color: '#faad14', text: '警告' },
                    poor: { color: '#ff4d4f', text: '较差' },
                }
                const config = statusConfig[status as keyof typeof statusConfig]
                return <span style={{ color: config.color }}>{config.text}</span>
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button
                    type='link'
                    size='small'
                    icon={<SearchOutlined />}
                    onClick={() => handleViewTableDetail(record.tableName)}
                >
                    详情
                </Button>
            ),
        },
    ]

    // 字段级完整性表格列配置
    const fieldColumns: ColumnsType<FieldCompleteness> = [
        {
            title: '字段名',
            dataIndex: 'fieldName',
            key: 'fieldName',
            width: 120,
            render: (text: string, record) => (
                <Space>
                    <Text code style={{ fontSize: 12 }}>
                        {text}
                    </Text>
                    {record.isRequired && <span style={{ color: '#ff4d4f', fontSize: 12 }}>*</span>}
                </Space>
            ),
        },
        {
            title: '字段注释',
            dataIndex: 'fieldComment',
            key: 'fieldComment',
            width: 120,
        },
        {
            title: '数据类型',
            dataIndex: 'dataType',
            key: 'dataType',
            width: 100,
            render: (text: string) => (
                <Text type='secondary' style={{ fontSize: 12 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: '总记录',
            dataIndex: 'totalRecords',
            key: 'totalRecords',
            width: 80,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '已填充',
            dataIndex: 'filledRecords',
            key: 'filledRecords',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '空值',
            dataIndex: 'emptyRecords',
            key: 'emptyRecords',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#ff4d4f' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '填充率',
            dataIndex: 'fillRate',
            key: 'fillRate',
            width: 100,
            render: (rate: number, record) => (
                <Progress
                    percent={rate}
                    size='small'
                    status={
                        record.isRequired
                            ? rate >= 95
                                ? 'success'
                                : rate >= 80
                                  ? 'active'
                                  : 'exception'
                            : rate >= 80
                              ? 'success'
                              : rate >= 60
                                ? 'active'
                                : 'exception'
                    }
                />
            ),
        },
    ]

    return (
        <div>
            {/* 页面标题 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    <PieChartOutlined style={{ marginRight: 8 }} />
                    完整性质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='完整性质控功能'
                description='检查数据表和字段的填充率，识别空值和缺失数据，评估数据完整性水平。支持表级和字段级的详细分析。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 整体统计 */}
            {overallStats.totalTables > 0 && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='检查表数'
                                value={overallStats.totalTables}
                                suffix='张'
                                prefix={<TableOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='平均完整性'
                                value={overallStats.avgCompleteness}
                                suffix='%'
                                valueStyle={{
                                    color:
                                        overallStats.avgCompleteness >= 90
                                            ? '#52c41a'
                                            : overallStats.avgCompleteness >= 70
                                              ? '#1890ff'
                                              : '#ff4d4f',
                                }}
                                prefix={<PieChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='优秀表数'
                                value={overallStats.excellentTables}
                                suffix='张'
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='问题表数'
                                value={overallStats.poorTables}
                                suffix='张'
                                valueStyle={{ color: '#ff4d4f' }}
                                prefix={<ExclamationCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Row gutter={[16, 16]}>
                {/* 左侧：检查配置 */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <>
                                <DatabaseOutlined style={{ marginRight: 8 }} />
                                检查配置
                            </>
                        }
                    >
                        <Form
                            form={form}
                            layout='vertical'
                            onFinish={handleCompletenessCheck}
                            initialValues={{ database: 'dw_db', tableType: 'all', tableFilter: '' }}
                        >
                            <Form.Item
                                label='选择数据库'
                                name='database'
                                rules={[{ required: true, message: '请选择数据库' }]}
                            >
                                <Select
                                    placeholder='请选择要检查的数据库'
                                    options={databaseOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item
                                label='表类型'
                                name='tableType'
                                rules={[{ required: true, message: '请选择表类型' }]}
                            >
                                <Select
                                    placeholder='请选择表类型'
                                    options={tableTypeOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item label='表名过滤' name='tableFilter'>
                                <Input placeholder='输入表名关键字（可选）' size='large' />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type='primary'
                                    htmlType='submit'
                                    loading={loading}
                                    icon={<SearchOutlined />}
                                    size='large'
                                    block
                                >
                                    开始完整性检查
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                {/* 右侧：检查结果 */}
                <Col xs={24} lg={16}>
                    {/* 表级完整性结果 */}
                    <Card
                        title={
                            <>
                                <TableOutlined style={{ marginRight: 8 }} />
                                表级完整性
                            </>
                        }
                        extra={
                            tableCompleteness.length > 0 ? (
                                <Button type='link' onClick={handleExportTables}>
                                    导出CSV
                                </Button>
                            ) : undefined
                        }
                        style={{ marginBottom: 16 }}
                    >
                        {tableCompleteness.length > 0 ? (
                            <Table
                                columns={tableColumns}
                                dataSource={tableCompleteness}
                                pagination={{ pageSize: 10 }}
                                size='middle'
                                scroll={{ x: 800 }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                <PieChartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                <div>暂无检查结果</div>
                                <div style={{ fontSize: 12, marginTop: 8 }}>请先执行完整性检查</div>
                            </div>
                        )}
                    </Card>

                    {/* 字段级完整性结果 */}
                    {fieldCompleteness.length > 0 && (
                        <Card
                            title={
                                <>
                                    <DatabaseOutlined style={{ marginRight: 8 }} />
                                    字段级完整性 - {selectedTable}
                                </>
                            }
                            extra={
                                fieldCompleteness.length > 0 ? (
                                    <Space>
                                        <Button
                                            type='link'
                                            onClick={() => setShowRequiredOnly(s => !s)}
                                        >
                                            {showRequiredOnly ? '显示全部字段' : '仅显示必填字段'}
                                        </Button>
                                        <Button type='link' onClick={handleExportFields}>
                                            导出CSV
                                        </Button>
                                    </Space>
                                ) : undefined
                            }
                        >
                            <Table
                                columns={fieldColumns}
                                dataSource={
                                    showRequiredOnly
                                        ? fieldCompleteness.filter(f => f.isRequired)
                                        : fieldCompleteness
                                }
                                pagination={false}
                                size='middle'
                                scroll={{ x: 800 }}
                            />
                        </Card>
                    )}
                </Col>
            </Row>
        </div>
    )
}

export default CompletenessQualityControl
