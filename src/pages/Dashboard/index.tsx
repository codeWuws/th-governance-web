import { BarChartOutlined, CheckCircleOutlined, DatabaseOutlined } from '@ant-design/icons'
import { Alert, Card, Col, Progress, Row, Space, Statistic, Typography } from 'antd'
import React, { useState } from 'react'

const { Title } = Typography

interface StatisticData {
    totalTables: number
    processedTables: number
    totalRecords: number
    cleanedRecords: number
    duplicateRecords: number
    errorRecords: number
}

const Dashboard: React.FC = () => {
    const [statisticData, _setStatisticData] = useState<StatisticData>({
        totalTables: 40,
        processedTables: 32,
        totalRecords: 1250000,
        cleanedRecords: 1180000,
        duplicateRecords: 45000,
        errorRecords: 25000,
    })

    // 计算处理进度
    const overallProgress = Math.round(
        (statisticData.processedTables / statisticData.totalTables) * 100
    )
    const dataQualityRate = Math.round(
        (statisticData.cleanedRecords / statisticData.totalRecords) * 100
    )

    return (
        <div>
            {/* 页面标题 - 与数据治理页面保持一致的风格 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    <BarChartOutlined style={{ marginRight: 8 }} />
                    数据治理仪表盘
                </Title>
            </div>

            {/* 信息提示 - 与数据治理页面保持一致 */}
            <Alert
                message='数据治理概览'
                description='实时监控数据治理工作流的执行状态、处理进度和数据质量指标，帮助您全面了解数据治理的整体情况。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 统计卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title='总表数量'
                            value={statisticData.totalTables}
                            prefix={<DatabaseOutlined />}
                            suffix='张'
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title='已处理表数'
                            value={statisticData.processedTables}
                            prefix={<CheckCircleOutlined />}
                            suffix='张'
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title='总记录数'
                            value={statisticData.totalRecords}
                            precision={0}
                            formatter={value => `${Number(value).toLocaleString()}`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title='已清洗记录'
                            value={statisticData.cleanedRecords}
                            precision={0}
                            formatter={value => `${Number(value).toLocaleString()}`}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 进度概览 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title='整体处理进度' extra={`${overallProgress}%`}>
                        <Progress
                            percent={overallProgress}
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                        />
                        <div style={{ marginTop: 16 }}>
                            <Space>
                                <span>已处理: {statisticData.processedTables} 张表</span>
                                <span>
                                    剩余:{' '}
                                    {statisticData.totalTables - statisticData.processedTables} 张表
                                </span>
                            </Space>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title='数据质量率' extra={`${dataQualityRate}%`}>
                        <Progress
                            percent={dataQualityRate}
                            strokeColor={{
                                '0%': '#ff4d4f',
                                '50%': '#faad14',
                                '100%': '#52c41a',
                            }}
                        />
                        <div style={{ marginTop: 16 }}>
                            <Space direction='vertical' size='small'>
                                <span>
                                    重复记录: {statisticData.duplicateRecords.toLocaleString()}
                                </span>
                                <span>错误记录: {statisticData.errorRecords.toLocaleString()}</span>
                            </Space>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

export default Dashboard
