import { ClockCircleOutlined, EyeOutlined } from '@ant-design/icons'
import {
    Alert,
    Button,
    DatePicker,
    Form,
    Input,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
    Spin,
} from 'antd'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'
import styles from './ExecutionHistory.module.scss'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import { logger } from '@/utils/logger'
import { uiMessage } from '@/utils/uiMessage'
import type { QCTaskHistoryItem, QCTaskHistoryPageParams } from '@/types'

const { Title } = Typography
const { RangePicker } = DatePicker

// 状态映射
const statusConfig: Record<number, { label: string; color: string }> = {
    0: { label: '未执行', color: 'default' },
    1: { label: '执行中', color: 'processing' },
    2: { label: '已完成', color: 'success' },
    3: { label: '暂停', color: 'warning' },
    4: { label: '跳过', color: 'default' },
    5: { label: '失败', color: 'error' },
}

// nodeType 到内部类型的映射
const NODE_TYPE_TO_VALUE_MAP: Record<string, string> = {
    TimelinessQC: 'comprehensive',
    CompletenessQC: 'completeness',
    ConsistencyQC: 'basic-medical-logic',
    AccuracyQC: 'core-data',
}

// 内部类型到标签的映射
const typeLabel = (t: string) => {
    const map: Record<string, string> = {
        text: '可靠性质控',
        comprehensive: '及时性质控',
        completeness: '完整性质控',
        'basic-medical-logic': '一致性质控',
        'core-data': '准确性质控',
    }
    return map[t] || t
}

