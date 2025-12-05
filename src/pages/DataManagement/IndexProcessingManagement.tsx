import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Table,
    Button,
    Space,
    Input,
    Select,
    Tag,
    Alert,
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
    HistoryOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { dataManagementService } from '../../services/dataManagementService'
import type { PatientEmpiRecord } from '../../types'
import { uiMessage } from '../../utils/uiMessage'
import { logger } from '../../utils/logger'
import { showDialog } from '../../utils/showDialog'

const { Title, Text } = Typography
const { Option } = Select

// 合并确认弹窗组件接口
interface MergeConfirmDialogProps {
    patients: PatientEmpiRecord[]
    onConfirm: (basePatientIndex: number) => Promise<void>
    basePatientIndexRef: React.MutableRefObject<number>
}

// 合并历史弹窗组件
const MergeHistoryDialog: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [records, setRecords] = useState<PatientEmpiRecord[]>([])
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    
    // 搜索条件（去掉关键字模糊查询）
    const [searchName, setSearchName] = useState('')
    const [searchSexCode, setSearchSexCode] = useState<string>('')
    const [searchIdNumber, setSearchIdNumber] = useState('')
    const [searchHospitalNo, setSearchHospitalNo] = useState('')
    
    // 实际用于搜索的条件
    const [activeName, setActiveName] = useState('')
    const [activeSexCode, setActiveSexCode] = useState<string>('')
    const [activeIdNumber, setActiveIdNumber] = useState('')
    const [activeHospitalNo, setActiveHospitalNo] = useState('')

    // 获取合并历史数据
    const fetchHistoryData = async () => {
        setLoading(true)
        try {
            const params: {
                pageNum: number
                pageSize: number
                sortField?: string
                sortOrder?: 'asc' | 'desc'
                name?: string
                sexCode?: string
                idNumber?: string
                hospitalNo?: string
            } = {
                pageNum: currentPage,
                pageSize: pageSize,
                sortField: 'create_time',
                sortOrder: 'desc',
            }

            // 添加搜索条件
            if (activeName.trim()) {
                params.name = activeName.trim()
            }
            if (activeSexCode) {
                params.sexCode = activeSexCode
            }
            if (activeIdNumber.trim()) {
                params.idNumber = activeIdNumber.trim()
            }
            if (activeHospitalNo.trim()) {
                params.hospitalNo = activeHospitalNo.trim()
            }

            const response = await dataManagementService.getPatientEmpiDistributionRecordList(params)

            if (response.code === 200) {
                const data = response.data
                setRecords(data.records || [])
                setTotal(parseInt(data.total || '0', 10))
                logger.info('成功获取合并历史记录', {
                    recordsCount: data.records?.length || 0,
                    total: data.total,
                })
            } else {
                const errorMsg = (response as any).msg || (response as any).message || '获取合并历史记录失败'
                uiMessage.error(errorMsg)
                logger.error('获取合并历史记录失败', new Error(errorMsg))
            }
        } catch (error) {
            logger.error('获取合并历史记录异常', error as Error)
            uiMessage.error('获取合并历史记录失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    // 当分页或搜索条件变化时，重新获取数据
    useEffect(() => {
        fetchHistoryData()
    }, [currentPage, pageSize, activeName, activeSexCode, activeIdNumber, activeHospitalNo])

    // 处理搜索
    const handleSearch = () => {
        setActiveName(searchName)
        setActiveSexCode(searchSexCode)
        setActiveIdNumber(searchIdNumber)
        setActiveHospitalNo(searchHospitalNo)
        setCurrentPage(1)
    }

    // 清空搜索
    const handleClearSearch = () => {
        setSearchName('')
        setSearchSexCode('')
        setSearchIdNumber('')
        setSearchHospitalNo('')
        setActiveName('')
        setActiveSexCode('')
        setActiveIdNumber('')
        setActiveHospitalNo('')
        setCurrentPage(1)
    }

    // 处理分页变化
    const handlePageChange = (page: number, size?: number) => {
        setCurrentPage(page)
        if (size && size !== pageSize) {
            setPageSize(size)
            setCurrentPage(1)
        }
    }

    // 表格列定义
    const columns: ColumnsType<PatientEmpiRecord> = useMemo(() => {
        return [
            {
                title: '患者姓名',
                dataIndex: 'patientName',
                key: 'patientName',
                width: 120,
                fixed: 'left' as const,
                render: (text: string) => <Text strong>{text?.trim() || '-'}</Text>,
            },
            {
                title: '性别',
                dataIndex: 'sexCode',
                key: 'sexCode',
                width: 80,
                render: (value: string | null) => {
                    if (!value) return <Text type='secondary'>-</Text>
                    const genderMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
                        '1': { icon: <ManOutlined />, color: 'blue', label: '男' },
                        '0': { icon: <WomanOutlined />, color: 'pink', label: '女' },
                    }
                    const gender = genderMap[value] || { icon: null, color: 'default', label: value }
                    return (
                        <Tag icon={gender.icon} color={gender.color}>
                            {gender.label}
                        </Tag>
                    )
                },
            },
            {
                title: '出生日期',
                dataIndex: 'birthDate',
                key: 'birthDate',
                width: 120,
                render: (value: string | null) => <Text>{value?.trim() || '-'}</Text>,
            },
            {
                title: '身份证号',
                dataIndex: 'idNumber',
                key: 'idNumber',
                width: 180,
                render: (value: string | null) => {
                    if (!value || value.trim() === '') {
                        return <Text type='secondary'>-</Text>
                    }
                    return (
                        <Tooltip title={value}>
                            <Text code>{maskIdCard(value)}</Text>
                        </Tooltip>
                    )
                },
            },
            {
                title: '手机号',
                dataIndex: 'phone',
                key: 'phone',
                width: 140,
                render: (value: string | null) => {
                    if (!value) return <Text type='secondary'>-</Text>
                    return (
                        <Tooltip title={value}>
                            <Text>{maskPhone(value)}</Text>
                        </Tooltip>
                    )
                },
            },
            {
                title: '医院编号',
                dataIndex: 'hospitalNo',
                key: 'hospitalNo',
                width: 120,
                render: (value: string | null) => <Text>{value?.trim() || '-'}</Text>,
            },
            {
                title: '登记号',
                dataIndex: 'registrationNumber',
                key: 'registrationNumber',
                width: 120,
                render: (value: string | null) => <Text code>{value?.trim() || '-'}</Text>,
            },
            {
                title: '就诊类型',
                dataIndex: 'consulationType',
                key: 'consulationType',
                width: 100,
                render: (value: string | null) => {
                    if (!value) return <Text type='secondary'>-</Text>
                    const typeMap: Record<string, { label: string; color: string }> = {
                        'out': { label: '门诊', color: 'blue' },
                        'in': { label: '住院', color: 'green' },
                    }
                    const type = typeMap[value] || { label: value, color: 'default' }
                    return <Tag color={type.color}>{type.label}</Tag>
                },
            },
            {
                title: '患者主索引',
                dataIndex: 'empi',
                key: 'empi',
                width: 150,
                render: (value: string | null) => <Text code>{value?.trim() || '-'}</Text>,
            },
            {
                title: '地址',
                dataIndex: 'address',
                key: 'address',
                width: 200,
                ellipsis: {
                    showTitle: false,
                },
                render: (value: string | null) => (
                    <Tooltip placement='topLeft' title={value}>
                        {value?.trim() || '-'}
                    </Tooltip>
                ),
            },
            {
                title: '科室名称',
                dataIndex: 'deptName',
                key: 'deptName',
                width: 150,
                render: (value: string | null) => <Text>{value?.trim() || '-'}</Text>,
            },
        ]
    }, [])

    return (
        <div>
            {/* 搜索区域 */}
            <Card size='small' style={{ marginBottom: 16 }}>
                <Row gutter={16} align='middle'>
                    <Col flex='auto'>
                        <Space size='middle' wrap>
                            <Input
                                placeholder='患者姓名'
                                allowClear
                                value={searchName}
                                onChange={e => setSearchName(e.target.value)}
                                onPressEnter={handleSearch}
                                style={{ width: 150 }}
                                prefix={<UserOutlined />}
                            />
                            <Select
                                placeholder='性别'
                                style={{ width: 120 }}
                                allowClear
                                value={searchSexCode}
                                onChange={value => setSearchSexCode(value || '')}
                            >
                                <Option value='1'>男</Option>
                                <Option value='0'>女</Option>
                            </Select>
                            <Input
                                placeholder='身份证号'
                                allowClear
                                value={searchIdNumber}
                                onChange={e => setSearchIdNumber(e.target.value)}
                                onPressEnter={handleSearch}
                                style={{ width: 180 }}
                                prefix={<IdcardOutlined />}
                            />
                            <Input
                                placeholder='医院编号'
                                allowClear
                                value={searchHospitalNo}
                                onChange={e => setSearchHospitalNo(e.target.value)}
                                onPressEnter={handleSearch}
                                style={{ width: 150 }}
                            />
                            <Button
                                onClick={handleClearSearch}
                                disabled={!searchName && !searchSexCode && !searchIdNumber && !searchHospitalNo}
                            >
                                清空
                            </Button>
                            <Button
                                type='primary'
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                                loading={loading}
                            >
                                搜索
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchHistoryData}
                                loading={loading}
                            >
                                刷新
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* 表格 */}
            <Table
                columns={columns}
                dataSource={records}
                loading={loading}
                rowKey={(record, index) => `${record.patientName}-${record.idNumber}-${index}`}
                scroll={{ 
                    x: 'max-content',
                    y: 500,
                }}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    onChange: handlePageChange,
                    onShowSizeChange: handlePageChange,
                    locale: {
                        items_per_page: '条/页',
                        jump_to: '跳至',
                        page: '页',
                        prev_page: '上一页',
                        next_page: '下一页',
                        prev_5: '向前 5 页',
                        next_5: '向后 5 页',
                        prev_3: '向前 3 页',
                        next_3: '向后 3 页',
                    },
                }}
            />
        </div>
    )
}

