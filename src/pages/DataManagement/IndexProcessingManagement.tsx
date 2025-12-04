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
import type { ColumnsType } from 'antd/es/table'
import { dataGovernanceService } from '../../services/dataGovernanceService'
import type { PatientEmpiRecord } from '../../types'
import { uiMessage } from '../../utils/uiMessage'
import { logger } from '../../utils/logger'

const { Title, Text } = Typography
const { Option } = Select

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
    const [patientRecords, setPatientRecords] = useState<PatientEmpiRecord[]>([])
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    // 四个独立的搜索条件
    const [searchName, setSearchName] = useState('')
    const [searchSexCode, setSearchSexCode] = useState<string>('')
    const [searchIdNumber, setSearchIdNumber] = useState('')
    const [searchHospitalNo, setSearchHospitalNo] = useState('')
    const [mergeModalVisible, setMergeModalVisible] = useState(false)
    const [mergePatients, setMergePatients] = useState<PatientInfo[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)

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

            const response = await dataGovernanceService.getPatientEmpiList(params)

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
        
        // 将PatientEmpiRecord转换为PatientInfo格式用于合并弹窗显示
        const patientsToMerge: PatientInfo[] = selectedPatients.map((record, idx) => {
            // 计算年龄
            let age = 0
            if (record.birthDate) {
                const birthYear = parseInt(record.birthDate.trim().substring(0, 4))
                if (!isNaN(birthYear)) {
                    age = new Date().getFullYear() - birthYear
                }
            }
            
            return {
                id: `${record.patientName}-${record.idNumber}-${idx}`,
                name: record.patientName?.trim() || '',
                idCard: record.idNumber || '',
                // 性别映射：1=男，0=女
                gender: record.sexCode === '1' ? 'male' : record.sexCode === '0' ? 'female' : 'unknown',
                age,
                phone: record.phone || undefined,
                address: record.address || undefined,
                empi: record.empi || undefined,
                hospitalId: record.hospitalNo || undefined,
                department: record.deptName || undefined,
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString(),
            }
        })
        
        setMergePatients(patientsToMerge)
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
            
            // TODO: 调用后端合并接口
            // 目前先模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // 合并逻辑：保留第一个，删除其他的
            const targetPatient = mergePatients[0]
            if (!targetPatient) {
                message.error('合并失败：未找到目标患者')
                return
            }

            const mergedEmpi = targetPatient.empi || `EMPI${Date.now()}`
            
            // 找到目标记录在patientRecords中的索引
            const targetRecordIndex = patientRecords.findIndex((record, index) => {
                const rowKey = `${record.patientName}-${record.idNumber}-${index}`
                return selectedRowKeys.includes(rowKey) && index === 0 || 
                       (record.patientName === targetPatient.name && record.idNumber === targetPatient.idCard)
            })
            
            // 从patientRecords中移除被合并的记录（保留第一个选中的）
            const remainingRecords = patientRecords.filter((record, index) => {
                const rowKey = `${record.patientName}-${record.idNumber}-${index}`
                // 保留第一个选中的记录，移除其他选中的记录
                if (selectedRowKeys.includes(rowKey)) {
                    return index === targetRecordIndex || targetRecordIndex === -1
                }
                return true
            })
            
            // 更新目标记录的empi（如果存在）
            const updatedRecords = remainingRecords.map((record, index) => {
                const rowKey = `${record.patientName}-${record.idNumber}-${index}`
                // 如果是目标记录，更新empi
                if (targetRecordIndex >= 0 && index === targetRecordIndex) {
                    return { ...record, empi: mergedEmpi }
                }
                // 如果找不到目标记录索引，但匹配目标患者信息，更新empi
                if (targetRecordIndex === -1 && 
                    record.patientName === targetPatient.name && 
                    record.idNumber === targetPatient.idCard) {
                    return { ...record, empi: mergedEmpi }
                }
                return record
            })

            setPatientRecords(updatedRecords)
            setSelectedRowKeys([])
            setMergeModalVisible(false)
            message.success(`成功合并 ${mergePatients.length} 个患者记录`)
            
            // 刷新数据以获取最新状态
            await fetchData()
        } catch (error) {
            logger.error('合并患者失败', error as Error)
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
                })
            }
        })

        // 如果有数据，添加其他未定义的字段
        if (patientRecords.length > 0) {
            const additionalFields = Array.from(allFields).filter(
                key => !fixedColumnOrder.includes(key)
            )
            
            additionalFields.forEach(key => {
                const field = fieldMap[key]
                if (field) {
                    cols.push({
                        title: field.title,
                        dataIndex: key,
                        key: key,
                        width: field.width,
                        render: field.render,
                    })
                } else {
                    // 如果没有预定义的字段，使用默认渲染
                    const title = String(key)
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())
                        .trim()
                    cols.push({
                        title: title || String(key),
                        dataIndex: key,
                        key: key,
                        width: 150,
                        render: (value: any) => {
                            if (value === null || value === undefined) {
                                return <Text type='secondary'>-</Text>
                            }
                            const strValue = String(value).trim()
                            return <Text>{strValue || '-'}</Text>
                        },
                    })
                }
            })
        }

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
