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
} from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ExecutionHistory.module.scss'

const { Title } = Typography
const { RangePicker } = DatePicker

interface HistoryItem {
    id: string
    types: string[]
    status: 'starting' | 'running' | 'completed' | 'error' | 'cancelled'
    start_time: number
    end_time: number | null
}

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

const typeDescMap: Record<string, string> = {
    text: '评估文本规范、完整性与字符合规，保障数据可信与稳定',
    comprehensive: '关注刷新延迟、准点率与实时管道稳定性，提升数据时效',
    completeness: '表与字段填充率检查，识别空值与缺失，输出完整性分析',
    'basic-medical-logic': '主附表关联与基础规则一致性校验，排查不一致与异常',
    'core-data': '核心数据编码与字段值准确性评估，并进行对比分析',
}

const seedFor = (record: HistoryItem, t: string) =>
    Array.from(`${record.id}-${record.start_time}-${t}`).reduce(
        (s, c) => (s * 31 + c.charCodeAt(0)) >>> 0,
        1315423911
    )
const metricsForType = (record: HistoryItem, t: string) => {
    const s = seedFor(record, t)
    const pct = (base: number, gain: number, mod: number) => Math.min(100, base + gain + (s % mod))
    if (t === 'text') {
        const cleanup = pct(60, 0, 15)
        const violations = s % 12
        const cover = pct(70, 0, 20)
        return [
            { label: '清理率', value: `${cleanup}%` },
            { label: '违规字符', value: `${violations}` },
            { label: '覆盖率', value: `${cover}%` },
        ]
    }
    if (t === 'comprehensive') {
        const delay = 5 + (s % 25)
        const punctual = pct(80, 0, 20)
        const coverage = pct(75, 0, 25)
        return [
            { label: '延迟', value: `${delay}分` },
            { label: '准点率', value: `${punctual}%` },
            { label: '覆盖率', value: `${coverage}%` },
        ]
    }
    if (t === 'completeness') {
        const fill = pct(60, 0, 20)
        const reqMissing = s % 20
        const nullFields = s % 8
        return [
            { label: '填充率', value: `${fill}%` },
            { label: '必填缺失率', value: `${reqMissing}%` },
            { label: '空值字段', value: `${nullFields}` },
        ]
    }
    if (t === 'basic-medical-logic') {
        const match = pct(70, 0, 20)
        const depth = 1 + (s % 5)
        const cover = pct(75, 0, 25)
        return [
            { label: '匹配率', value: `${match}%` },
            { label: '关联深度', value: `${depth}` },
            { label: '覆盖率', value: `${cover}%` },
        ]
    }
    const acc = pct(75, 0, 20)
    const diff = pct(40, 0, 30)
    const cover = pct(75, 0, 25)
    return [
        { label: '准确率', value: `${acc}%` },
        { label: '差异比', value: `${diff}%` },
        { label: '覆盖率', value: `${cover}%` },
    ]
}