// 合并确认弹窗组件
const MergeConfirmDialog: React.FC<MergeConfirmDialogProps & { onOk?: () => Promise<void> }> = ({ 
    patients, 
    onConfirm,
    onOk,
    basePatientIndexRef
}) => {
    const [basePatientIndex, setBasePatientIndex] = useState<number>(0)
    
    // 初始化 ref
    React.useEffect(() => {
        basePatientIndexRef.current = basePatientIndex
    }, [basePatientIndex, basePatientIndexRef])

    const handleRowClick = (index: number) => {
        setBasePatientIndex(index)
        basePatientIndexRef.current = index
    }

    return (
        <div>
            <Alert
                message='合并操作说明'
                description={`即将合并 ${patients.length} 个患者记录。请点击选择基础患者（合并后将以该患者信息为准），合并后将统一患者主索引。此操作不可撤销，请谨慎操作。`}
                type='warning'
                showIcon
                style={{ marginBottom: 16 }}
            />
            <Table
                dataSource={patients}
                rowKey={(record, index) => `${record.patientName}-${record.idNumber}-${index}`}
                pagination={false}
                size='small'
                onRow={(record, index) => ({
                    onClick: () => handleRowClick(index!),
                    style: {
                        cursor: 'pointer',
                        backgroundColor: index === basePatientIndex ? '#e6f7ff' : 'transparent',
                    },
                })}
                columns={[
                    {
                        title: '基础',
                        key: 'base',
                        width: 80,
                        render: (_, __, index) => {
                            if (index === basePatientIndex) {
                                return <Tag color='green'>基础患者</Tag>
                            }
                            return null
                        },
                    },
                    {
                        title: '序号',
                        key: 'index',
                        width: 60,
                        render: (_, __, index) => index + 1,
                    },
                    {
                        title: '患者姓名',
                        dataIndex: 'patientName',
                        key: 'patientName',
                        width: 120,
                        render: (text: string) => <Text strong>{text?.trim() || '-'}</Text>,
                    },
                    {
                        title: '身份证号',
                        dataIndex: 'idNumber',
                        key: 'idNumber',
                        width: 180,
                        render: (value: string | null) => {
                            if (!value || value.trim() === '') {
                                return <Text type='secondary'>-</Text>
                            }
                            return (
                                <Tooltip title={value}>
                                    <Text code>{maskIdCard(value)}</Text>
                                </Tooltip>
                            )
                        },
                    },
                    {
                        title: '性别',
                        dataIndex: 'sexCode',
                        key: 'sexCode',
                        width: 80,
                        render: (value: string | null) => {
                            if (!value) return <Text type='secondary'>-</Text>
                            const genderMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
                                '1': { icon: <ManOutlined />, color: 'blue', label: '男' },
                                '0': { icon: <WomanOutlined />, color: 'pink', label: '女' },
                            }
                            const gender = genderMap[value] || { icon: null, color: 'default', label: value }
                            return (
                                <Tag icon={gender.icon} color={gender.color}>
                                    {gender.label}
                                </Tag>
                            )
                        },
                    },
                    {
                        title: '医院编号',
                        dataIndex: 'hospitalNo',
                        key: 'hospitalNo',
                        width: 120,
                        render: (value: string | null) => <Text>{value?.trim() || '-'}</Text>,
                    },
                ]}
            />
        </div>
    )
}

