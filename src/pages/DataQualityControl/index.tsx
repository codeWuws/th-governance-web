import { CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { Alert, Card, Col, Row, Typography } from 'antd'
import React from 'react'
import { Link } from 'react-router-dom'

const { Title, Text } = Typography

const DataQualityControl: React.FC = () => {
    const qualityControlItems = [
        {
            title: '综合质控管理',
            description:
                '以标签页整合可靠性、及时性、完整性、一致性与准确性，保持原交互与布局',
            icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
            path: '/data-quality-control/integrated',
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
                description='提供综合质控管理页面，统一呈现可靠性、及时性、完整性、一致性与准确性质控。'
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
