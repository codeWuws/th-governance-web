import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    PauseCircleOutlined,
} from '@ant-design/icons'
import { Progress, Tooltip, Card, Tag, Space } from 'antd'
import React from 'react'
import styles from './index.module.scss'

export interface TimelineWorkflowNodeProps {
    id: string
    name: string
    description: string
    status: 'idle' | 'running' | 'completed' | 'error' | 'paused'
    progress: number
    processedRecords: number
    totalRecords: number
    startTime?: string
    endTime?: string
    errorMessage?: string
    isActive?: boolean
    isLast?: boolean
    onClick?: (id: string) => void
}

const TimelineWorkflowNode: React.FC<TimelineWorkflowNodeProps> = ({
    id,
    name,
    description,
    status,
    progress,
    processedRecords,
    totalRecords,
    startTime,
    endTime,
    errorMessage,
    isActive = false,
    isLast = false,
    onClick,
}) => {
    // 状态图标映射
    const statusIconMap = {
        idle: <ClockCircleOutlined className={styles.statusIcon} />,
        running: <LoadingOutlined className={styles.statusIcon} spin />,
        completed: <CheckCircleOutlined className={styles.statusIcon} />,
        error: <ExclamationCircleOutlined className={styles.statusIcon} />,
        paused: <PauseCircleOutlined className={styles.statusIcon} />,
    }

    // 状态文本映射
    const statusTextMap = {
        idle: '待执行',
        running: '执行中',
        completed: '已完成',
        error: '执行失败',
        paused: '已暂停',
    }

    // 状态颜色映射
    const statusColorMap = {
        idle: 'default',
        running: 'processing',
        completed: 'success',
        error: 'error',
        paused: 'warning',
    } as const

    const handleClick = () => {
        onClick?.(id)
    }

    const formatTime = (time?: string) => {
        if (!time) return '--'
        return new Date(time).toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    }

    const getDuration = () => {
        if (!startTime || !endTime) return '--'
        const start = new Date(startTime).getTime()
        const end = new Date(endTime).getTime()
        const duration = Math.round((end - start) / 1000)

        if (duration < 60) return `${duration}秒`
        if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`
        return `${Math.floor(duration / 3600)}时${Math.floor((duration % 3600) / 60)}分`
    }

    const nodeContent = (
        <div
            className={`${styles.timelineNode} ${styles[status]} ${isActive ? styles.active : ''}`}
        >
            {/* 时间线左侧：节点图标和连接线 */}
            <div className={styles.timelineLeft}>
                <div className={styles.nodeIconWrapper}>
                    <div className={`${styles.nodeIcon} ${styles[status]}`}>
                        {statusIconMap[status]}
                    </div>
                    <div className={styles.nodeNumber}>{id}</div>
                </div>
                {!isLast && <div className={`${styles.timelineLine} ${styles[status]}`} />}
            </div>

            {/* 时间线右侧：节点信息 */}
            <div className={styles.timelineRight} onClick={handleClick}>
                <Card
                    className={`${styles.nodeCard} ${styles[status]} ${isActive ? styles.active : ''}`}
                    size='small'
                    hoverable
                >
                    {/* 节点头部 */}
                    <div className={styles.nodeHeader}>
                        <div className={styles.nodeTitle}>
                            <h4 className={styles.nodeName}>{name}</h4>
                            <Tag color={statusColorMap[status]} className={styles.statusTag}>
                                {statusTextMap[status]}
                            </Tag>
                        </div>
                    </div>

                    {/* 节点描述 */}
                    <div className={styles.nodeDescription}>{description}</div>

                    {/* 进度信息 */}
                    {(status === 'running' || status === 'completed' || status === 'paused') && (
                        <div className={styles.progressSection}>
                            <div className={styles.progressHeader}>
                                <span className={styles.progressLabel}>执行进度</span>
                                <span className={styles.progressPercent}>{progress}%</span>
                            </div>
                            <Progress
                                percent={progress}
                                size='small'
                                status={progress === 100 ? 'success' : 'active'}
                                showInfo={false}
                                strokeColor={
                                    status === 'completed'
                                        ? '#52c41a'
                                        : status === 'running'
                                          ? '#1890ff'
                                          : status === 'paused'
                                            ? '#faad14'
                                            : undefined
                                }
                            />
                            <div className={styles.recordsInfo}>
                                已处理: {processedRecords.toLocaleString()} /{' '}
                                {totalRecords.toLocaleString()} 条记录
                            </div>
                        </div>
                    )}

                    {/* 时间信息 */}
                    {(startTime || endTime) && (
                        <div className={styles.timeInfo}>
                            <Space size='large'>
                                {startTime && (
                                    <div className={styles.timeItem}>
                                        <span className={styles.timeLabel}>开始时间:</span>
                                        <span className={styles.timeValue}>
                                            {formatTime(startTime)}
                                        </span>
                                    </div>
                                )}
                                {endTime && (
                                    <div className={styles.timeItem}>
                                        <span className={styles.timeLabel}>结束时间:</span>
                                        <span className={styles.timeValue}>
                                            {formatTime(endTime)}
                                        </span>
                                    </div>
                                )}
                                {startTime && endTime && (
                                    <div className={styles.timeItem}>
                                        <span className={styles.timeLabel}>耗时:</span>
                                        <span className={styles.timeValue}>{getDuration()}</span>
                                    </div>
                                )}
                            </Space>
                        </div>
                    )}

                    {/* 错误信息 */}
                    {status === 'error' && errorMessage && (
                        <div className={styles.errorSection}>
                            <div className={styles.errorMessage}>
                                <ExclamationCircleOutlined className={styles.errorIcon} />
                                {errorMessage}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )

    // 如果有错误信息，使用 Tooltip 显示详细错误
    if (status === 'error' && errorMessage && errorMessage.length > 50) {
        return (
            <Tooltip title={errorMessage} placement='right'>
                {nodeContent}
            </Tooltip>
        )
    }

    return nodeContent
}

export default TimelineWorkflowNode
