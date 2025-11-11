import { CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { Alert, Card, Col, Row, Typography } from 'antd'
import React from 'react'
import { Link } from 'react-router-dom'

const { Title, Text } = Typography

const DataQualityControl: React.FC = () => {
    const qualityControlItems = [
        {
            title: '文本质控',
            description: '文本上传选择对应表，进行文本数据质量检查',
            icon: <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
            path: '/data-quality-control/text',
        },
        {
            title: '综合质控',
            description: '数据整体质控，结果上传（支持EXCEL）',
            icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
            path: '/data-quality-control/comprehensive',
        },
        {
            title: '完整性质控',
            description: '数据填充率质控，检查数据完整性',
            icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />,
            path: '/data-quality-control/completeness',
        },
        {
            title: '基础医疗逻辑质控',
            description: '主附表数据总量对比，验证医疗逻辑一致性',
            icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
            path: '/data-quality-control/medical-logic',
        },
        {
            title: '核心数据质控',
            description: '医疗数据对比分析，核心指标质量监控',
            icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
            path: '/data-quality-control/core-data',
        },
    ]

    return (
        <div>
            {/* 页面标题 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    <CheckCircleOutlined style={{ marginRight: 8 }} />
                    数据质控
                </Title>
            </div>

            {/* 信息提示 */}
            <Alert
                message='数据质控中心'
                description='提供全面的数据质量控制功能，包括文本质控、综合质控、完整性质控、基础医疗逻辑质控和核心数据质控，确保数据质量符合标准要求。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* 质控功能卡片 */}
            <Row gutter={[16, 16]}>
                {qualityControlItems.map((item, index) => (
                    <Col xs={24} sm={12} lg={8} key={index}>
                        <Link to={item.path} style={{ textDecoration: 'none' }}>
                            <Card
                                hoverable
                                style={{
                                    height: '100%',
                                    transition: 'all 0.3s ease',
                                }}
                                bodyStyle={{
                                    padding: 24,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    minHeight: 180,
                                }}
                            >
                                <div style={{ marginBottom: 16 }}>{item.icon}</div>
                                <Title level={4} style={{ marginBottom: 12, color: '#262626' }}>
                                    {item.title}
                                </Title>
                                <Text type='secondary' style={{ lineHeight: 1.6 }}>
                                    {item.description}
                                </Text>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>
        </div>
    )
}

export default DataQualityControl