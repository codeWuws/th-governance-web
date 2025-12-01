import { ExecutionLogItem } from '@/types'
import { statusConfig } from '@/pages/DataGovernance/const'
import { Button, Card, Table, Tag, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

/**
 * 执行记录表格组件属性
 */
interface ExecutionRecordTableProps {
    /** 执行记录数据 */
    data: ExecutionLogItem[]
    /** 加载状态 */
    loading?: boolean
    /** 查看详情回调 */
    onViewDetails?: (record: ExecutionLogItem) => void
    /** 刷新回调 */
    onRefresh?: () => void
    /** 分页配置 */
    pagination?: TablePaginationConfig
}

/**
 * 执行记录表格组件
 * 展示数据治理工作流的执行历史记录
 */
export const ExecutionRecordTable: React.FC<ExecutionRecordTableProps> = ({
    data,
    loading = false,
    onViewDetails,
    pagination,
}) => {
    const navigate = useNavigate()

    /**
     * 渲染步骤状态标签
     */
    const renderStatus = (status: number) => {
        // 使用统一的状态配置映射（0未执行，1执行中，2已完成，3暂停，4跳过，5失败）
        const config = statusConfig[status as keyof typeof statusConfig] || {
            text: '未知',
            color: 'default',
        }
        return <Tag color={config.color}>{config.text}</Tag>
    }

    /**
     * 格式化时间
     */
    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-'
        return dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss')
    }

    /**
     * 计算执行时长
     */
    const calculateDuration = (startTime: string, endTime: string) => {
        if (!startTime || !endTime) return '-'
        const start = dayjs(startTime)
        const end = dayjs(endTime)
        const duration = end.diff(start, 'second')

        if (duration < 60) {
            return `${duration}秒`
        } else if (duration < 3600) {
            const minutes = Math.floor(duration / 60)
            const seconds = duration % 60
            return `${minutes}分${seconds}秒`
        } else {
            const hours = Math.floor(duration / 3600)
            const minutes = Math.floor((duration % 3600) / 60)
            return `${hours}小时${minutes}分钟`
        }
    }

    /**
     * 跳转到完整详情页面
     */
    const handleViewFullDetails = (record: ExecutionLogItem) => {
        // 如果外部传入了查看详情回调，则优先调用回调；否则跳转到详情页
        if (onViewDetails) {
            onViewDetails(record)
            return
        }
        navigate(`/data-governance/workflow/${record.batch_id}`)
    }

    /**
     * 表格列定义
     */
    const columns: ColumnsType<ExecutionLogItem> = [
        {
            title: '任务ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: '批次ID',
            dataIndex: 'batch_id',
            key: 'batch_id',
            width: 120,
            render: (batchId: number) => <Text code>{batchId}</Text>,
        },
        {
            title: '任务名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            ellipsis: true,
        },
        {
            title: '节点类型',
            dataIndex: 'node_type',
            key: 'node_type',
            width: 140,
            render: (nodeType: string) => {
                // 与后端返回的节点类型保持一致（参考 WorkflowNodeType 枚举）
                const nodeTypeLabelMap: Record<string, { label: string; color: string }> = {
                    DataCleansing: { label: '数据清洗', color: 'green' },
                    DataDeduplication: { label: '数据去重', color: 'orange' },
                    dataTransform: { label: '类型转换', color: 'purple' },
                    StandardMapping: { label: '标准对照', color: 'cyan' },
                    EMPIDefinitionDistribution: { label: 'EMPI发放', color: 'magenta' },
                    EMOIDefinitionDistribution: { label: 'EMOI发放', color: 'volcano' },
                    DataStandardization: { label: '数据标准化', color: 'lime' },
                    DataOrphan: { label: '丢孤记录', color: 'red' },
                    DataDesensitization: { label: '数据脱敏', color: 'geekblue' },
                }
                const config = nodeTypeLabelMap[nodeType] || {
                    label: nodeType || '未知节点',
                    color: 'default',
                }
                return <Tag color={config.color}>{config.label}</Tag>
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            align: 'center',
            render: renderStatus,
            filters: [
                { text: '未执行', value: 0 },
                { text: '执行中', value: 1 },
                { text: '已完成', value: 2 },
                { text: '暂停', value: 3 },
                { text: '跳过', value: 4 },
                { text: '失败', value: 5 },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: '开始时间',
            dataIndex: 'start_time',
            key: 'start_time',
            width: 160,
            render: (time: string) => formatTime(time),
            sorter: (a, b) => dayjs(a.start_time).unix() - dayjs(b.start_time).unix(),
        },
        {
            title: '结束时间',
            dataIndex: 'end_time',
            key: 'end_time',
            width: 160,
            render: (time: string) => formatTime(time),
        },
        {
            title: '执行时长',
            key: 'duration',
            width: 100,
            render: (_, record) => calculateDuration(record.start_time || '', record.end_time || ''),
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Button type='link' size='small' onClick={() => handleViewFullDetails(record)}>
                    查看详情
                </Button>
            ),
        },
    ]

    /**
     * 表格数据处理
     */
    const tableData = useMemo(() => {
        return data.map(item => ({
            ...item,
            key: `${item.id}-${item.batch_id}`,
        }))
    }, [data])

    return (
        <Card>
            <Table
                columns={columns}
                dataSource={tableData}
                loading={loading}
                pagination={pagination}
                // 限制表格最大高度，超出时启用内部滚动，避免页面过长
                // 选择中等高度以兼顾视野与可读性；如需更动态可改为根据窗口高度计算
                scroll={{ x: 1200, y: 560 }}
                sticky
                size='middle'
            />
        </Card>
    )
}