// 患者信息接口（保留用于兼容合并功能）
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
    birthDate?: string // 出生日期
    registrationNumber?: string // 登记号
    consulationType?: string // 就诊类型
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
    const [patientRecords, setPatientRecords] = useState<PatientEmpiRecord[]>([])
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    // 四个独立的搜索条件
    const [searchName, setSearchName] = useState('')
    const [searchSexCode, setSearchSexCode] = useState<string>('')
    const [searchIdNumber, setSearchIdNumber] = useState('')
    const [searchHospitalNo, setSearchHospitalNo] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    
    // 合并弹窗相关的 ref（必须在组件顶层定义）
    const basePatientIndexRef = React.useRef(0)
    const onConfirmHandlerRef = React.useRef<((basePatientIndex: number) => Promise<void>) | null>(null)

    // 实际用于搜索的条件（点击搜索按钮时更新）
    const [activeSearchName, setActiveSearchName] = useState('')
    const [activeSearchSexCode, setActiveSearchSexCode] = useState<string>('')
    const [activeSearchIdNumber, setActiveSearchIdNumber] = useState('')
    const [activeSearchHospitalNo, setActiveSearchHospitalNo] = useState('')

    // 获取数据
    const fetchData = async () => {
        setLoading(true)
        try {
            // 构建请求参数
            const params: {
                pageNum: number
                pageSize: number
                condition?: string
                sortField?: string
                sortOrder?: 'asc' | 'desc'
                name?: string
                sexCode?: string
                idNumber?: string
                hospitalNo?: string
            } = {
                pageNum: currentPage,
                pageSize: pageSize,
                sortField: 'create_time',
                sortOrder: 'desc',
            }

            // 添加搜索条件（只传递有值的参数）
            if (activeSearchName.trim()) {
                params.name = activeSearchName.trim()
            }
            if (activeSearchSexCode) {
                params.sexCode = activeSearchSexCode
            }
            if (activeSearchIdNumber.trim()) {
                params.idNumber = activeSearchIdNumber.trim()
            }
            if (activeSearchHospitalNo.trim()) {
                params.hospitalNo = activeSearchHospitalNo.trim()
            }

            const response = await dataManagementService.getPatientEmpiList(params)

            if (response.code === 200) {
                const records = response.data.records || []
                setPatientRecords(records)
                
                // 处理total字段：如果后端返回了total，使用它；否则根据当前页数据估算
                // 注意：如果后端没有返回total，分页可能不准确，建议后端返回total字段
                if (response.data.total !== undefined && response.data.total !== null) {
                    setTotal(response.data.total)
                } else {
                    // 如果当前页数据量等于页大小，可能还有更多数据，设置为当前页数*页大小+1
                    // 否则设置为当前数据量
                    const estimatedTotal = records.length === pageSize 
                        ? currentPage * pageSize + 1 
                        : (currentPage - 1) * pageSize + records.length
                    setTotal(estimatedTotal)
                    logger.warn('后端未返回total字段，使用估算值', { estimatedTotal })
                }
                
                logger.info('成功获取患者索引列表', {
                    recordsCount: records.length,
                    total: response.data.total,
                    currentPage,
                    pageSize,
                })
            } else {
                uiMessage.error(response.msg || '获取患者数据失败')
                logger.error('获取患者索引列表失败', new Error(response.msg || '未知错误'))
            }
        } catch (error) {
            logger.error('获取患者索引列表异常', error as Error)
            uiMessage.error('获取患者数据失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    // 当分页变化时，重新获取数据
    useEffect(() => {
        fetchData()
    }, [currentPage, pageSize, activeSearchName, activeSearchSexCode, activeSearchIdNumber, activeSearchHospitalNo])

    // 处理搜索按钮点击
    const handleSearch = () => {
        // 将当前输入框的值同步到实际搜索条件
        setActiveSearchName(searchName)
        setActiveSearchSexCode(searchSexCode)
        setActiveSearchIdNumber(searchIdNumber)
        setActiveSearchHospitalNo(searchHospitalNo)
        setCurrentPage(1) // 重置到第一页
    }

    // 清空所有搜索条件
    const handleClearSearch = () => {
        setSearchName('')
        setSearchSexCode('')
        setSearchIdNumber('')
        setSearchHospitalNo('')
        // 同时清空实际搜索条件并触发搜索
        setActiveSearchName('')
        setActiveSearchSexCode('')
        setActiveSearchIdNumber('')
        setActiveSearchHospitalNo('')
        setCurrentPage(1)
    }

    // 处理选择（添加校验：只能选择相同姓名和相同身份证号的患者）
    const handleSelectChange = (selectedKeys: React.Key[]) => {
        // 如果当前没有选中任何项，直接设置
        if (selectedKeys.length === 0) {
            setSelectedRowKeys([])
            return
        }

        // 获取当前选中的患者记录
        const selectedRecords: PatientEmpiRecord[] = []
        patientRecords.forEach((record, index) => {
            const rowKey = `${record.patientName}-${record.idNumber}-${index}`
            if (selectedKeys.includes(rowKey)) {
                selectedRecords.push(record)
            }
        })

        // 如果只有一个选中项，直接允许
        if (selectedRecords.length <= 1) {
            setSelectedRowKeys(selectedKeys)
            return
        }

        // 校验：所有选中的患者必须具有相同的姓名（不再要求身份证号相同）
        const firstRecord = selectedRecords[0]
        if (!firstRecord) {
            setSelectedRowKeys([])
            return
        }
        const firstName = (firstRecord.patientName?.trim() || '').toLowerCase()

        // 检查所有记录是否具有相同的姓名
        const isValid = selectedRecords.every(record => {
            const name = (record.patientName?.trim() || '').toLowerCase()
            // 只校验姓名相同
            return name === firstName
        })

        if (!isValid) {
            message.warning('只能选择相同姓名的患者进行合并')
            // 保持之前的选择状态，不更新
            return
        }

        // 校验通过，更新选择
        setSelectedRowKeys(selectedKeys)
    }

    // 处理合并
    const handleMerge = async () => {
        if (selectedRowKeys.length < 2) {
            message.warning('请至少选择2个患者进行合并')
            return
        }
        
        // 根据选中的rowKey获取对应的患者记录
        const selectedPatients: PatientEmpiRecord[] = []
        patientRecords.forEach((record, index) => {
            const rowKey = `${record.patientName}-${record.idNumber}-${index}`
            if (selectedRowKeys.includes(rowKey)) {
                selectedPatients.push(record)
            }
        })
        
        if (selectedPatients.length < 2) {
            message.warning('请至少选择2个患者进行合并')
            return
        }

        // 再次校验：确保所有选中的患者具有相同的姓名
        const firstRecord = selectedPatients[0]
        if (!firstRecord) {
            message.warning('未找到有效的患者记录')
            return
        }
        const firstName = (firstRecord.patientName?.trim() || '').toLowerCase()

        const isValid = selectedPatients.every(record => {
            const name = (record.patientName?.trim() || '').toLowerCase()
            // 只校验姓名相同
            return name === firstName
        })

        if (!isValid) {
            message.warning('只能选择相同姓名的患者进行合并')
            return
        }
        
        // 使用 showDialog 显示合并确认弹窗
        // 重置 ref
        basePatientIndexRef.current = 0
        
        // 定义合并处理函数
        const handleConfirmMerge = async (basePatientIndex: number) => {
            try {
                setLoading(true)
                
                // 将基础患者放在第一位，其他患者按原顺序排列
                const basePatient = selectedPatients[basePatientIndex]
                if (!basePatient) {
                    throw new Error('未找到基础患者')
                }
                const otherPatients = selectedPatients.filter((_, index) => index !== basePatientIndex)
                const orderedPatients = [basePatient, ...otherPatients]
                
                // 构建接口需要的患者信息数组
                const mergeData = orderedPatients.map((record, index) => {
                    if (!record) {
                        throw new Error('患者记录为空')
                    }
                    return {
                        patientName: record.patientName?.trim() || '',
                        sexCode: record.sexCode?.trim() || '',
                        birthDate: record.birthDate?.trim() || '',
                        idNumber: record.idNumber?.trim() || '',
                        phone: record.phone?.trim() || '',
                        hospitalNo: record.hospitalNo?.trim() || '',
                        registrationNumber: record.registrationNumber?.trim() || '',
                        consulationType: record.consulationType?.trim() || '',
                        address: record.address?.trim() || '',
                        deptName: record.deptName?.trim() || '',
                        selected: index === 0, // 第一个患者（基础患者）标记为选中
                    }
                })

                // 调用后端合并接口
                const response = await dataManagementService.mergePatientEmpi(mergeData)

                // 接口返回格式：{ code: 200, msg: "操作成功" } 或 { code: 0, msg: "", data: null }
                if (response.code === 0 || response.code === 200) {
                    const successMsg = (response as any).msg || `成功合并 ${selectedPatients.length} 个患者记录`
                    message.success(successMsg)
                    
                    // 清空选择
                    setSelectedRowKeys([])
                    
                    // 刷新数据以获取最新状态
                    await fetchData()
                } else {
                    // 兼容 msg 和 message 字段
                    const errorMsg = (response as any).msg || (response as any).message || '合并失败，请稍后重试'
                    message.error(errorMsg)
                    logger.error('合并患者失败', new Error(errorMsg))
                    throw new Error(errorMsg)
                }
            } catch (error) {
                logger.error('合并患者失败', error as Error)
                const errorMessage = error instanceof Error ? error.message : '合并失败，请稍后重试'
                message.error(errorMessage)
                throw error
            } finally {
                setLoading(false)
            }
        }
        
        const confirmed = await showDialog({
            title: '确认合并患者',
            width: 800,
            okText: '确认合并',
            cancelText: '取消',
            children: (
                <MergeConfirmDialog
                    patients={selectedPatients}
                    onConfirm={handleConfirmMerge}
                    basePatientIndexRef={basePatientIndexRef}
                />
            ),
            onOk: async () => {
                // 在 onOk 中调用 onConfirm，传入当前的 basePatientIndex
                await handleConfirmMerge(basePatientIndexRef.current)
            },
        })
    }


    // 根据接口返回的数据结构定义固定的表格列
    // 表头是固定的，即使没有数据也显示完整的列
    const columns: ColumnsType<PatientEmpiRecord> = useMemo(() => {
        // 定义所有可能的字段及其配置
        const fieldMap: Record<string, { 
            title: string
            width?: number
            render?: (value: any, record: PatientEmpiRecord) => React.ReactNode
            ellipsis?: { showTitle: boolean }
        }> = {
            patientName: {
                title: '患者姓名',
                width: 120,
                render: (text: string) => (
                    <Text strong>{text?.trim() || '-'}</Text>
                ),
            },
            sexCode: {
                title: '性别',
                width: 80,
                render: (value: string | null) => {
                    if (!value) return <Text type='secondary'>-</Text>
                    // 性别映射：1=男，0=女
                    const genderMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
                        '1': { icon: <ManOutlined />, color: 'blue', label: '男' },
                        '0': { icon: <WomanOutlined />, color: 'pink', label: '女' },
                    }
                    const gender = genderMap[value] || { icon: null, color: 'default', label: value }
                    return (
                        <Tag icon={gender.icon} color={gender.color}>
                            {gender.label}
                        </Tag>
                    )
                },
            },
            birthDate: {
                title: '出生日期',
                width: 120,
                render: (value: string | null) => (
                    <Text>{value?.trim() || '-'}</Text>
                ),
            },
            idNumber: {
                title: '身份证号',
                width: 180,
                render: (value: string | null) => {
                    if (!value || value.trim() === '') {
                        return (
                            <Space>
                                <IdcardOutlined />
                                <Text type='secondary'>-</Text>
                            </Space>
                        )
                    }
                    return (
                        <Tooltip title={value}>
                            <Space>
                                <IdcardOutlined />
                                <Text code>{maskIdCard(value)}</Text>
                            </Space>
                        </Tooltip>
                    )
                },
            },
            phone: {
                title: '手机号',
                width: 140,
                render: (value: string | null) => {
                    if (!value) return <Text type='secondary'>-</Text>
                    return (
                        <Tooltip title={value}>
                            <Text>{maskPhone(value)}</Text>
                        </Tooltip>
                    )
                },
            },
            hospitalNo: {
                title: '医院编号',
                width: 120,
                render: (value: string | null) => (
                    <Text>{value?.trim() || '-'}</Text>
                ),
            },
            registrationNumber: {
                title: '登记号',
                width: 120,
                render: (value: string | null) => (
                    <Text code>{value?.trim() || '-'}</Text>
                ),
            },
            consulationType: {
                title: '就诊类型',
                width: 100,
                render: (value: string | null) => {
                    if (!value) return <Text type='secondary'>-</Text>
                    const typeMap: Record<string, { label: string; color: string }> = {
                        'out': { label: '门诊', color: 'blue' },
                        'in': { label: '住院', color: 'green' },
                    }
                    const type = typeMap[value] || { label: value, color: 'default' }
                    return <Tag color={type.color}>{type.label}</Tag>
                },
            },
            address: {
                title: '地址',
                width: 200,
                ellipsis: {
                    showTitle: false,
                },
                render: (value: string | null) => (
                    <Tooltip placement='topLeft' title={value}>
                        {value?.trim() || '-'}
                    </Tooltip>
                ),
            },
            deptName: {
                title: '科室名称',
                width: 150,
                render: (value: string | null) => (
                    <Text>{value?.trim() || '-'}</Text>
                ),
            },
        }

        // 定义固定的列顺序（基于接口返回的数据结构）
        // 即使没有数据，也显示完整的表头
        const fixedColumnOrder: (keyof PatientEmpiRecord)[] = [
            'patientName',
            'sexCode',
            'birthDate',
            'idNumber',
            'phone',
            'hospitalNo',
            'registrationNumber',
            'consulationType',
            'address',
            'deptName',
        ]

        // 如果有数据，检查是否有额外的字段
        const allFields = new Set<keyof PatientEmpiRecord>(fixedColumnOrder)
        if (patientRecords.length > 0) {
            patientRecords.forEach(record => {
                Object.keys(record).forEach(key => {
                    allFields.add(key as keyof PatientEmpiRecord)
                })
            })
        }

        // 生成列：先按固定顺序，然后添加其他字段
        const cols: ColumnsType<PatientEmpiRecord> = []
        
        // 添加固定顺序的列
        fixedColumnOrder.forEach(key => {
            const field = fieldMap[key]
            if (field) {
                cols.push({
                    title: field.title,
                    dataIndex: key,
                    key: key,
                    width: field.width,
                    render: field.render,
                    ellipsis: field.ellipsis,
                    // 患者姓名列固定在左侧
                    ...(key === 'patientName' ? { fixed: 'left' as const } : {}),
                })
            }
        })

        return cols
    }, [patientRecords])

    // 处理分页变化
    const handlePageChange = (page: number, size?: number) => {
        setCurrentPage(page)
        if (size && size !== pageSize) {
            setPageSize(size)
            setCurrentPage(1) // 改变页大小时重置到第一页
        }
    }

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
                            <Space size='middle' wrap>
                                <Input
                                    placeholder='患者姓名'
                                    allowClear
                                    value={searchName}
                                    onChange={e => setSearchName(e.target.value)}
                                    onPressEnter={handleSearch}
                                    style={{ width: 150 }}
                                    prefix={<UserOutlined />}
                                />
                                <Select
                                    placeholder='性别'
                                    style={{ width: 120 }}
                                    allowClear
                                    value={searchSexCode}
                                    onChange={value => setSearchSexCode(value || '')}
                                >
                                    <Option value='1'>男</Option>
                                    <Option value='0'>女</Option>
                                </Select>
                                <Input
                                    placeholder='身份证号'
                                    allowClear
                                    value={searchIdNumber}
                                    onChange={e => setSearchIdNumber(e.target.value)}
                                    onPressEnter={handleSearch}
                                    style={{ width: 180 }}
                                    prefix={<IdcardOutlined />}
                                />
                                <Input
                                    placeholder='医院编号'
                                    allowClear
                                    value={searchHospitalNo}
                                    onChange={e => setSearchHospitalNo(e.target.value)}
                                    onPressEnter={handleSearch}
                                    style={{ width: 150 }}
                                />
                                <Button
                                    onClick={handleClearSearch}
                                    disabled={!searchName && !searchSexCode && !searchIdNumber && !searchHospitalNo}
                                >
                                    清空
                                </Button>
                                <Button
                                    type='primary'
                                    icon={<SearchOutlined />}
                                    onClick={handleSearch}
                                    loading={loading}
                                >
                                    搜索
                                </Button>
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
                                {selectedRowKeys.length > 0 && (
                                    <Text type='secondary'>
                                        已选择 {selectedRowKeys.length} 个患者
                                    </Text>
                                )}
                                <Button
                                    icon={<HistoryOutlined />}
                                    onClick={() => {
                                        showDialog({
                                            title: '合并历史',
                                            width: 1200,
                                            okText: '关闭',
                                            footer: null,
                                            children: <MergeHistoryDialog />,
                                        })
                                    }}
                                >
                                    合并历史
                                </Button>
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
                    dataSource={patientRecords}
                    loading={loading}
                    rowKey={(record, index) => `${record.patientName}-${record.idNumber}-${index}`}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: handleSelectChange,
                        preserveSelectedRowKeys: false, // 切换页面时清除选择
                    }}
                    scroll={{ x: 1400 }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: handlePageChange,
                        onShowSizeChange: handlePageChange,
                    }}
                />
            </Card>
        </div>
    )
}

export default IndexProcessingManagement