const ExecutionHistory: React.FC = () => {
    const navigate = useNavigate()
    const [data, setData] = useState<HistoryItem[]>([])
    const [form] = Form.useForm()
    const qcOptions = [
        { label: typeLabel('text'), value: 'text' },
        { label: typeLabel('comprehensive'), value: 'comprehensive' },
        { label: typeLabel('completeness'), value: 'completeness' },
        { label: typeLabel('basic-medical-logic'), value: 'basic-medical-logic' },
        { label: typeLabel('core-data'), value: 'core-data' },
    ]

    const reload = () => {
        const key = 'qcExecutionHistory'
        const prev = localStorage.getItem(key)
        const list: HistoryItem[] = prev ? JSON.parse(prev) : []
        setData(list)
    }

    useEffect(() => {
        try {
            localStorage.removeItem('qcExecutionHistory')
        } catch {}
        reload()
    }, [])

    const columns = useMemo(
        () => [
            {
                title: '任务ID',
                dataIndex: 'id',
                key: 'id',
                width: 240,
            },
            {
                title: '质控类型',
                dataIndex: 'types',
                key: 'types',
                render: (types: string[]) => (
                    <>
                        {types.map(t => (
                            <Tooltip key={t} title={typeDescMap[t] || typeLabel(t)}>
                                <Tag color='blue' style={{ marginBottom: 4 }}>
                                    {typeLabel(t)}
                                </Tag>
                            </Tooltip>
                        ))}
                    </>
                ),
            },
            {
                title: '概览',
                key: 'summary',
                render: (_: unknown, record: HistoryItem) => {
                    const parts = record.types.slice(0, 3).map(t => {
                        const mt = metricsForType(record, t)
                        const keyMetric = mt[0]
                        return `${typeLabel(t)} ${keyMetric.label}${keyMetric.value}`
                    })
                    const more = record.types.length > 3 ? ` · 等${record.types.length}项` : ''
                    return parts.join(' · ') + more
                },
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (s: HistoryItem['status']) => {
                    const colorMap: Record<HistoryItem['status'], string> = {
                        starting: 'processing',
                        running: 'processing',
                        completed: 'success',
                        error: 'error',
                        cancelled: 'default',
                    }
                    const labelMap: Record<HistoryItem['status'], string> = {
                        starting: '启动中',
                        running: '进行中',
                        completed: '已完成',
                        error: '异常',
                        cancelled: '已取消',
                    }
                    return <Tag color={colorMap[s]}>{labelMap[s]}</Tag>
                },
            },

            {
                title: '开始时间',
                dataIndex: 'start_time',
                key: 'start_time',
                render: (ts: number) => new Date(ts).toLocaleString(),
            },
            {
                title: '结束时间',
                dataIndex: 'end_time',
                key: 'end_time',
                render: (ts: number | null) => (ts ? new Date(ts).toLocaleString() : '-'),
            },
            {
                title: '时长',
                key: 'duration',
                render: (_: unknown, record: HistoryItem) =>
                    record.end_time
                        ? `${Math.max(1, Math.round((record.end_time - record.start_time) / 60000))} 分钟`
                        : '-',
            },
        ],
        [navigate]
    )

    const filteredData = useMemo(() => {
        const values = form.getFieldsValue()
        let list = [...data]
        if (values.taskId) {
            const q = String(values.taskId).trim().toLowerCase()
            list = list.filter(i => i.id.toLowerCase().includes(q))
        }
        if (values.status && values.status.length) {
            list = list.filter(i => values.status.includes(i.status))
        }
        if (values.types && values.types.length) {
            list = list.filter(i => values.types.every((t: string) => i.types.includes(t)))
        }
        if (values.timeRange && values.timeRange.length === 2) {
            const [start, end] = values.timeRange
            const s = start?.valueOf?.() ?? 0
            const e = end?.valueOf?.() ?? Number.MAX_SAFE_INTEGER
            list = list.filter(i => i.start_time >= s && i.start_time <= e)
        }
        return list
    }, [data, form])

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
                    onValuesChange={() => setData([...data])}
                    className={styles.filtersForm}
                >
                    <Form.Item name='taskId' label='任务ID' className={styles.filterItem}>
                        <Input
                            placeholder='输入任务ID关键词'
                            allowClear
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item name='status' label='状态' className={styles.filterItem}>
                        <Select
                            mode='multiple'
                            allowClear
                            placeholder='选择状态'
                            options={[
                                { label: '启动中', value: 'starting' },
                                { label: '进行中', value: 'running' },
                                { label: '已完成', value: 'completed' },
                                { label: '异常', value: 'error' },
                                { label: '已取消', value: 'cancelled' },
                            ]}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item name='types' label='质控类型' className={styles.filterItem}>
                        <Select
                            mode='multiple'
                            allowClear
                            placeholder='选择质控类型'
                            options={qcOptions}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item name='timeRange' label='时间范围' className={styles.filterItem}>
                        <RangePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item className={styles.filterActions}>
                        <Space>
                            <Button onClick={() => form.resetFields()}>清空</Button>
                            <Button type='primary' onClick={() => setData([...data])}>
                                搜索
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
            <div className={styles.tableWrapper}>
                <Table
                    rowKey='id'
                    dataSource={filteredData}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                />
            </div>
        </div>
    )
}

export default ExecutionHistory
