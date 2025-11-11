import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    PauseCircleOutlined,
} from '@ant-design/icons'
import { Progress, Tooltip } from 'antd'
import React from 'react'
import styles from './index.module.scss'

export interface WorkflowNodeProps {
    id: string
    name: string
    description: string
    status: 'idle' | 'running' | 'completed' | 'error' | 'paused'
    progress: number
    processedRecords: number
    totalRecords: number
    errorMessage?: string
    isActive?: boolean
    onClick?: (id: string) => void
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({
    id,
    name,
    description,
    status,
    progress,
    processedRecords,
    totalRecords,
    errorMessage,
    isActive = false,
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

    const handleClick = () => {
        onClick?.(id)
    }

    const nodeContent = (
        <div
            className={`${styles.workflowNode} ${styles[status]} ${isActive ? styles.active : ''}`}
            onClick={handleClick}
        >
            {/* 节点头部 */}
            <div className={styles.nodeHeader}>
                <div className={styles.nodeIcon}>{statusIconMap[status]}</div>
                <div className={styles.nodeTitle}>
                    <div className={styles.nodeName}>{name}</div>
                    <div className={styles.nodeStatus}>{statusTextMap[status]}</div>
                </div>
            </div>

            {/* 节点内容 */}
            <div className={styles.nodeContent}>
                <div className={styles.nodeDescription}>{description}</div>

                {/* 进度条 */}
                {(status === 'running' || status === 'completed' || status === 'paused') && (
                    <div className={styles.progressSection}>
                        <Progress
                            percent={progress}
                            size='small'
                            status={progress === 100 ? 'success' : 'active'}
                            showInfo={false}
                        />
                        <div className={styles.progressText}>
                            {processedRecords.toLocaleString()} / {totalRecords.toLocaleString()}
                        </div>
                    </div>
                )}

                {/* 错误信息 */}
                {status === 'error' && errorMessage && (
                    <div className={styles.errorMessage}>{errorMessage}</div>
                )}
            </div>

            {/* 节点序号 */}
            <div className={styles.nodeNumber}>{id}</div>
        </div>
    )

    // 如果有错误信息，使用 Tooltip 显示详细错误
    if (status === 'error' && errorMessage) {
        return (
            <Tooltip title={errorMessage} placement='top'>
                {nodeContent}
            </Tooltip>
        )
    }

    return nodeContent
}

export default WorkflowNode
