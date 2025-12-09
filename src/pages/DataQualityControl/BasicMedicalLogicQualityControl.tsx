import {
    BarChartOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    LinkOutlined,
    SearchOutlined,
    TableOutlined,
    WarningOutlined,
} from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Modal,
    Progress,
    Row,
    Select,
    Statistic,
    Table,
    Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useEffect, useState } from 'react'
import uiMessage from '@/utils/uiMessage'
import { logger } from '@/utils/logger'

const { Title, Text } = Typography

interface TableRelation {
    key: string
    mainTable: string
    mainTableComment: string
    subTable: string
    subTableComment: string
    relationField: string
    mainCount: number
    subCount: number
    matchedCount: number
    unmatchedCount: number
    matchRate: number
    status: 'normal' | 'warning' | 'error'
}

interface LogicCheckResult {
    key: string
    checkType: string
    description: string
    totalChecked: number
    passedCount: number
    failedCount: number
    passRate: number
    errorDetails: string[]
}

interface LogicFormValues {
    module: string
    checkType: string
}

type AutoProps = { autoStart?: boolean; onAutoDone?: () => void }

const BasicMedicalLogicQualityControl: React.FC<AutoProps> = ({ autoStart, onAutoDone }) => {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [tableRelations, setTableRelations] = useState<TableRelation[]>([])
    const [logicResults, setLogicResults] = useState<LogicCheckResult[]>([])
    const [overallStats, setOverallStats] = useState({
        totalRelations: 0,
        normalRelations: 0,
        warningRelations: 0,
        errorRelations: 0,
        avgMatchRate: 0,
    })
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [detailModalContent, setDetailModalContent] = useState<{
        title: string
        content: string
    } | null>(null)

    // 业务模块选项
    const moduleOptions = [
        { label: '全部模块', value: 'all' },
        { label: '门诊业务', value: 'outpatient' },
        { label: '住院业务', value: 'inpatient' },
        { label: '检查检验', value: 'examination' },
        { label: '药品管理', value: 'pharmacy' },
        { label: '手术管理', value: 'surgery' },
        { label: '护理管理', value: 'nursing' },
    ]

    // 检查类型选项
    const checkTypeOptions = [
        { label: '主附表关联检查', value: 'relation_check' },
        { label: '数据一致性检查', value: 'consistency_check' },
        { label: '业务逻辑检查', value: 'logic_check' },
        { label: '时间逻辑检查', value: 'time_check' },
    ]

    // 执行医疗逻辑检查
    const handleLogicCheck = async (_values: LogicFormValues) => {
        setLoading(true)
        try {
            // 模拟检查过程
            await new Promise(resolve => setTimeout(resolve, 3000))

            // 模拟主附表关联检查结果
            const mockRelations: TableRelation[] = [
                {
                    key: '1',
                    mainTable: 'patient_visit',
                    mainTableComment: '患者就诊记录',
                    subTable: 'diagnosis_record',
                    subTableComment: '诊断记录',
                    relationField: 'visit_id',
                    mainCount: 50000,
                    subCount: 48500,
                    matchedCount: 48500,
                    unmatchedCount: 0,
                    matchRate: 100,
                    status: 'normal',
                },
                {
                    key: '2',
                    mainTable: 'patient_visit',
                    mainTableComment: '患者就诊记录',
                    subTable: 'prescription_master',
                    subTableComment: '处方主表',
                    relationField: 'visit_id',
                    mainCount: 50000,
                    subCount: 35000,
                    matchedCount: 34800,
                    unmatchedCount: 200,
                    matchRate: 99.4,
                    status: 'normal',
                },
                {
                    key: '3',
                    mainTable: 'prescription_master',
                    mainTableComment: '处方主表',
                    subTable: 'prescription_detail',
                    subTableComment: '处方明细',
                    relationField: 'prescription_id',
                    mainCount: 35000,
                    subCount: 120000,
                    matchedCount: 118500,
                    unmatchedCount: 1500,
                    matchRate: 98.8,
                    status: 'warning',
                },
                {
                    key: '4',
                    mainTable: 'examination_apply',
                    mainTableComment: '检查申请',
                    subTable: 'examination_result',
                    subTableComment: '检查结果',
                    relationField: 'apply_id',
                    mainCount: 25000,
                    subCount: 22000,
                    matchedCount: 21500,
                    unmatchedCount: 500,
                    matchRate: 97.7,
                    status: 'warning',
                },
                {
                    key: '5',
                    mainTable: 'surgery_apply',
                    mainTableComment: '手术申请',
                    subTable: 'surgery_record',
                    subTableComment: '手术记录',
                    relationField: 'apply_id',
                    mainCount: 8000,
                    subCount: 7200,
                    matchedCount: 6800,
                    unmatchedCount: 400,
                    matchRate: 94.4,
                    status: 'error',
                },
            ]

            // 模拟逻辑检查结果
            const mockLogicResults: LogicCheckResult[] = [
                {
                    key: '1',
                    checkType: '时间逻辑检查',
                    description: '入院时间应早于出院时间',
                    totalChecked: 15000,
                    passedCount: 14850,
                    failedCount: 150,
                    passRate: 99.0,
                    errorDetails: [
                        '患者ID: P001234 - 入院时间晚于出院时间',
                        '患者ID: P005678 - 入院时间晚于出院时间',
                    ],
                },
                {
                    key: '2',
                    checkType: '年龄逻辑检查',
                    description: '患者年龄应在合理范围内(0-150岁)',
                    totalChecked: 50000,
                    passedCount: 49800,
                    failedCount: 200,
                    passRate: 99.6,
                    errorDetails: ['患者ID: P002345 - 年龄为-5岁', '患者ID: P006789 - 年龄为200岁'],
                },
                {
                    key: '3',
                    checkType: '药品剂量检查',
                    description: '药品单次剂量应在安全范围内',
                    totalChecked: 120000,
                    passedCount: 115000,
                    failedCount: 5000,
                    passRate: 95.8,
                    errorDetails: [
                        '处方ID: R003456 - 阿司匹林剂量过大',
                        '处方ID: R007890 - 胰岛素剂量异常',
                    ],
                },
                {
                    key: '4',
                    checkType: '性别逻辑检查',
                    description: '妇科疾病诊断应匹配女性患者',
                    totalChecked: 8000,
                    passedCount: 7920,
                    failedCount: 80,
                    passRate: 99.0,
                    errorDetails: [
                        '诊断ID: D004567 - 男性患者诊断妇科疾病',
                        '诊断ID: D008901 - 男性患者诊断妇科疾病',
                    ],
                },
            ]

            setTableRelations(mockRelations)
            setLogicResults(mockLogicResults)

            // 计算整体统计
            const totalRelations = mockRelations.length
            const normalRelations = mockRelations.filter(r => r.status === 'normal').length
            const warningRelations = mockRelations.filter(r => r.status === 'warning').length
            const errorRelations = mockRelations.filter(r => r.status === 'error').length
            const avgMatchRate = Math.round(
                mockRelations.reduce((sum, r) => sum + r.matchRate, 0) / totalRelations
            )

            setOverallStats({
                totalRelations,
                normalRelations,
                warningRelations,
                errorRelations,
                avgMatchRate,
            })

            uiMessage.success('医疗逻辑检查完成！')
        } catch (error) {
            logger.error(
                '医疗逻辑检查失败:',
                error instanceof Error ? error : new Error(String(error))
            )
            uiMessage.error('医疗逻辑检查失败，请重试')
        } finally {
            setLoading(false)
        }
    }



    useEffect(() => {
        let cancelled = false
        const run = async () => {
            if (!autoStart || loading) return
            try {
                await handleLogicCheck({ module: 'all', checkType: 'relation_check' })
            } finally {
                if (!cancelled) onAutoDone && onAutoDone()
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [autoStart])

    // 主附表关联表格列配置
    const relationColumns: ColumnsType<TableRelation> = [
        {
            title: '主表',
            dataIndex: 'mainTable',
            key: 'mainTable',
            width: 120,
            render: (text: string, record) => (
                <div>
                    <Text code style={{ fontSize: 12 }}>
                        {text}
                    </Text>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        {record.mainTableComment}
                    </div>
                </div>
            ),
        },
        {
            title: '附表',
            dataIndex: 'subTable',
            key: 'subTable',
            width: 120,
            render: (text: string, record) => (
                <div>
                    <Text code style={{ fontSize: 12 }}>
                        {text}
                    </Text>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                        {record.subTableComment}
                    </div>
                </div>
            ),
        },
        {
            title: '关联字段',
            dataIndex: 'relationField',
            key: 'relationField',
            width: 100,
            render: (text: string) => (
                <Text code style={{ fontSize: 12 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: '主表记录',
            dataIndex: 'mainCount',
            key: 'mainCount',
            width: 80,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '附表记录',
            dataIndex: 'subCount',
            key: 'subCount',
            width: 80,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '匹配记录',
            dataIndex: 'matchedCount',
            key: 'matchedCount',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '未匹配',
            dataIndex: 'unmatchedCount',
            key: 'unmatchedCount',
            width: 80,
            render: (value: number) => (
                <span style={{ color: value > 0 ? '#ff4d4f' : '#52c41a' }}>
                    {value.toLocaleString()}
                </span>
            ),
        },
        {
            title: '匹配率',
            dataIndex: 'matchRate',
            key: 'matchRate',
            width: 100,
            render: (rate: number) => (
                <Progress
                    percent={rate}
                    size='small'
                    status={rate >= 99 ? 'success' : rate >= 95 ? 'active' : 'exception'}
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
                    normal: { color: '#52c41a', text: '正常', icon: <CheckCircleOutlined /> },
                    warning: { color: '#faad14', text: '警告', icon: <WarningOutlined /> },
                    error: { color: '#ff4d4f', text: '异常', icon: <ExclamationCircleOutlined /> },
                }
                const config = statusConfig[status as keyof typeof statusConfig]
                return (
                    <span style={{ color: config.color }}>
                        {config.icon} {config.text}
                    </span>
                )
            },
        },
    ]

    // 逻辑检查结果表格列配置
    const logicColumns: ColumnsType<LogicCheckResult> = [
        {
            title: '检查类型',
            dataIndex: 'checkType',
            key: 'checkType',
            width: 120,
        },
        {
            title: '检查描述',
            dataIndex: 'description',
            key: 'description',
            width: 200,
        },
        {
            title: '检查总数',
            dataIndex: 'totalChecked',
            key: 'totalChecked',
            width: 80,
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: '通过数',
            dataIndex: 'passedCount',
            key: 'passedCount',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#52c41a' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '失败数',
            dataIndex: 'failedCount',
            key: 'failedCount',
            width: 80,
            render: (value: number) => (
                <span style={{ color: '#ff4d4f' }}>{value.toLocaleString()}</span>
            ),
        },
        {
            title: '通过率',
            dataIndex: 'passRate',
            key: 'passRate',
            width: 100,
            render: (rate: number) => (
                <Progress
                    percent={rate}
                    size='small'
                    status={rate >= 98 ? 'success' : rate >= 95 ? 'active' : 'exception'}
                />
            ),
        },
        {
            title: '错误示例',
            dataIndex: 'errorDetails',
            key: 'errorDetails',
            render: (details: string[], record) => (
                <div>
                    {details.slice(0, 2).map((detail, index) => (
                        <div key={index} style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                            {detail}
                        </div>
                    ))}
                    <Button
                        type='link'
                        size='small'
                        onClick={() => {
                            setDetailModalContent({
                                title: record.checkType,
                                content: details.join('\n'),
                            })
                            setDetailModalVisible(true)
                        }}
                    >
                        查看全部
                    </Button>
                </div>
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
                    <LinkOutlined style={{ marginRight: 8 }} />
                    一致性质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='一致性质控功能'
                description='检查主附表数据关联关系与规则一致性，包含时间、年龄、性别等基础逻辑校验，识别不一致与异常。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 整体统计 */}
            {overallStats.totalRelations > 0 && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='检查关系数'
                                value={overallStats.totalRelations}
                                suffix='个'
                                prefix={<LinkOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='平均匹配率'
                                value={overallStats.avgMatchRate}
                                suffix='%'
                                valueStyle={{
                                    color:
                                        overallStats.avgMatchRate >= 99
                                            ? '#52c41a'
                                            : overallStats.avgMatchRate >= 95
                                              ? '#1890ff'
                                              : '#ff4d4f',
                                }}
                                prefix={<BarChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='正常关系'
                                value={overallStats.normalRelations}
                                suffix='个'
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title='异常关系'
                                value={overallStats.errorRelations}
                                suffix='个'
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
                                <LinkOutlined style={{ marginRight: 8 }} />
                                检查配置
                            </>
                        }
                    >
                        <Form
                            form={form}
                            layout='vertical'
                            onFinish={handleLogicCheck}
                            initialValues={{ module: 'all', checkType: 'relation_check' }}
                        >
                            <Form.Item
                                label='业务模块'
                                name='module'
                                rules={[{ required: true, message: '请选择业务模块' }]}
                            >
                                <Select
                                    placeholder='请选择要检查的业务模块'
                                    options={moduleOptions}
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item
                                label='检查类型'
                                name='checkType'
                                rules={[{ required: true, message: '请选择检查类型' }]}
                            >
                                <Select
                                    placeholder='请选择检查类型'
                                    options={checkTypeOptions}
                                    size='large'
                                />
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
                                    开始逻辑检查
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                {/* 右侧：检查结果 */}
                <Col xs={24} lg={16}>
                    {/* 主附表关联检查 */}
                    <Card
                        title={
                            <>
                                <TableOutlined style={{ marginRight: 8 }} />
                                主附表关联检查
                            </>
                        }
                        style={{ marginBottom: 16 }}
                    >
                        {tableRelations.length > 0 ? (
                            <Table
                                columns={relationColumns}
                                dataSource={tableRelations}
                                pagination={false}
                                size='middle'
                                scroll={{ x: 1000 }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                <LinkOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                                <div>暂无检查结果</div>
                                <div style={{ fontSize: 12, marginTop: 8 }}>
                                    请先执行医疗逻辑检查
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* 业务逻辑检查结果 */}
                    {logicResults.length > 0 && (
                        <Card
                            title={
                                <>
                                    <CheckCircleOutlined style={{ marginRight: 8 }} />
                                    业务逻辑检查
                                </>
                            }
                        >
                            <Table
                                columns={logicColumns}
                                dataSource={logicResults}
                                pagination={false}
                                size='middle'
                                scroll={{ x: 1000 }}
                            />
                        </Card>
                    )}
                </Col>
            </Row>
            <Modal
                title={detailModalContent?.title}
                open={detailModalVisible}
                onOk={() => setDetailModalVisible(false)}
                onCancel={() => setDetailModalVisible(false)}
                width={700}
            >
                <pre style={{ whiteSpace: 'pre-wrap' }}>{detailModalContent?.content}</pre>
            </Modal>
        </div>
    )
}

export default BasicMedicalLogicQualityControl
