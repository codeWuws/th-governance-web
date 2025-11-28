import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Select,
    Tag,
    Modal,
    Alert,
    Checkbox,
    Descriptions,
    Divider,
    Typography,
    message,
    Tooltip,
    Row,
    Col,
} from 'antd'
import {
    SearchOutlined,
    ReloadOutlined,
    MergeCellsOutlined,
    UserOutlined,
    IdcardOutlined,
    ManOutlined,
    WomanOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

// 患者信息接口
interface PatientInfo {
    id: string
    name: string
    idCard: string // 身份证号
    gender: 'male' | 'female' | 'unknown'
    age: number
    phone?: string
    address?: string
    empi?: string // 患者主索引
    hospitalId?: string // 医院ID
    department?: string // 科室
    createTime: string
    updateTime: string
}

// 模拟患者数据
const mockPatients: PatientInfo[] = [
    {
        id: '1',
        name: '陈建华',
        idCard: '110101198503151234',
        gender: 'male',
        age: 39,
        phone: '13812345678',
        address: '北京市朝阳区建国路88号阳光花园3栋2单元501室',
        empi: 'EMPI001',
        hospitalId: 'BJ001',
        department: '心血管内科',
        createTime: '2024-01-15 09:23:15',
        updateTime: '2024-01-15 09:23:15',
            },
            {
                id: '2',
        name: '陈建华',
        idCard: '', // 身份证号为空，可以与前一个合并
        gender: 'male',
        age: 39,
        phone: '13987654321',
        address: '北京市海淀区中关村大街1号科技大厦A座1205',
        empi: 'EMPI002',
        hospitalId: 'BJ002',
        department: '普通外科',
        createTime: '2024-01-16 10:45:32',
        updateTime: '2024-01-16 10:45:32',
            },
            {
                id: '3',
        name: '王秀英',
        idCard: '310115199006221456',
        gender: 'female',
        age: 34,
        phone: '13612345678',
        address: '上海市浦东新区陆家嘴环路1000号恒生银行大厦15楼',
        empi: 'EMPI003',
        hospitalId: 'SH001',
        department: '妇产科',
        createTime: '2024-01-17 11:12:48',
        updateTime: '2024-01-17 11:12:48',
            },
            {
                id: '4',
        name: '李明强',
        idCard: '440103198812081234',
        gender: 'male',
        age: 36,
        phone: '13765432109',
        address: '广州市天河区天河路123号天河北商务中心B座2008',
        empi: 'EMPI004',
        hospitalId: 'GZ001',
        department: '骨科',
        createTime: '2024-01-18 12:30:22',
        updateTime: '2024-01-18 12:30:22',
    },
    {
        id: '5',
        name: '陈建华',
        idCard: '110101198503151234',
        gender: 'male',
        age: 39,
        phone: '13812345679',
        address: '北京市西城区金融街27号投资广场A座1802',
        empi: 'EMPI005',
        hospitalId: 'BJ003',
        department: '心内科',
        createTime: '2024-01-19 13:55:17',
        updateTime: '2024-01-19 13:55:17',
    },
    {
        id: '6',
        name: '张丽华',
        idCard: '510104199204051234',
        gender: 'female',
        age: 32,
        phone: '13598765432',
        address: '成都市锦江区春熙路123号时代广场C座1503',
        empi: 'EMPI006',
        hospitalId: 'CD001',
        department: '儿科',
        createTime: '2024-01-20 14:18:45',
        updateTime: '2024-01-20 14:18:45',
    },
    {
        id: '6-1',
        name: '张丽华',
        idCard: '', // 身份证号为空，可以与前一个合并
        gender: 'female',
        age: 32,
        phone: '13598765433',
        address: '成都市武侯区天府大道中段666号天府国际金融中心2号楼',
        empi: 'EMPI006-1',
        hospitalId: 'CD002',
        department: '新生儿科',
        createTime: '2024-01-20 15:30:20',
        updateTime: '2024-01-20 15:30:20',
    },
    {
        id: '7',
        name: '王秀英',
        idCard: '310115199006221456',
        gender: 'female',
        age: 34,
        phone: '13612345679',
        address: '上海市黄浦区南京东路100号外滩中心28楼',
        empi: 'EMPI007',
        hospitalId: 'SH002',
        department: '皮肤科',
        createTime: '2024-01-21 15:42:33',
        updateTime: '2024-01-21 15:42:33',
    },
    {
        id: '8',
        name: '刘志强',
        idCard: '330106199108121234',
        gender: 'male',
        age: 33,
        phone: '13912345678',
        address: '杭州市西湖区文三路259号昌地火炬大厦1号楼1201',
        empi: 'EMPI008',
        hospitalId: 'HZ001',
        department: '眼科',
        createTime: '2024-01-22 16:25:10',
        updateTime: '2024-01-22 16:25:10',
    },
    {
        id: '8-1',
        name: '刘志强',
        idCard: '', // 身份证号为空，可以与前一个合并
        gender: 'male',
        age: 33,
        phone: '13912345679',
        address: '杭州市上城区解放路178号浙江财富金融中心东楼',
        empi: 'EMPI008-1',
        hospitalId: 'HZ002',
        department: '眼底病科',
        createTime: '2024-01-22 17:10:35',
        updateTime: '2024-01-22 17:10:35',
    },
    {
        id: '9',
        name: '赵敏',
        idCard: '120101199507081234',
        gender: 'female',
        age: 29,
        phone: '13876543210',
        address: '天津市和平区南京路219号天津中心大厦A座2005',
        empi: 'EMPI009',
        hospitalId: 'TJ001',
        department: '内分泌科',
        createTime: '2024-01-23 08:15:28',
        updateTime: '2024-01-23 08:15:28',
    },
    {
        id: '9-1',
        name: '赵敏',
        idCard: '', // 身份证号为空，可以与前一个合并
        gender: 'female',
        age: 29,
        phone: '13876543211',
        address: '天津市河西区友谊路32号友谊商厦B座1502',
        empi: 'EMPI009-1',
        hospitalId: 'TJ002',
        department: '糖尿病科',
        createTime: '2024-01-23 09:25:15',
        updateTime: '2024-01-23 09:25:15',
    },
    {
        id: '10',
        name: '孙建国',
        idCard: '320102198706201234',
        gender: 'male',
        age: 37,
        phone: '13712345678',
        address: '南京市鼓楼区中山路321号金鹰国际购物中心B座1806',
        empi: 'EMPI010',
        hospitalId: 'NJ001',
        department: '神经内科',
        createTime: '2024-01-24 09:50:42',
        updateTime: '2024-01-24 09:50:42',
    },
    {
        id: '11',
        name: '周文静',
        idCard: '420102199301151234',
        gender: 'female',
        age: 31,
        phone: '13665432109',
        address: '武汉市江汉区解放大道688号武汉广场A座2201',
        empi: 'EMPI011',
        hospitalId: 'WH001',
        department: '呼吸内科',
        createTime: '2024-01-25 10:33:55',
        updateTime: '2024-01-25 10:33:55',
    },
    {
        id: '12',
        name: '陈建华',
        idCard: '110101198503151234',
        gender: 'male',
        age: 39,
        phone: '13812345680',
        address: '北京市丰台区南三环西路16号首开福茂购物中心3层',
        empi: 'EMPI012',
        hospitalId: 'BJ004',
        department: '消化内科',
        createTime: '2024-01-26 11:20:18',
        updateTime: '2024-01-26 11:20:18',
    },
    {
        id: '13',
        name: '王秀英',
        idCard: '310115199006221456',
        gender: 'female',
        age: 34,
        phone: '13612345680',
        address: '上海市静安区南京西路1376号上海商城西峰2201',
        empi: 'EMPI013',
        hospitalId: 'SH003',
        department: '肿瘤科',
        createTime: '2024-01-27 13:45:30',
        updateTime: '2024-01-27 13:45:30',
    },
    {
        id: '14',
        name: '马强',
        idCard: '610104198911251234',
        gender: 'male',
        age: 35,
        phone: '13512345678',
        address: '西安市雁塔区高新一路2号创业大厦B座1605',
        empi: 'EMPI014',
        hospitalId: 'XA001',
        department: '泌尿外科',
        createTime: '2024-01-28 14:12:47',
        updateTime: '2024-01-28 14:12:47',
    },
    {
        id: '15',
        name: '林晓红',
        idCard: '350102199408121234',
        gender: 'female',
        age: 30,
        phone: '13965432109',
        address: '福州市鼓楼区五四路111号宜发大厦A座1903',
        empi: 'EMPI015',
        hospitalId: 'FZ001',
        department: '血液内科',
        createTime: '2024-01-29 15:30:25',
        updateTime: '2024-01-29 15:30:25',
    },
    {
        id: '16',
        name: '吴明',
        idCard: '', // 身份证号为空
        gender: 'male',
        age: 28,
        phone: '13811111111',
        address: '深圳市南山区科技园南区深圳湾科技生态园10栋A座',
        empi: 'EMPI016',
        hospitalId: 'SZ001',
        department: '急诊科',
        createTime: '2024-01-30 08:15:20',
        updateTime: '2024-01-30 08:15:20',
    },
    {
        id: '17',
        name: '吴明',
        idCard: '', // 身份证号为空，可以与前一个合并
        gender: 'male',
        age: 28,
        phone: '13822222222',
        address: '深圳市福田区深南大道1006号国际创新中心A座',
        empi: 'EMPI017',
        hospitalId: 'SZ002',
        department: '骨科',
        createTime: '2024-01-30 09:30:45',
        updateTime: '2024-01-30 09:30:45',
    },
    {
        id: '18',
        name: '杨静',
        idCard: '500101199201151234', // 有身份证号
        gender: 'female',
        age: 33,
        phone: '13933333333',
        address: '重庆市渝中区解放碑步行街88号大都会东方广场',
        empi: 'EMPI018',
        hospitalId: 'CQ001',
        department: '妇科',
        createTime: '2024-01-31 10:20:30',
        updateTime: '2024-01-31 10:20:30',
    },
    {
        id: '19',
        name: '杨静',
        idCard: '', // 身份证号为空，可以与前一个合并（部分存在）
        gender: 'female',
        age: 33,
        phone: '13944444444',
        address: '重庆市江北区观音桥步行街9号',
        empi: 'EMPI019',
        hospitalId: 'CQ002',
        department: '产科',
        createTime: '2024-01-31 11:45:15',
        updateTime: '2024-01-31 11:45:15',
    },
    {
        id: '20',
        name: '黄强',
        idCard: '450101198801201234', // 身份证号存在
        gender: 'male',
        age: 36,
        phone: '13755555555',
        address: '南宁市青秀区民族大道136号华润大厦A座',
        empi: 'EMPI020',
        hospitalId: 'NN001',
        department: '胸外科',
        createTime: '2024-02-01 14:10:25',
        updateTime: '2024-02-01 14:10:25',
    },
    {
        id: '21',
        name: '黄强',
        idCard: '450101198802211234', // 身份证号存在但不同，不能合并
        gender: 'male',
        age: 36,
        phone: '13766666666',
        address: '南宁市西乡塘区大学东路100号',
        empi: 'EMPI021',
        hospitalId: 'NN002',
        department: '神经外科',
        createTime: '2024-02-01 15:30:40',
        updateTime: '2024-02-01 15:30:40',
    },
]

// 身份证号脱敏处理
const maskIdCard = (idCard: string): string => {
    if (!idCard || idCard.length < 8) return idCard
    const start = idCard.substring(0, 4)
    const end = idCard.substring(idCard.length - 4)
    return `${start}${'*'.repeat(idCard.length - 8)}${end}`
}

// 手机号脱敏处理
const maskPhone = (phone?: string): string => {
    if (!phone || phone.length < 7) return phone || '-'
    const start = phone.substring(0, 3)
    const end = phone.substring(phone.length - 4)
    return `${start}****${end}`
}

const IndexProcessingManagement: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [patients, setPatients] = useState<PatientInfo[]>([])
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [searchText, setSearchText] = useState('')
    const [genderFilter, setGenderFilter] = useState<string>('')
    const [mergeModalVisible, setMergeModalVisible] = useState(false)
    const [mergePatients, setMergePatients] = useState<PatientInfo[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const debouncedSearchText = useDebounce(searchText, 300)

    // 获取数据
    const fetchData = async () => {
        setLoading(true)
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500))
            setPatients(mockPatients)
        } catch {
            message.error('获取患者数据失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // 过滤数据
    const filteredPatients = useMemo(() => {
        let filtered = [...patients]

        // 搜索过滤
        if (debouncedSearchText) {
            const searchLower = debouncedSearchText.toLowerCase()
            filtered = filtered.filter(
                patient =>
                    patient.name.toLowerCase().includes(searchLower) ||
                    patient.idCard.includes(debouncedSearchText) ||
                    patient.phone?.includes(debouncedSearchText) ||
                    patient.empi?.toLowerCase().includes(searchLower)
            )
        }

        // 性别过滤
        if (genderFilter) {
            filtered = filtered.filter(patient => patient.gender === genderFilter)
        }

        return filtered
    }, [patients, debouncedSearchText, genderFilter])

    // 按姓名分组，找出同名患者
    const patientsByName = useMemo(() => {
        const nameMap = new Map<string, PatientInfo[]>()
        filteredPatients.forEach(patient => {
            const name = patient.name
            if (!nameMap.has(name)) {
                nameMap.set(name, [])
            }
            nameMap.get(name)!.push(patient)
        })
        return nameMap
    }, [filteredPatients])

    // 获取同名患者列表
    const getSameNamePatients = (name: string): PatientInfo[] => {
        return patientsByName.get(name) || []
    }

    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchText(value)
        setCurrentPage(1) // 重置到第一页
    }

    // 处理选择
    const handleSelectChange = (selectedKeys: React.Key[]) => {
        setSelectedRowKeys(selectedKeys)
    }

    // 处理合并
    const handleMerge = () => {
        if (selectedRowKeys.length < 2) {
            message.warning('请至少选择2个患者进行合并')
            return
        }

        const selectedPatients = patients.filter(p => selectedRowKeys.includes(p.id))
        
        // 检查是否同名
        const names = new Set(selectedPatients.map(p => p.name))
        if (names.size > 1) {
            message.warning('只能合并同名患者，请选择相同姓名的患者')
            return
        }

        // 检查身份证号情况
        const idCards = selectedPatients
            .map(p => p.idCard)
            .filter(idCard => idCard && idCard.trim() !== '') // 过滤掉空值
        
        if (idCards.length >= 2) {
            // 如果至少有两个身份证号，检查是否都相同
            const uniqueIdCards = new Set(idCards)
            if (uniqueIdCards.size > 1) {
                message.warning('同名患者中，如果身份证号都存在但不同，不能合并')
                return
            }
        }

        // 可以合并的情况：
        // 1. 身份证号都为空
        // 2. 身份证号部分存在（有的有有的没有）
        // 3. 身份证号都存在且相同
        setMergePatients(selectedPatients)
        setMergeModalVisible(true)
    }

    // 确认合并
    const handleConfirmMerge = async () => {
        if (mergePatients.length === 0) {
            message.warning('没有可合并的患者')
            return
        }

        try {
            setLoading(true)
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // 合并逻辑：保留第一个，删除其他的
            const targetPatient = mergePatients[0]
            if (!targetPatient) {
                message.error('合并失败：未找到目标患者')
                return
            }

            const mergedEmpi = targetPatient.empi || `EMPI${Date.now()}`
            
            // 更新患者数据
            const updatedPatients = patients.map(patient => {
                if (mergePatients.some(p => p.id === patient.id && p.id !== targetPatient.id)) {
                    // 标记为已合并
                    return { ...patient, empi: mergedEmpi }
                }
                return patient
            })

            // 移除被合并的患者（保留第一个）
            const remainingPatients = updatedPatients.filter(
                patient => patient.id === targetPatient.id || !mergePatients.some(p => p.id === patient.id)
            )

            setPatients(remainingPatients)
            setSelectedRowKeys([])
            setMergeModalVisible(false)
            message.success(`成功合并 ${mergePatients.length} 个患者记录`)
        } catch {
            message.error('合并失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    // 渲染性别
    const renderGender = (gender: string) => {
        switch (gender) {
            case 'male':
                return (
                    <Tag icon={<ManOutlined />} color='blue'>
                        男
                    </Tag>
                )
            case 'female':
                return (
                    <Tag icon={<WomanOutlined />} color='pink'>
                        女
                    </Tag>
                )
            default:
                return <Tag>未知</Tag>
        }
    }

    // 表格列定义
    const columns: ColumnsType<PatientInfo> = [
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
            width: 120,
            render: (text: string, record: PatientInfo) => {
                const sameNameCount = getSameNamePatients(text).length
                return (
                    <Space>
                        <Text strong>{text}</Text>
                        {sameNameCount > 1 && (
                            <Tag color='orange'>
                                同名{sameNameCount}人
                            </Tag>
                        )}
                </Space>
                )
            },
        },
        {
            title: '身份证号',
            dataIndex: 'idCard',
            key: 'idCard',
            width: 180,
            render: (idCard: string) => {
                if (!idCard || idCard.trim() === '') {
                    return (
                        <Space>
                            <IdcardOutlined />
                            <Text type='secondary'>-</Text>
                        </Space>
                    )
                }
                return (
                    <Tooltip title={idCard}>
                        <Space>
                            <IdcardOutlined />
                            <Text code>{maskIdCard(idCard)}</Text>
                        </Space>
                    </Tooltip>
                )
            },
        },
        {
            title: '性别',
            dataIndex: 'gender',
            key: 'gender',
            width: 80,
            render: renderGender,
        },
        {
            title: '年龄',
            dataIndex: 'age',
            key: 'age',
            width: 80,
            render: (age: number) => `${age}岁`,
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            width: 140,
            render: (phone?: string) => (
                <Tooltip title={phone}>
                    <Text>{maskPhone(phone)}</Text>
                </Tooltip>
            ),
        },
        {
            title: '患者主索引',
            dataIndex: 'empi',
            key: 'empi',
            width: 120,
            render: (empi?: string) => (
                <Text code style={{ fontSize: 12 }}>
                    {empi || '-'}
                </Text>
            ),
        },
        {
            title: '医院ID',
            dataIndex: 'hospitalId',
            key: 'hospitalId',
            width: 100,
        },
        {
            title: '科室',
            dataIndex: 'department',
            key: 'department',
            width: 120,
        },
        {
            title: '地址',
            dataIndex: 'address',
            key: 'address',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (address?: string) => (
                <Tooltip placement='topLeft' title={address}>
                    {address || '-'}
                    </Tooltip>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            key: 'createTime',
            width: 160,
        },
    ]

    // 计算分页数据
    const paginatedPatients = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filteredPatients.slice(start, end)
    }, [filteredPatients, currentPage, pageSize])

    return (
        <div style={{ padding: 0 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    患者索引处理
                </Title>
            </div>

            <Alert
                message='患者索引处理'
                description='查看患者信息，支持搜索和筛选。选择同名患者记录进行合并处理，统一患者主索引。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Card>
                {/* 搜索和筛选区域 */}
                <div style={{ marginBottom: 24 }}>
                    <Row gutter={16} align='middle'>
                        <Col flex='auto'>
                            <Space size='middle'>
                                <Search
                                    placeholder='搜索姓名、身份证号、手机号或主索引'
                                    allowClear
                                    onSearch={handleSearch}
                                    onChange={e => setSearchText(e.target.value)}
                                    style={{ width: 300 }}
                                    prefix={<SearchOutlined />}
                                />
                                <Select
                                    placeholder='性别筛选'
                                    style={{ width: 120 }}
                                    allowClear
                                    onChange={setGenderFilter}
                                >
                                    <Option value='male'>男</Option>
                                    <Option value='female'>女</Option>
                                    <Option value='unknown'>未知</Option>
                                </Select>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={fetchData}
                                    loading={loading}
                                >
                                    刷新
                                </Button>
                            </Space>
                        </Col>
                        <Col>
                            <Space>
                                <Text type='secondary'>
                                    已选择 {selectedRowKeys.length} 个患者
                                </Text>
                                <Button
                                    type='primary'
                                    icon={<MergeCellsOutlined />}
                                    onClick={handleMerge}
                                    disabled={selectedRowKeys.length < 2}
                                >
                                    合并选中患者
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>

                {/* 患者表格 */}
                <Table
                    columns={columns}
                    dataSource={paginatedPatients}
                    loading={loading}
                    rowKey='id'
                    rowSelection={{
                        selectedRowKeys,
                        onChange: handleSelectChange,
                        getCheckboxProps: (record: PatientInfo) => ({
                            name: record.name,
                        }),
                    }}
                    scroll={{ x: 1400 }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: filteredPatients.length,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, size) => {
                            setCurrentPage(page)
                            setPageSize(size || 10)
                        },
                    }}
                />
            </Card>

            {/* 合并确认弹窗 */}
            <Modal
                title='确认合并患者'
                open={mergeModalVisible}
                onOk={handleConfirmMerge}
                onCancel={() => {
                    setMergeModalVisible(false)
                    setMergePatients([])
                }}
                width={800}
                okText='确认合并'
                cancelText='取消'
            >
                <Alert
                    message='合并操作说明'
                    description='合并后将保留第一个患者记录作为主记录，其他记录将被合并到主记录中。此操作不可撤销，请谨慎操作。'
                    type='warning'
                    showIcon
                    style={{ marginBottom: 16 }}
                />
                <Divider orientation='left'>待合并的患者信息</Divider>
                {mergePatients.map((patient, index) => (
                    <Card
                        key={patient.id}
                        size='small'
                        style={{ marginBottom: 12 }}
                        title={
                            <Space>
                                <Text strong>患者 {index + 1}</Text>
                                {index === 0 && (
                                    <Tag color='green'>主记录（保留）</Tag>
                                )}
                                </Space>
                        }
                    >
                        <Descriptions column={2} size='small' bordered>
                            <Descriptions.Item label='姓名'>{patient.name}</Descriptions.Item>
                            <Descriptions.Item label='身份证号'>
                                {patient.idCard && patient.idCard.trim() !== '' ? (
                                    <Text code>{maskIdCard(patient.idCard)}</Text>
                                ) : (
                                    <Text type='secondary'>-</Text>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label='性别'>
                                {renderGender(patient.gender)}
                            </Descriptions.Item>
                            <Descriptions.Item label='年龄'>{patient.age}岁</Descriptions.Item>
                            <Descriptions.Item label='手机号'>{maskPhone(patient.phone)}</Descriptions.Item>
                            <Descriptions.Item label='患者主索引'>
                                <Text code>{patient.empi || '-'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label='医院ID'>{patient.hospitalId}</Descriptions.Item>
                            <Descriptions.Item label='科室'>{patient.department}</Descriptions.Item>
                            <Descriptions.Item label='地址' span={2}>
                                {patient.address || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                ))}
            </Modal>
        </div>
    )
}

export default IndexProcessingManagement
