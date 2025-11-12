import { ArrowRightOutlined } from '@ant-design/icons'
import React from 'react'
import styles from './index.module.scss'

export interface WorkflowConnectorProps {
    status: 'idle' | 'active' | 'completed' | 'error'
    vertical?: boolean
    className?: string
}

const WorkflowConnector: React.FC<WorkflowConnectorProps> = ({
    status,
    vertical = false,
    className = '',
}) => {
    return (
        <div
            className={`${styles.workflowConnector} ${styles[status]} ${
                vertical ? styles.vertical : styles.horizontal
            } ${className}`}
        >
            <div className={styles.connectorLine}>
                <div className={styles.connectorArrow}>
                    <ArrowRightOutlined />
                </div>
            </div>
            {status === 'active' && (
                <div className={styles.flowAnimation}>
                    <div className={styles.flowDot}></div>
                </div>
            )}
        </div>
    )
}

export default WorkflowConnector
