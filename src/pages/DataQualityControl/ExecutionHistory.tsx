import { ClockCircleOutlined } from '@ant-design/icons'
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
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dataQualityControlService } from '@/services/dataQualityControlService'
import type { QCTaskRecord, QCTaskPageParams } from '@/types'
import { useApi } from '@/hooks/useApi'
import styles from './ExecutionHistory.module.scss'

const { Title } = Typography
const { RangePicker } = DatePicker

/**
 * 质控类型映射
 */
const QC_TYPE_MAP: Record<string, string> = {
    ReliabilityQC: '可靠性质控',
    TimelinessQC: '及时性质控',
    CompletenessQC: '完整性质控',
    ConsistencyQC: '一致性质控',
    AccuracyQC: '准确性质控',
}

/**
 * 质控类型描述映射
 */
const QC_TYPE_DESC_MAP: Record<string, string> = {
    ReliabilityQC: '评估文本规范、完整性与字符合规，保障数据可信与稳定',
    TimelinessQC: '关注刷新延迟、准点率与实时管道稳定性，提升数据时效',
    CompletenessQC: '表与字段填充率检查，识别空值与缺失，输出完整性分析',
    ConsistencyQC: '主附表关联与基础规则一致性校验，排查不一致与异常',
    AccuracyQC: '核心数据编码与字段值准确性评估，并进行对比分析',
}

/**
 * 状态映射：数字 -> 字符串
 */
const STATUS_MAP: Record<number, { label: string; color: string }> = {
    0: { label: '未执行', color: 'default' },
    1: { label: '执行中', color: 'processing' },
    2: { label: '已完成', color: 'success' },
    3: { label: '暂停', color: 'warning' },
    4: { label: '跳过', color: 'default' },
    5: { label: '失败', color: 'error' },
}

/**
 * 质控执行历史页面
 */
