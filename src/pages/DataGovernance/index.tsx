import { HistoryOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Space, Typography } from 'antd'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ExecutionRecordTable from '../../components/ExecutionRecordTable'
import { useAppSelector } from '../../store/hooks'
import { logger } from '../../utils/logger'

const { Title } = Typography

const DataGovernance: React.FC = () => {
    const navigate = useNavigate()
    const { loading } = useAppSelector(state => state.dataGovernance)

    // 获取执行记录
    const refreshRecords = () => {
        // 这里可以添加刷新逻辑
        logger.debug('刷新执行记录')
    }

    // 跳转到工作流配置页面
    const goToWorkflowConfig = () => {
        navigate('/data-governance/workflow-config')
    }

    // 初始化加载执行记录
    useEffect(() => {
        refreshRecords()
    }, [])

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    <HistoryOutlined style={{ marginRight: 8 }} />
                    数据治理执行记录
                </Title>
                <Space>
                    <Button
                        type='primary'
                        size='large'
                        icon={<SettingOutlined />}
                        onClick={goToWorkflowConfig}
                    >
                        工作流配置
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={refreshRecords} loading={loading}>
                        刷新记录
                    </Button>
                </Space>
            </div>

            <Alert
                message='数据治理执行记录'
                description='查看所有数据治理工作流的执行历史记录，点击单条记录可查看详细的执行步骤和进度信息。点击"工作流配置"进入配置页面启动新的数据治理流程。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 执行记录表格 */}
            <Card>
                <ExecutionRecordTable records={[]} loading={loading} onRefresh={refreshRecords} />
            </Card>
        </div>
    )
}

export default DataGovernance
