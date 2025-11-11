import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    PauseCircleOutlined,
} from '@ant-design/icons'
import { Button, Modal, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

export interface ExecutionRecord {
    id: string
    name?: string
    workflowName?: string
    description?: string
    startTime?: string
    endTime?: string
    status: 'idle' | 'running' | 'completed' | 'error' | 'paused'
    currentStep?: number
    totalSteps?: number
    currentStepName?: string
    progress?: number
    processedRecords: number
    totalRecords: number
    errorMessage?: string
    duration?: string
    steps?: ExecutionStepRecord[]
    config?: Record<string, unknown>
}

export interface ExecutionStepRecord {
    stepId: string
    stepName: string
    status: 'idle' | 'running' | 'completed' | 'error' | 'paused'
    startTime?: string
    endTime?: string
    processedRecords: number
    totalRecords: number
    errorMessage?: string
    duration?: string
}

export interface ExecutionRecordTableProps {
    records: ExecutionRecord[]
    loading?: boolean
    onRefresh?: () => void
    onViewDetail?: (recordId: string) => void
}

const ExecutionRecordTable: React.FC<ExecutionRecordTableProps> = ({
    records,
    loading = false,
    onViewDetail,
}) => {
    const navigate = useNavigate()
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<ExecutionRecord | null>(null)

    // 处理查看详情
    const handleViewDetail = (record: ExecutionRecord) => {
        setSelectedRecord(record)
        setDetailModalVisible(true)
    }

    // 状态渲染
    const renderStatus = (status: string) => {
        const statusConfig = {
            idle: { color: 'default', icon: <ClockCircleOutlined />, text: '待执行' },
            running: { color: 'processing', icon: <LoadingOutlined spin />, text: '执行中' },
            completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
            error: { color: 'error', icon: <ExclamationCircleOutlined />, text: '执行失败' },
            paused: { color: 'warning', icon: <PauseCircleOutlined />, text: '已暂停' },
        }

        const config = statusConfig[status as keyof typeof statusConfig]
        if (!config) {
            // 如果状态不匹配，返回默认状态
            return <Tag color='default'>{status}</Tag>
        }

        return (
            <Tag color={config.color} icon={config.icon}>
                {config.text}
            </Tag>
        )
    }

    // 步骤状态渲染
    const renderStepStatus = (status: string) => {
        const statusConfig = {
            idle: { color: 'default', icon: <ClockCircleOutlined />, text: '待执行' },
            running: { color: 'processing', icon: <LoadingOutlined spin />, text: '执行中' },
            completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
            error: { color: 'error', icon: <ExclamationCircleOutlined />, text: '执行失败' },
            paused: { color: 'warning', icon: <PauseCircleOutlined />, text: '已暂停' },
        }

        const config = statusConfig[status as keyof typeof statusConfig]
        return (
            <Tag color={config.color} icon={config.icon}>
                {config.text}
            </Tag>
        )
    }

    // 主表格列配置
    const columns: ColumnsType<ExecutionRecord> = [
        {
            title: '执行ID',
            dataIndex: 'id',
            key: 'id',
            width: 120,
            render: (id: string) => <Text code>{id.slice(-8)}</Text>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: renderStatus,
        },
        {
            title: '执行进度',
            key: 'progress',
            width: 150,
            render: (_, record) => {
                if (record.progress !== undefined) {
                    // 使用progress字段
                    return (
                        <div>
                            <div style={{ marginBottom: 4 }}>进度: {record.progress}%</div>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                {record.processedRecords.toLocaleString()}/
                                {record.totalRecords.toLocaleString()}
                            </div>
                        </div>
                    )
                } else if (record.currentStep && record.totalSteps) {
                    // 使用步骤信息
                    return (
                        <div>
                            <div style={{ marginBottom: 4 }}>
                                步骤: {record.currentStep}/{record.totalSteps}
                            </div>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                当前: {record.currentStepName || '未知'}
                            </div>
                        </div>
                    )
                } else {
                    // 默认显示记录数
                    return (
                        <div>
                            <div style={{ marginBottom: 4 }}>
                                记录: {record.processedRecords.toLocaleString()}/
                                {record.totalRecords.toLocaleString()}
                            </div>
                        </div>
                    )
                }
            },
        },
        {
            title: '处理记录',
            key: 'records',
            width: 120,
            render: (_, record) => (
                <div>
                    <div>{record.processedRecords.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        / {record.totalRecords.toLocaleString()}
                    </div>
                </div>
            ),
        },
        {
            title: '开始时间',
            dataIndex: 'startTime',
            key: 'startTime',
            width: 150,
            render: (time: string) => {
                if (!time) {
                    return <Text type='secondary'>未开始</Text>
                }
                return (
                    <div>
                        <div>{time.split(' ')[0]}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{time.split(' ')[1]}</div>
                    </div>
                )
            },
        },
        {
            title: '执行时长',
            dataIndex: 'duration',
            key: 'duration',
            width: 100,
            render: (duration?: string) => duration || '-',
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button type='link' size='small' onClick={() => handleViewDetail(record)}>
                        查看详情
                    </Button>
                    <Button
                        type='link'
                        size='small'
                        onClick={() => {
                            if (onViewDetail) {
                                onViewDetail(record.id)
                            } else {
                                navigate(`/data-governance/execution/${record.id}`)
                            }
                        }}
                    >
                        进入页面
                    </Button>
                </div>
            ),
        },
    ]

    // 步骤详情表格列配置
    const stepColumns: ColumnsType<ExecutionStepRecord> = [
        {
            title: '步骤',
            dataIndex: 'stepId',
            key: 'stepId',
            width: 60,
            render: (stepId: string) => <Text strong>#{stepId}</Text>,
        },
        {
            title: '步骤名称',
            dataIndex: 'stepName',
            key: 'stepName',
            width: 150,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: renderStepStatus,
        },
        {
            title: '处理记录',
            key: 'records',
            width: 120,
            render: (_, record) => (
                <div>
                    <div>{record.processedRecords.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        / {record.totalRecords.toLocaleString()}
                    </div>
                </div>
            ),
        },
        {
            title: '开始时间',
            dataIndex: 'startTime',
            key: 'startTime',
            width: 150,
            render: (time?: string) => time || '-',
        },
        {
            title: '结束时间',
            dataIndex: 'endTime',
            key: 'endTime',
            width: 150,
            render: (time?: string) => time || '-',
        },
        {
            title: '执行时长',
            dataIndex: 'duration',
            key: 'duration',
            width: 100,
            render: (duration?: string) => duration || '-',
        },
        {
            title: '错误信息',
            dataIndex: 'errorMessage',
            key: 'errorMessage',
            render: (errorMessage?: string) => {
                if (!errorMessage) return '-'
                return (
                    <Text type='danger' style={{ fontSize: 12 }}>
                        {errorMessage.length > 30
                            ? `${errorMessage.slice(0, 30)}...`
                            : errorMessage}
                    </Text>
                )
            },
        },
    ]

    return (
        <>
            <Table
                columns={columns}
                dataSource={records}
                rowKey='id'
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                }}
                scroll={{ x: 1000 }}
                size='middle'
            />

            {/* 执行详情弹窗 */}
            <Modal
                title={`执行详情 - ${selectedRecord?.workflowName}`}
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key='close' onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={1200}
                style={{ top: 20 }}
            >
                {selectedRecord && (
                    <div>
                        {/* 执行概要 */}
                        <div
                            style={{
                                marginBottom: 24,
                                padding: 16,
                                background: '#fafafa',
                                borderRadius: 6,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 12,
                                }}
                            >
                                <div>
                                    <Text strong>执行ID: </Text>
                                    <Text code>{selectedRecord?.id}</Text>
                                </div>
                                <div>
                                    <Text strong>状态: </Text>
                                    {selectedRecord && renderStatus(selectedRecord.status)}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 12,
                                }}
                            >
                                <div>
                                    <Text strong>开始时间: </Text>
                                    <Text>{selectedRecord?.startTime}</Text>
                                </div>
                                <div>
                                    <Text strong>结束时间: </Text>
                                    <Text>{selectedRecord?.endTime || '进行中'}</Text>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <Text strong>执行进度: </Text>
                                    <Text>
                                        {selectedRecord?.currentStep}/{selectedRecord?.totalSteps}{' '}
                                        步骤
                                    </Text>
                                </div>
                                <div>
                                    <Text strong>处理记录: </Text>
                                    <Text>
                                        {selectedRecord?.processedRecords.toLocaleString()} /{' '}
                                        {selectedRecord?.totalRecords.toLocaleString()}
                                    </Text>
                                </div>
                            </div>
                            {selectedRecord?.errorMessage && (
                                <div style={{ marginTop: 12 }}>
                                    <Text strong>错误信息: </Text>
                                    <Text type='danger'>{selectedRecord?.errorMessage}</Text>
                                </div>
                            )}
                        </div>

                        {/* 步骤详情 */}
                        <div>
                            <Text
                                strong
                                style={{ fontSize: 16, marginBottom: 16, display: 'block' }}
                            >
                                步骤执行详情
                            </Text>
                            <Table
                                columns={stepColumns}
                                dataSource={selectedRecord?.steps || []}
                                rowKey='stepId'
                                pagination={false}
                                size='small'
                                scroll={{ x: 800 }}
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </>
    )
}

export default ExecutionRecordTable
