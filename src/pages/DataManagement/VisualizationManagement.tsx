import React, { useState, useEffect, useRef } from 'react'
import {
    Card,
    Button,
    Space,
    Select,
    Tag,
    message,
    Modal,
    Form,
    Input,
    Row,
    Col,
    Alert,
    Progress,
    Descriptions,
} from 'antd'
import {
    ReloadOutlined,
    SearchOutlined,
    ExpandOutlined,
    ShrinkOutlined,
    DownloadOutlined,
    SettingOutlined,
} from '@ant-design/icons'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import moment from 'moment'

const { Option } = Select

interface TableNode {
    id: string
    name: string
    database: string
    schema: string
    type: 'table' | 'view' | 'external'
    fieldCount: number
    recordCount: number
    category: string
    x?: number
    y?: number
}

interface RelationshipEdge {
    id: string
    source: string
    target: string
    relationshipType: 'lineage' | 'dependency' | 'reference'
    strength: number
    direction: 'unidirectional' | 'bidirectional'
    description: string
}

interface VisualizationData {
    nodes: TableNode[]
    edges: RelationshipEdge[]
    metadata: {
        totalNodes: number
        totalEdges: number
        lastUpdateTime: string
        dataSource: string
    }
}

const VisualizationManagement: React.FC = () => {
    const chartRef = useRef<HTMLDivElement>(null)
    const [chartInstance, setChartInstance] = useState<ECharts | null>(null)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<VisualizationData | null>(null)
    const [selectedDatabase, setSelectedDatabase] = useState<string>('')
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [layoutType, setLayoutType] = useState<'force' | 'circular' | 'hierarchical'>('force')
    const [showLabels, setShowLabels] = useState(true)
    const [showMetrics, setShowMetrics] = useState(true)
    const [zoomLevel, setZoomLevel] = useState(1)
    const [selectedNode, setSelectedNode] = useState<TableNode | null>(null)
    const [modalVisible, setModalVisible] = useState(false)

    // 模拟数据
    const mockData: VisualizationData = {
        nodes: [
            {
                id: 'patient_basic',
                name: '患者基本信息',
                database: 'patient_db',
                schema: 'public',
                type: 'table',
                fieldCount: 25,
                recordCount: 150000,
                category: '患者数据',
            },
            {
                id: 'patient_visit',
                name: '患者就诊记录',
                database: 'patient_db',
                schema: 'public',
                type: 'table',
                fieldCount: 18,
                recordCount: 320000,
                category: '患者数据',
            },
            {
                id: 'diagnosis_record',
                name: '诊断记录',
                database: 'clinical_db',
                schema: 'public',
                type: 'table',
                fieldCount: 12,
                recordCount: 450000,
                category: '临床数据',
            },
            {
                id: 'lab_results',
                name: '实验室结果',
                database: 'lab_db',
                schema: 'public',
                type: 'table',
                fieldCount: 15,
                recordCount: 890000,
                category: '检验数据',
            },
            {
                id: 'prescription',
                name: '处方记录',
                database: 'pharmacy_db',
                schema: 'public',
                type: 'table',
                fieldCount: 20,
                recordCount: 280000,
                category: '药品数据',
            },
            {
                id: 'medication_admin',
                name: '用药记录',
                database: 'pharmacy_db',
                schema: 'public',
                type: 'table',
                fieldCount: 14,
                recordCount: 560000,
                category: '药品数据',
            },
            {
                id: 'vital_signs',
                name: '生命体征',
                database: 'clinical_db',
                schema: 'public',
                type: 'table',
                fieldCount: 10,
                recordCount: 1200000,
                category: '临床数据',
            },
            {
                id: 'imaging_study',
                name: '影像检查',
                database: 'imaging_db',
                schema: 'public',
                type: 'table',
                fieldCount: 16,
                recordCount: 95000,
                category: '影像数据',
            },
            {
                id: 'procedure_record',
                name: '手术记录',
                database: 'clinical_db',
                schema: 'public',
                type: 'table',
                fieldCount: 22,
                recordCount: 67000,
                category: '临床数据',
            },
            {
                id: 'insurance_info',
                name: '保险信息',
                database: 'admin_db',
                schema: 'public',
                type: 'table',
                fieldCount: 8,
                recordCount: 145000,
                category: '管理数据',
            },
        ],
        edges: [
            {
                id: 'e1',
                source: 'patient_basic',
                target: 'patient_visit',
                relationshipType: 'lineage',
                strength: 0.95,
                direction: 'unidirectional',
                description: '患者基本信息 -> 就诊记录',
            },
            {
                id: 'e2',
                source: 'patient_visit',
                target: 'diagnosis_record',
                relationshipType: 'lineage',
                strength: 0.88,
                direction: 'unidirectional',
                description: '就诊记录 -> 诊断记录',
            },
            {
                id: 'e3',
                source: 'patient_visit',
                target: 'lab_results',
                relationshipType: 'lineage',
                strength: 0.92,
                direction: 'unidirectional',
                description: '就诊记录 -> 实验室结果',
            },
            {
                id: 'e4',
                source: 'patient_visit',
                target: 'prescription',
                relationshipType: 'lineage',
                strength: 0.85,
                direction: 'unidirectional',
                description: '就诊记录 -> 处方记录',
            },
            {
                id: 'e5',
                source: 'prescription',
                target: 'medication_admin',
                relationshipType: 'dependency',
                strength: 0.9,
                direction: 'unidirectional',
                description: '处方记录 -> 用药记录',
            },
            {
                id: 'e6',
                source: 'patient_visit',
                target: 'vital_signs',
                relationshipType: 'lineage',
                strength: 0.78,
                direction: 'unidirectional',
                description: '就诊记录 -> 生命体征',
            },
            {
                id: 'e7',
                source: 'patient_visit',
                target: 'imaging_study',
                relationshipType: 'lineage',
                strength: 0.82,
                direction: 'unidirectional',
                description: '就诊记录 -> 影像检查',
            },
            {
                id: 'e8',
                source: 'patient_visit',
                target: 'procedure_record',
                relationshipType: 'lineage',
                strength: 0.75,
                direction: 'unidirectional',
                description: '就诊记录 -> 手术记录',
            },
            {
                id: 'e9',
                source: 'patient_basic',
                target: 'insurance_info',
                relationshipType: 'reference',
                strength: 0.65,
                direction: 'bidirectional',
                description: '患者基本信息 <-> 保险信息',
            },
        ],
        metadata: {
            totalNodes: 10,
            totalEdges: 9,
            lastUpdateTime: '2024-02-01 14:30:00',
            dataSource: '专病库数据治理平台',
        },
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (data && chartRef.current) {
            initChart()
        }
        return () => {
            if (chartInstance) {
                chartInstance.dispose()
            }
        }
    }, [data, layoutType, showLabels, showMetrics])

    const loadData = () => {
        setLoading(true)
        setTimeout(() => {
            setData(mockData)
            setLoading(false)
        }, 1000)
    }

    const initChart = () => {
        if (!chartRef.current || !data) return

        if (chartInstance) {
            chartInstance.dispose()
        }

        const chart = echarts.init(chartRef.current)
        setChartInstance(chart)

        const option = {
            title: {
                text: '数据血缘关系图',
                subtext: `节点: ${data.metadata.totalNodes} | 边: ${data.metadata.totalEdges}`,
                left: 'center',
            },
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    if (params.dataType === 'node') {
                        const node = params.data as TableNode
                        return `
              <div style="padding: 8px;">
                <strong>${node.name}</strong><br/>
                数据库: ${node.database}<br/>
                分类: ${node.category}<br/>
                字段数: ${node.fieldCount}<br/>
                记录数: ${node.recordCount.toLocaleString()}
              </div>
            `
                    } else if (params.dataType === 'edge') {
                        const edge = params.data as RelationshipEdge
                        return `
              <div style="padding: 8px;">
                <strong>${edge.description}</strong><br/>
                关系类型: ${edge.relationshipType}<br/>
                强度: ${(edge.strength * 100).toFixed(1)}%<br/>
                方向: ${edge.direction}
              </div>
            `
                    }
                },
            },
            legend: {
                data: ['患者数据', '临床数据', '检验数据', '药品数据', '影像数据', '管理数据'],
                orient: 'vertical',
                left: 'left',
            },
            series: [
                {
                    name: '数据血缘',
                    type: 'graph',
                    layout: layoutType,
                    data: data.nodes.map(node => ({
                        ...node,
                        category: node.category,
                        symbolSize: Math.sqrt(node.recordCount / 10000) + 20,
                        label: {
                            show: showLabels,
                            position: 'bottom',
                            formatter: '{b}',
                        },
                        itemStyle: {
                            color: getNodeColor(node.category),
                        },
                    })),
                    links: data.edges.map(edge => ({
                        ...edge,
                        lineStyle: {
                            width: edge.strength * 5,
                            curveness: 0.1,
                            color: getEdgeColor(edge.relationshipType),
                        },
                        label: {
                            show: showMetrics,
                            formatter: `${(edge.strength * 100).toFixed(0)}%`,
                        },
                    })),
                    categories: [
                        { name: '患者数据' },
                        { name: '临床数据' },
                        { name: '检验数据' },
                        { name: '药品数据' },
                        { name: '影像数据' },
                        { name: '管理数据' },
                    ],
                    roam: true,
                    draggable: true,
                    focusNodeAdjacency: true,
                    force: {
                        repulsion: 1000,
                        gravity: 0.1,
                        edgeLength: 200,
                        layoutAnimation: true,
                    },
                    emphasis: {
                        focus: 'adjacency',
                        lineStyle: {
                            width: 10,
                        },
                    },
                },
            ],
            toolbox: {
                feature: {
                    saveAsImage: {
                        title: '保存图片',
                    },
                    restore: {
                        title: '还原',
                    },
                },
            },
        }

        chart.setOption(option)

        // 添加点击事件
        chart.on('click', (params: any) => {
            if (params.dataType === 'node') {
                setSelectedNode(params.data)
                setModalVisible(true)
            }
        })

        // 响应式调整
        window.addEventListener('resize', () => {
            chart.resize()
        })
    }

    const getNodeColor = (category: string) => {
        const colorMap: Record<string, string> = {
            患者数据: '#1890ff',
            临床数据: '#52c41a',
            检验数据: '#faad14',
            药品数据: '#f5222d',
            影像数据: '#722ed1',
            管理数据: '#13c2c2',
        }
        return colorMap[category] || '#8c8c8c'
    }

    const getEdgeColor = (relationshipType: string) => {
        const colorMap: Record<string, string> = {
            lineage: '#1890ff',
            dependency: '#52c41a',
            reference: '#faad14',
        }
        return colorMap[relationshipType] || '#8c8c8c'
    }

    const handleRefresh = () => {
        loadData()
    }

    const handleExport = () => {
        if (chartInstance) {
            const url = chartInstance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: '#fff',
            })
            const link = document.createElement('a')
            link.download = `数据血缘图_${moment().format('YYYYMMDDHHmmss')}.png`
            link.href = url
            link.click()
        }
    }

    const handleZoomIn = () => {
        if (chartInstance) {
            chartInstance.dispatchAction({
                type: 'scale',
                scale: 1.2,
            })
        }
    }

    const handleZoomOut = () => {
        if (chartInstance) {
            chartInstance.dispatchAction({
                type: 'scale',
                scale: 0.8,
            })
        }
    }

    const filteredNodes =
        data?.nodes.filter(node => {
            if (selectedDatabase && node.database !== selectedDatabase) return false
            if (selectedCategory && node.category !== selectedCategory) return false
            return true
        }) || []

    const filteredEdges =
        data?.edges.filter(edge => {
            const sourceExists = filteredNodes.some(node => node.id === edge.source)
            const targetExists = filteredNodes.some(node => node.id === edge.target)
            return sourceExists && targetExists
        }) || []

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ marginBottom: 16 }}>
                    <Space style={{ marginBottom: 16 }}>
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                            刷新
                        </Button>
                        <Button icon={<DownloadOutlined />} onClick={handleExport}>
                            导出图片
                        </Button>
                        <Button.Group>
                            <Button icon={<ExpandOutlined />} onClick={handleZoomIn}>
                                放大
                            </Button>
                            <Button icon={<ShrinkOutlined />} onClick={handleZoomOut}>
                                缩小
                            </Button>
                        </Button.Group>
                    </Space>

                    <Space style={{ marginBottom: 16 }}>
                        <Select
                            placeholder='选择数据库'
                            style={{ width: 150 }}
                            value={selectedDatabase}
                            onChange={setSelectedDatabase}
                            allowClear
                        >
                            <Option value='patient_db'>患者数据库</Option>
                            <Option value='clinical_db'>临床数据库</Option>
                            <Option value='lab_db'>检验数据库</Option>
                            <Option value='pharmacy_db'>药品数据库</Option>
                            <Option value='imaging_db'>影像数据库</Option>
                            <Option value='admin_db'>管理数据库</Option>
                        </Select>
                        <Select
                            placeholder='选择分类'
                            style={{ width: 150 }}
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            allowClear
                        >
                            <Option value='患者数据'>患者数据</Option>
                            <Option value='临床数据'>临床数据</Option>
                            <Option value='检验数据'>检验数据</Option>
                            <Option value='药品数据'>药品数据</Option>
                            <Option value='影像数据'>影像数据</Option>
                            <Option value='管理数据'>管理数据</Option>
                        </Select>
                        <Select
                            placeholder='布局类型'
                            style={{ width: 150 }}
                            value={layoutType}
                            onChange={setLayoutType}
                        >
                            <Option value='force'>力导向布局</Option>
                            <Option value='circular'>环形布局</Option>
                            <Option value='hierarchical'>层次布局</Option>
                        </Select>
                    </Space>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Alert
                        message='数据血缘关系图'
                        description={`显示 ${data?.metadata.totalNodes || 0} 个数据表之间的 ${data?.metadata.totalEdges || 0} 个关联关系。点击节点查看详细信息，拖拽可以移动节点。`}
                        type='info'
                        showIcon
                    />
                </div>

                <div
                    ref={chartRef}
                    style={{
                        width: '100%',
                        height: '600px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                    }}
                />

                <div style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Card size='small' title='图例说明'>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>节点分类:</strong>
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 12,
                                            height: 12,
                                            backgroundColor: '#1890ff',
                                            marginRight: 8,
                                        }}
                                    ></span>
                                    患者数据
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 12,
                                            height: 12,
                                            backgroundColor: '#52c41a',
                                            marginRight: 8,
                                        }}
                                    ></span>
                                    临床数据
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 12,
                                            height: 12,
                                            backgroundColor: '#faad14',
                                            marginRight: 8,
                                        }}
                                    ></span>
                                    检验数据
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 12,
                                            height: 12,
                                            backgroundColor: '#f5222d',
                                            marginRight: 8,
                                        }}
                                    ></span>
                                    药品数据
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 12,
                                            height: 12,
                                            backgroundColor: '#722ed1',
                                            marginRight: 8,
                                        }}
                                    ></span>
                                    影像数据
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 12,
                                            height: 12,
                                            backgroundColor: '#13c2c2',
                                            marginRight: 8,
                                        }}
                                    ></span>
                                    管理数据
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <strong>连线类型:</strong>
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 20,
                                            height: 2,
                                            backgroundColor: '#1890ff',
                                            marginRight: 8,
                                        }}
                                    ></span>
                                    数据血缘
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 20,
                                            height: 2,
                                            backgroundColor: '#52c41a',
                                            marginRight: 8,
                                        }}
                                    ></span>
                                    依赖关系
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 20,
                                            height: 2,
                                            backgroundColor: '#faad14',
                                            marginRight: 8,
                                        }}
                                    ></span>
                                    引用关系
                                </div>
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card size='small' title='统计信息'>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>数据表数量:</strong> {data?.metadata.totalNodes || 0}
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>关联关系数量:</strong> {data?.metadata.totalEdges || 0}
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>最后更新时间:</strong> {data?.metadata.lastUpdateTime}
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>数据源:</strong> {data?.metadata.dataSource}
                                </div>
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card size='small' title='操作说明'>
                                <div style={{ marginBottom: 8 }}>• 点击节点查看详细信息</div>
                                <div style={{ marginBottom: 8 }}>• 拖拽节点可以移动位置</div>
                                <div style={{ marginBottom: 8 }}>• 滚轮缩放图形大小</div>
                                <div style={{ marginBottom: 8 }}>• 拖拽空白区域可以平移视图</div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Card>

            <Modal
                title='数据表详情'
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key='close' onClick={() => setModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={600}
            >
                {selectedNode && (
                    <div>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label='表名' span={2}>
                                {selectedNode.name}
                            </Descriptions.Item>
                            <Descriptions.Item label='数据库'>
                                {selectedNode.database}
                            </Descriptions.Item>
                            <Descriptions.Item label='模式'>
                                {selectedNode.schema}
                            </Descriptions.Item>
                            <Descriptions.Item label='类型' span={2}>
                                <Tag color={selectedNode.type === 'table' ? 'blue' : 'green'}>
                                    {selectedNode.type === 'table' ? '表' : '视图'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label='分类'>
                                {selectedNode.category}
                            </Descriptions.Item>
                            <Descriptions.Item label='字段数'>
                                {selectedNode.fieldCount}
                            </Descriptions.Item>
                            <Descriptions.Item label='记录数'>
                                {selectedNode.recordCount.toLocaleString()}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 16 }}>
                            <strong>相关关联:</strong>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            {data?.edges
                                .filter(
                                    edge =>
                                        edge.source === selectedNode.id ||
                                        edge.target === selectedNode.id
                                )
                                .map(edge => (
                                    <div
                                        key={edge.id}
                                        style={{
                                            marginBottom: 4,
                                            padding: '4px 8px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {edge.description} (置信度:{' '}
                                        {(edge.strength * 100).toFixed(1)}%)
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default VisualizationManagement