const ExecutionHistory: React.FC = () => {
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [pageNum, setPageNum] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)

    // 使用 useApi hook 调用接口
    const {
        data: pageData,
        loading,
        execute: fetchData,
    } = useApi(dataQualityControlService.getQCTaskPage, {
        immediate: false,
    })

    /**
     * 获取质控任务列表
     */
    const loadData = useCallback(async () => {
        try {
            const values = form.getFieldsValue()
            
            // 构建查询参数
            const params: QCTaskPageParams = {
                pageNum,
                pageSize,
            }

            // 任务ID或名称
            if (values.idOrName) {
                params.idOrName = values.idOrName.trim()
            }

            // 状态筛选（将字符串状态转换为数字）
            if (values.status && values.status.length > 0) {
                // 如果后端支持多个状态，可以传数组；否则取第一个
                const statusValue = values.status[0]
                const statusMap: Record<string, number> = {
                    starting: 0,
                    running: 1,
                    completed: 2,
                    paused: 3,
                    skipped: 4,
                    error: 5,
                }
                if (statusMap[statusValue] !== undefined) {
                    params.status = statusMap[statusValue]
                }
            }

            // 质控类型筛选
            if (values.taskTypes && values.taskTypes.length > 0) {
                // 将前端类型值转换为后端类型值
                const typeMap: Record<string, string> = {
                    text: 'ReliabilityQC',
                    comprehensive: 'TimelinessQC',
                    completeness: 'CompletenessQC',
                    'basic-medical-logic': 'ConsistencyQC',
                    'core-data': 'AccuracyQC',
                }
                const backendTypes = values.taskTypes.map((t: string) => typeMap[t] || t)
                params.taskTypes = backendTypes
            }

            // 时间范围筛选
            if (values.timeRange && values.timeRange.length === 2) {
                const [start, end] = values.timeRange as [Dayjs, Dayjs]
                if (start) {
                    params.startTimeFrom = start.format('YYYY-MM-DD HH:mm:ss')
                }
                if (end) {
                    params.startTimeTo = end.format('YYYY-MM-DD HH:mm:ss')
                }
            }

            // 排序（如果需要）
            // params.sortField = 'startTime'
            // params.sortOrder = 'desc'

            await fetchData(params)
        } catch (error) {
            message.error(
                `加载数据失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }, [pageNum, pageSize, form, fetchData])

    // 初始加载和参数变化时重新加载
    useEffect(() => {
        loadData()
    }, [loadData])

    /**
     * 处理搜索
     */
    const handleSearch = useCallback(() => {
        setPageNum(1) // 重置到第一页
        loadData()
    }, [loadData])

    /**
     * 处理清空
     */
    const handleReset = useCallback(() => {
        form.resetFields()
        setPageNum(1)
        // 清空后会自动触发 loadData（通过 useEffect）
    }, [form])

    /**
     * 处理分页变化
     */
    const handleTableChange = useCallback(
        (newPageNum: number, newPageSize: number) => {
            setPageNum(newPageNum)
            setPageSize(newPageSize)
        },
        []
    )

    /**
     * 处理行点击，跳转到详情页
     */
    const handleRowClick = useCallback(
        (record: QCTaskRecord) => {
            navigate(`/data-quality-control/flow/${record.batchId}`)
        },
        [navigate]
    )

    // 表格列定义
    const columns: ColumnsType<QCTaskRecord> = useMemo(
        () => [
            {
                title: '任务ID',
                dataIndex: 'id',
                key: 'id',
                width: 120,
            },
            {
                title: '任务名称',
                dataIndex: 'name',
                key: 'name',
                width: 200,
                ellipsis: true,
            },
            {
                title: '质控类型',
                dataIndex: 'typeNames',
                key: 'typeNames',
                width: 150,
                render: (typeNames: string, record: QCTaskRecord) => {
                    // 解析任务类型（可能是逗号分隔的字符串）
                    const types = record.taskTypes
                        ? record.taskTypes.split(',').filter(Boolean)
                        : []
                    
                    if (types.length === 0 && typeNames) {
                        // 如果没有 taskTypes，使用 typeNames
                        return (
                            <Tooltip title={QC_TYPE_DESC_MAP[record.nodeType] || typeNames}>
                                <Tag color='blue'>{typeNames}</Tag>
                            </Tooltip>
                        )
                    }

                    return (
                        <>
                            {types.map((type, index) => {
                                const typeName = QC_TYPE_MAP[type] || type
                                const desc = QC_TYPE_DESC_MAP[type] || ''
                                return (
                                    <Tooltip key={index} title={desc}>
                                        <Tag color='blue' style={{ marginBottom: 4 }}>
                                            {typeName}
                                        </Tag>
                                    </Tooltip>
                                )
                            })}
                        </>
                    )
                },
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 100,
                render: (status: number) => {
                    const statusInfo = STATUS_MAP[status] || { label: '未知', color: 'default' }
                    return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                },
            },
            {
                title: '开始时间',
                dataIndex: 'startTime',
                key: 'startTime',
                width: 180,
                render: (time: string) => {
                    return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
                },
            },
            {
                title: '结束时间',
                dataIndex: 'endTime',
                key: 'endTime',
                width: 180,
                render: (time: string | null) => {
                    return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
                },
            },
            {
                title: '时长',
                key: 'duration',
                width: 120,
                render: (_: unknown, record: QCTaskRecord) => {
                    if (!record.startTime) return '-'
                    const start = dayjs(record.startTime)
                    const end = record.endTime ? dayjs(record.endTime) : dayjs()
                    const duration = end.diff(start, 'minute')
                    return duration > 0 ? `${duration} 分钟` : '< 1 分钟'
                },
            },
            {
                title: '概览',
                dataIndex: 'overview',
                key: 'overview',
                ellipsis: true,
                render: (overview: string | null) => {
                    return overview || '-'
                },
            },
        ],
        []
    )

    // 更新总数
    useEffect(() => {
        if (pageData?.data) {
            setTotal(Number.parseInt(pageData.data.total || '0', 10))
        }
    }, [pageData])

    // 质控类型选项（用于筛选）
    const qcTypeOptions = useMemo(
        () => [
            { label: '可靠性质控', value: 'text' },
            { label: '及时性质控', value: 'comprehensive' },
            { label: '完整性质控', value: 'completeness' },
            { label: '一致性质控', value: 'basic-medical-logic' },
            { label: '准确性质控', value: 'core-data' },
        ],
        []
    )

    // 状态选项（用于筛选）
    const statusOptions = useMemo(
        () => [
            { label: '未执行', value: 'starting' },
            { label: '执行中', value: 'running' },
            { label: '已完成', value: 'completed' },
            { label: '暂停', value: 'paused' },
            { label: '跳过', value: 'skipped' },
            { label: '失败', value: 'error' },
        ],
        []
    )

    return (
        <div className={styles.pageWrapper}>
            <Title level={2} className={styles.pageHeader}>
                <ClockCircleOutlined style={{ marginRight: 8 }} /> 质控执行历史
            </Title>
            <Alert
                message='查看并筛选历史质控流程执行记录，支持按任务ID/名称、状态、质控类型及时间范围进行高级搜索。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <div className={styles.filtersWrapper}>
                <Form
                    form={form}
                    layout='inline'
                    className={styles.filtersForm}
                    initialValues={{
                        timeRange: undefined,
                    }}
                >
                    <Form.Item name='idOrName' label='任务ID/名称' className={styles.filterItem}>
                        <Input
                            placeholder='输入任务ID或名称关键词'
                            allowClear
                            style={{ width: 200 }}
                            onPressEnter={handleSearch}
                        />
                    </Form.Item>
                    <Form.Item name='status' label='状态' className={styles.filterItem}>
                        <Select
                            mode='multiple'
                            allowClear
                            placeholder='选择状态'
                            options={statusOptions}
                            style={{ width: 200 }}
                        />
                    </Form.Item>
                    <Form.Item name='taskTypes' label='质控类型' className={styles.filterItem}>
                        <Select
                            mode='multiple'
                            allowClear
                            placeholder='选择质控类型'
                            options={qcTypeOptions}
                            style={{ width: 200 }}
                        />
                    </Form.Item>
                    <Form.Item name='timeRange' label='时间范围' className={styles.filterItem}>
                        <RangePicker
                            showTime
                            format='YYYY-MM-DD HH:mm:ss'
                            style={{ width: 400 }}
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
                <Table<QCTaskRecord>
                    rowKey='id'
                    dataSource={pageData?.data?.records || []}
                    columns={columns}
                    loading={loading}
                    pagination={{
                        current: pageNum,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条`,
                        onChange: handleTableChange,
                        onShowSizeChange: handleTableChange,
                    }}
                    onRow={(record) => ({
                        onClick: () => handleRowClick(record),
                        style: { cursor: 'pointer' },
                    })}
                />
            </div>
        </div>
    )
}

export default ExecutionHistory