const ExecutionHistory: React.FC = () => {
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<QCTaskHistoryItem[]>([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    })

    const qcOptions = [
        { label: typeLabel('text'), value: 'text' },
        { label: typeLabel('comprehensive'), value: 'comprehensive' },
        { label: typeLabel('completeness'), value: 'completeness' },
        { label: typeLabel('basic-medical-logic'), value: 'basic-medical-logic' },
        { label: typeLabel('core-data'), value: 'core-data' },
    ]

    // 获取执行历史数据
    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true)
            const values = form.getFieldsValue()

            // 构建请求参数
            const params: QCTaskHistoryPageParams = {
                pageNum: pagination.current,
                pageSize: pagination.pageSize,
                sortField: 'create_time',
                sortOrder: 'desc',
            }

            // 添加筛选条件
            if (values.idOrName) {
                params.idOrName = values.idOrName.trim()
            }

            if (values.status !== undefined && values.status !== null) {
                params.status = values.status
            }

            if (values.taskTypes && values.taskTypes.length > 0) {
                // 将内部类型值转换为 nodeType
                const nodeTypes = values.taskTypes.map((value: string) => {
                    // 反向查找 nodeType
                    for (const [nodeType, mappedValue] of Object.entries(NODE_TYPE_TO_VALUE_MAP)) {
                        if (mappedValue === value) {
                            return nodeType
                        }
                    }
                    return value // 如果找不到映射，直接使用原值
                })
                params.taskTypes = nodeTypes
            }

            // 处理时间范围
            if (values.timeRange && values.timeRange.length === 2) {
                const [start, end] = values.timeRange as [Dayjs, Dayjs]
                if (start) {
                    params.startTimeFrom = start.format('YYYY-MM-DD HH:mm:ss')
                }
                if (end) {
                    params.startTimeTo = end.format('YYYY-MM-DD HH:mm:ss')
                }
            }

            logger.info('获取质控执行历史列表', params)
            const response = await dataQualityControlService.getQCTaskHistoryPage(params)

            if (response.code === 200 && response.data) {
                setData(response.data.records || [])
                setPagination(prev => ({
                    ...prev,
                    total: parseInt(response.data.total || '0', 10),
                }))
                logger.info('成功获取质控执行历史列表', {
                    count: response.data.records?.length || 0,
                    total: response.data.total,
                })
            } else {
                const errorMsg = response.msg || '获取执行历史失败'
                uiMessage.error(errorMsg)
                logger.error('获取质控执行历史列表失败', errorMsg)
                setData([])
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '获取执行历史时发生未知错误'
            logger.error('获取质控执行历史列表异常', error instanceof Error ? error : new Error(errorMsg))
            uiMessage.error(errorMsg)
            setData([])
        } finally {
            setLoading(false)
        }
    }, [form, pagination.current, pagination.pageSize])

    // 初始加载和筛选条件变化时重新获取数据
    useEffect(() => {
        fetchHistory()
    }, [pagination.current, pagination.pageSize])

    // 处理搜索
    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }))
        fetchHistory()
    }

    // 处理清空
    const handleReset = () => {
        form.resetFields()
        setPagination(prev => ({ ...prev, current: 1 }))
        // 延迟执行，确保表单已重置
        setTimeout(() => {
            fetchHistory()
        }, 0)
    }

    // 处理分页变化
    const handleTableChange = (page: number, pageSize: number) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: pageSize,
        }))
    }

    // 计算表格滚动高度（动态计算，避免触发浏览器滚动条）
    const tableScrollHeight = useMemo(() => {
        if (typeof window === 'undefined') {
            return 600 // 服务端渲染时的默认值
        }
        
        // 计算页面其他元素占用的高度（更保守的估算）
        // 标题：约 64px (40px + 24px margin)
        // Alert：约 84px (60px + 24px margin)
        // 筛选区域：约 140px (根据实际内容，可能有多行，预留更多空间)
        // 表格包装器 padding：32px (16px * 2)
        // 分页器：约 80px (包含分页信息和控件，20条分页时可能需要更多空间)
        // 页面整体 padding/margin：约 50px
        // 安全边距：约 100px (为不同屏幕尺寸和分页大小预留更多空间)
        const reservedHeight = 64 + 84 + 140 + 32 + 80 + 50 + 100
        
        // 使用更保守的计算，确保不会触发浏览器滚动条
        const calculatedHeight = window.innerHeight - reservedHeight
        
        // 设置最小高度，确保至少能显示几条数据
        const minHeight = 400
        // 设置最大高度，避免表格过高
        const maxHeight = 700
        
        const finalHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight))
        
        return `${finalHeight}px`
    }, [])

    // 解析任务类型
    const parseTaskTypes = (taskTypes: string): string[] => {
        if (!taskTypes) return []
        return taskTypes.split(',').map(type => {
            const trimmed = type.trim()
            // 将 nodeType 转换为内部类型值
            return NODE_TYPE_TO_VALUE_MAP[trimmed] || trimmed
        })
    }

    const columns = useMemo(
        () => [
            {
                title: '任务ID',
                dataIndex: 'batchId',
                key: 'batchId',
                width: 200,
                render: (text: string, record: QCTaskHistoryItem) => (
                    <span
                        style={{ cursor: 'pointer', color: '#1890ff' }}
                        onClick={() => {
                            const types = parseTaskTypes(record.taskTypes)
                            const typesParam = types.join(',')
                            navigate(
                                `/data-quality-control/flow/${record.batchId}?types=${encodeURIComponent(typesParam)}`
                            )
                        }}
                    >
                        {text}
                    </span>
                ),
            },
            {
                title: '任务名称',
                dataIndex: 'name',
                key: 'name',
                width: 200,
            },
            {
                title: '质控类型',
                dataIndex: 'typeNames',
                key: 'typeNames',
                render: (typeNames: string, record: QCTaskHistoryItem) => {
                    const types = parseTaskTypes(record.taskTypes)
                    const names = typeNames ? typeNames.split(',') : []
                    return (
                        <>
                            {types.map((type, index) => (
                                <Tag key={type} color='blue' style={{ marginBottom: 4 }}>
                                    {names[index] || typeLabel(type)}
                                </Tag>
                            ))}
                        </>
                    )
                },
            },
            {
                title: '概览',
                dataIndex: 'overview',
                key: 'overview',
                render: (overview: string | null) => overview || '-',
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 100,
                render: (status: number) => {
                    const config = statusConfig[status] || statusConfig[0]
                    return <Tag color={config.color}>{config.label}</Tag>
                },
            },
            {
                title: '开始时间',
                dataIndex: 'startTime',
                key: 'startTime',
                width: 180,
                render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
            },
            {
                title: '结束时间',
                dataIndex: 'endTime',
                key: 'endTime',
                width: 180,
                render: (time: string | null) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
            },
            {
                title: '时长',
                key: 'duration',
                width: 120,
                render: (_: unknown, record: QCTaskHistoryItem) => {
                    if (!record.startTime) return '-'
                    const start = dayjs(record.startTime)
                    const end = record.endTime ? dayjs(record.endTime) : dayjs()
                    const duration = end.diff(start, 'minute')
                    return duration > 0 ? `${duration} 分钟` : '< 1 分钟'
                },
            },
            {
                title: '操作',
                key: 'action',
                width: 120,
                fixed: 'right' as const,
                render: (_: unknown, record: QCTaskHistoryItem) => {
                    const types = parseTaskTypes(record.taskTypes)
                    const typesParam = types.join(',')
                    return (
                        <Button
                            type='link'
                            icon={<EyeOutlined />}
                            onClick={() => {
                                navigate(
                                    `/data-quality-control/flow/${record.batchId}?types=${encodeURIComponent(typesParam)}`
                                )
                            }}
                        >
                            查看详情
                        </Button>
                    )
                },
            },
        ],
        [navigate]
    )

    return (
        <div className={styles.pageWrapper}>
            <Title level={2} className={styles.pageHeader}>
                <ClockCircleOutlined style={{ marginRight: 8 }} /> 质控执行历史
            </Title>
            <Alert
                message='查看并筛选历史质控流程执行记录，支持按任务ID、状态、质控类型及时间范围进行高级搜索。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <div className={styles.filtersWrapper}>
                <Form
                    form={form}
                    layout='inline'
                    className={styles.filtersForm}
                >
                    <Form.Item name='idOrName' label='任务ID/名称' className={styles.filterItem}>
                        <Input
                            placeholder='输入任务ID或名称关键词'
                            allowClear
                            style={{ width: '100%' }}
                            onPressEnter={handleSearch}
                        />
                    </Form.Item>
                    <Form.Item name='status' label='状态' className={styles.filterItem}>
                        <Select
                            allowClear
                            placeholder='选择状态'
                            options={[
                                { label: '未执行', value: 0 },
                                { label: '执行中', value: 1 },
                                { label: '已完成', value: 2 },
                                { label: '暂停', value: 3 },
                                { label: '跳过', value: 4 },
                                { label: '失败', value: 5 },
                            ]}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item name='taskTypes' label='质控类型' className={styles.filterItem}>
                        <Select
                            mode='multiple'
                            allowClear
                            placeholder='选择质控类型'
                            options={qcOptions}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item name='timeRange' label='时间范围' className={styles.filterItem}>
                        <RangePicker
                            showTime
                            format='YYYY-MM-DD HH:mm:ss'
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item className={styles.filterActions}>
                        <Space>
                            <Button onClick={handleReset}>清空</Button>
                            <Button type='primary' onClick={handleSearch} loading={loading}>
                                搜索
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
            <div className={styles.tableWrapper}>
                <Spin spinning={loading}>
                    <Table
                        rowKey='id'
                        dataSource={data}
                        columns={columns}
                        scroll={{ y: tableScrollHeight, x: 'max-content' }}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                            onChange: handleTableChange,
                            onShowSizeChange: handleTableChange,
                        }}
                    />
                </Spin>
            </div>
        </div>
    )
}

export default ExecutionHistory
