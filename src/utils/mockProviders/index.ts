/**
 * 模拟数据提供者统一入口
 * 各模块的模拟数据提供者在这里注册
 */

import { registerMockData, createMockResponse } from '../mockAdapter'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * 仪表盘模块模拟数据
 */
const dashboardMockProvider = {
    getMockData: async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
        const url = config.url || ''
        
        // 仪表盘统计数据
        if (url.includes('/dashboard/statistics')) {
            return createMockResponse({
                totalWorkflows: 12,
                runningWorkflows: 3,
                completedWorkflows: 8,
                failedWorkflows: 1,
                successRate: 92.5,
                totalSteps: 10,
                enabledSteps: 8,
            })
        }
        
        // 执行历史日志
        if (url.includes('/task/log/page')) {
            const params = config.params || {}
            const pageNo = params.pageNo || 1
            const pageSize = params.pageSize || 10
            
            return createMockResponse({
                records: Array.from({ length: pageSize }, (_, i) => ({
                    id: `log_${(pageNo - 1) * pageSize + i + 1}`,
                    batchId: `batch_${(pageNo - 1) * pageSize + i + 1}`,
                    status: ['running', 'completed', 'failed'][i % 3],
                    startTime: new Date(Date.now() - i * 3600000).toISOString(),
                    endTime: i % 3 === 0 ? null : new Date(Date.now() - i * 3600000 + 1800000).toISOString(),
                    duration: i % 3 === 0 ? null : 1800,
                })),
                total: 100,
                size: pageSize,
                current: pageNo,
                pages: Math.ceil(100 / pageSize),
            })
        }
        
        throw new Error(`未实现的模拟数据: ${url}`)
    },
}

/**
 * 数据管理模块模拟数据
 */
const dataManagementMockProvider = {
    getMockData: async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
        const url = config.url || ''
        
        // 患者索引列表
        if (url.includes('/patient/empi/list')) {
            const data = config.data as { pageNum?: number; pageSize?: number } || {}
            const pageNum = data.pageNum || 1
            const pageSize = data.pageSize || 10
            
            return createMockResponse({
                records: Array.from({ length: pageSize }, (_, i) => ({
                    id: `empi_${(pageNum - 1) * pageSize + i + 1}`,
                    patientName: `患者${(pageNum - 1) * pageSize + i + 1}`,
                    sexCode: ['M', 'F'][i % 2],
                    birthDate: '1990-01-01',
                    idNumber: `11010119900101100${i}`,
                    phone: `1380000${String(i).padStart(4, '0')}`,
                    hospitalNo: `H${String((pageNum - 1) * pageSize + i + 1).padStart(6, '0')}`,
                    registrationNumber: `R${String((pageNum - 1) * pageSize + i + 1).padStart(8, '0')}`,
                    consulationType: '门诊',
                    address: '北京市朝阳区',
                    deptName: '内科',
                })),
                total: 100,
                size: pageSize,
                current: pageNum,
                pages: Math.ceil(100 / pageSize),
            })
        }
        
        // 合并患者索引
        if (url.includes('/patient/empi/merge')) {
            return createMockResponse(null)
        }
        
        // 合并历史记录
        if (url.includes('/patient/empi/distribution/record/list')) {
            const data = config.data as { pageNum?: number; pageSize?: number } || {}
            const pageNum = data.pageNum || 1
            const pageSize = data.pageSize || 10
            
            return createMockResponse({
                records: Array.from({ length: pageSize }, (_, i) => ({
                    id: `record_${(pageNum - 1) * pageSize + i + 1}`,
                    patientName: `患者${(pageNum - 1) * pageSize + i + 1}`,
                    sexCode: ['M', 'F'][i % 2],
                    idNumber: `11010119900101100${i}`,
                    hospitalNo: `H${String((pageNum - 1) * pageSize + i + 1).padStart(6, '0')}`,
                    mergeTime: new Date(Date.now() - i * 86400000).toISOString(),
                })),
                total: 50,
                size: pageSize,
                current: pageNum,
                pages: Math.ceil(50 / pageSize),
            })
        }
        
        throw new Error(`未实现的模拟数据: ${url}`)
    },
}

/**
 * 类别标准管理模块模拟数据
 * 对应接口：/data/standard/category/page, /data/standard/category/add, /data/standard/category/update
 */

// 内存存储模拟数据（用于支持新增和修改操作）
let mockCategoryStandardRecords: Array<{
    id: string
    categoryName: string
    categoryCode: string
    categoryStatus: number
    createBy: string
    createTime: string
    updateBy: string | null
    updateTime: string | null
    remark: string | null
    delFlag: number
}> = [
    {
        id: '1',
        categoryName: '科室分类',
        categoryCode: 'CAT_DEPT_001',
        categoryStatus: 1,
        createBy: 'admin',
        createTime: '2025-12-08T10:00:00',
        updateBy: null,
        updateTime: null,
        remark: '医院科室分类体系',
        delFlag: 0,
    },
    {
        id: '2',
        categoryName: '就诊类别',
        categoryCode: 'CAT_VISIT_002',
        categoryStatus: 1,
        createBy: 'admin',
        createTime: '2025-12-09T08:31:59',
        updateBy: null,
        updateTime: null,
        remark: '就诊相关数据类别',
        delFlag: 0,
    },
    {
        id: '3',
        categoryName: '性别',
        categoryCode: 'CAT_GENDER_003',
        categoryStatus: 1,
        createBy: 'admin',
        createTime: '2025-12-09T09:00:00',
        updateBy: null,
        updateTime: null,
        remark: '性别标准类别',
        delFlag: 0,
    },
    {
        id: '4',
        categoryName: '年龄',
        categoryCode: 'CAT_AGE_004',
        categoryStatus: 1,
        createBy: 'admin',
        createTime: '2025-12-09T09:30:00',
        updateBy: null,
        updateTime: null,
        remark: '年龄分组类别',
        delFlag: 0,
    },
    {
        id: '5',
        categoryName: '民族',
        categoryCode: 'CAT_ETHNICITY_005',
        categoryStatus: 0,
        createBy: 'admin',
        createTime: '2025-12-09T10:00:00',
        updateBy: null,
        updateTime: null,
        remark: '民族信息类别',
        delFlag: 0,
    },
    {
        id: '6',
        categoryName: '婚姻状况',
        categoryCode: 'CAT_MARITAL_006',
        categoryStatus: 1,
        createBy: 'admin',
        createTime: '2025-12-09T10:30:00',
        updateBy: null,
        updateTime: null,
        remark: '婚姻状况类别',
        delFlag: 0,
    },
]

const categoryStandardMockProvider = {
    getMockData: async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
        const url = config.url || ''

        // 分页查询接口
        if (url.includes('/data/standard/category/page')) {
            const data =
                (config.data as {
                    pageNum?: number
                    pageSize?: number
                    condition?: string
                    categoryName?: string
                    categoryCode?: string
                    categoryStatus?: number
                }) || {}
            const pageNum = data.pageNum || 1
            const pageSize = data.pageSize || 10
            const condition = (data.condition || '').toString().trim().toLowerCase()
            const categoryName = (data.categoryName || '').toString().trim().toLowerCase()
            const categoryCode = (data.categoryCode || '').toString().trim().toLowerCase()
            const status = data.categoryStatus

            // 按多个条件筛选
            const filtered = mockCategoryStandardRecords.filter(item => {
                // 关键字段模糊查询（condition）
                const matchCondition =
                    !condition ||
                    item.categoryName.toLowerCase().includes(condition) ||
                    item.categoryCode.toLowerCase().includes(condition) ||
                    (item.remark || '').toLowerCase().includes(condition)

                // 类别名称筛选
                const matchCategoryName =
                    !categoryName || item.categoryName.toLowerCase().includes(categoryName)

                // 类别编码筛选
                const matchCategoryCode =
                    !categoryCode || item.categoryCode.toLowerCase().includes(categoryCode)

                // 状态筛选
                const matchStatus =
                    typeof status !== 'number' ? true : item.categoryStatus === status

                return (
                    matchCondition &&
                    matchCategoryName &&
                    matchCategoryCode &&
                    matchStatus
                )
            })

            const start = (pageNum - 1) * pageSize
            const paged = filtered.slice(start, start + pageSize)

            return createMockResponse({
                code: 200,
                msg: '操作成功',
                data: {
                    records: paged,
                    total: String(filtered.length),
                    size: String(pageSize),
                    current: String(pageNum),
                    pages: String(Math.max(1, Math.ceil(filtered.length / pageSize))),
                },
            })
        }

        // 新增接口
        if (url.includes('/data/standard/category/add')) {
            const data = config.data as {
                categoryName?: string
                categoryCode?: string
                categoryStatus?: number
                remark?: string
            } || {}

            // 生成新ID（取当前最大ID + 1）
            const maxId = Math.max(
                ...mockCategoryStandardRecords.map(r => Number(r.id)),
                0
            )
            const newId = String(maxId + 1)

            const newRecord = {
                id: newId,
                categoryName: data.categoryName || '',
                categoryCode: data.categoryCode || '',
                categoryStatus: data.categoryStatus ?? 1,
                createBy: 'admin',
                createTime: new Date().toISOString(),
                updateBy: null,
                updateTime: null,
                remark: data.remark || null,
                delFlag: 0,
            }

            mockCategoryStandardRecords.push(newRecord)

            return createMockResponse({
                code: 200,
                msg: '操作成功',
                data: null,
            })
        }

        // 修改接口
        if (url.includes('/data/standard/category/update')) {
            const data = config.data as {
                id?: string
                categoryName?: string
                categoryCode?: string
                categoryStatus?: number
                remark?: string
            } || {}

            const id = data.id || ''
            const index = mockCategoryStandardRecords.findIndex(r => r.id === id)

            if (index === -1) {
                return createMockResponse({
                    code: 400,
                    msg: '未找到要修改的记录',
                    data: null,
                })
            }

            // 更新记录
            const existingRecord = mockCategoryStandardRecords[index]!
            mockCategoryStandardRecords[index] = {
                ...existingRecord,
                categoryName: data.categoryName ?? existingRecord.categoryName,
                categoryCode: data.categoryCode ?? existingRecord.categoryCode,
                categoryStatus: data.categoryStatus ?? existingRecord.categoryStatus,
                remark: data.remark !== undefined ? data.remark : existingRecord.remark,
                updateBy: 'admin',
                updateTime: new Date().toISOString(),
            }

            return createMockResponse({
                code: 200,
                msg: '操作成功',
                data: null,
            })
        }

        // 删除接口 DELETE /data/standard/category/{id}
        if (
            url.includes('/data/standard/category/') &&
            config.method?.toUpperCase() === 'DELETE'
        ) {
            // 从 URL 中提取 id（格式：/data/standard/category/{id}）
            const urlParts = url.split('/')
            const id = urlParts[urlParts.length - 1]

            if (!id) {
                return createMockResponse({
                    code: 400,
                    msg: 'ID参数不能为空',
                    data: null,
                })
            }

            const index = mockCategoryStandardRecords.findIndex(r => r.id === id)

            if (index === -1) {
                return createMockResponse({
                    code: 404,
                    msg: '未找到要删除的记录',
                    data: null,
                })
            }

            // 从数组中删除记录
            mockCategoryStandardRecords.splice(index, 1)

            return createMockResponse({
                code: 200,
                msg: '操作成功',
                data: null,
            })
        }

        throw new Error(`未实现的模拟数据: ${url}`)
    },
}

/**
 * 数据库连接模块模拟数据
 */
const databaseConnectionMockProvider = {
    getMockData: async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
        const url = config.url || ''
        
        // 数据库连接列表
        if (url.includes('/database/connection') && config.method?.toUpperCase() === 'GET') {
            return createMockResponse({
                records: [
                    {
                        id: 'db1',
                        name: 'HIS核心数据库',
                        type: 'mysql',
                        host: '192.168.1.100',
                        port: 3306,
                        database: 'hospital_his',
                        status: 'connected',
                        description: '医院信息系统的核心业务数据库',
                    },
                    {
                        id: 'db2',
                        name: '科研数据仓库',
                        type: 'postgresql',
                        host: '192.168.1.101',
                        port: 5432,
                        database: 'research_warehouse',
                        status: 'connected',
                        description: '用于存储和管理科研项目相关的数据',
                    },
                ],
                total: 2,
            })
        }
        
        throw new Error(`未实现的模拟数据: ${url}`)
    },
}

/**
 * 主索引配置模块模拟数据
 * 对应接口：/index/master-index-config/page, /index/master-index-config/add, /index/master-index-config/update, /index/master-index-config/{id}
 */
let mockMasterIndexConfigRecords: Array<{
    id: string
    configName: string
    ruleCode: string
    generateType: number
    generateTypeName: string
    prefix: string | null
    length: number
    configInfo: string
    description: string
    status: number
    statusName: string
    createBy: string
    createTime: string
    updateBy: string | null
    updateTime: string
    remark: string | null
    delFlag: number
}> = [
    {
        id: '2000452432818536449',
        configName: '患者主索引随机生成配置',
        ruleCode: 'PATIENT_EMPI_RANDOM',
        generateType: 2,
        generateTypeName: '随机生成',
        prefix: null,
        length: 15,
        configInfo: '随机生成15位主索引',
        description: '随机生成15位主索引（范围10-18位）',
        status: 1,
        statusName: '启用',
        createBy: 'system',
        createTime: '2025-12-15T14:26:41',
        updateBy: 'system',
        updateTime: '2025-12-15T14:26:41',
        remark: null,
        delFlag: 0,
    },
    {
        id: '2000452382344282113',
        configName: '患者主索引固定生成配置1',
        ruleCode: 'PATIENT_EMPI_FIXED_1',
        generateType: 1,
        generateTypeName: '固定生成',
        prefix: 'EMPI',
        length: 18,
        configInfo: '以EMPI为起始，长度为18位',
        description: '以EMPI为起始，长度为18位的主索引生成规则',
        status: 1,
        statusName: '启用',
        createBy: 'system',
        createTime: '2025-12-15T14:26:29',
        updateBy: 'system',
        updateTime: '2025-12-15T14:26:29',
        remark: null,
        delFlag: 0,
    },
    {
        id: '1',
        configName: '患者主索引固定生成配置',
        ruleCode: 'PATIENT_EMPI_FIXED',
        generateType: 1,
        generateTypeName: '固定生成',
        prefix: 'EMPI',
        length: 18,
        configInfo: '以EMPI为起始，长度为18位',
        description: '以EMPI为起始，长度为18位的主索引生成规则',
        status: 1,
        statusName: '启用',
        createBy: '数据管理员',
        createTime: '2024-01-10T09:00:00',
        updateBy: null,
        updateTime: '2025-12-15T06:22:27',
        remark: null,
        delFlag: 0,
    },
]

const masterIndexConfigMockProvider = {
    getMockData: async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
        const url = config.url || ''

        // 分页查询接口
        if (url.includes('/index/master-index-config/page')) {
            const data =
                (config.data as {
                    pageNum?: number
                    pageSize?: number
                    condition?: string
                    configName?: string
                    ruleCode?: string
                    generateType?: number
                    status?: number
                }) || {}
            const pageNum = data.pageNum || 1
            const pageSize = data.pageSize || 10
            const condition = (data.condition || '').toString().trim().toLowerCase()
            const configName = (data.configName || '').toString().trim().toLowerCase()
            const ruleCode = (data.ruleCode || '').toString().trim().toLowerCase()
            const generateType = data.generateType
            const status = data.status

            // 按多个条件筛选
            const filtered = mockMasterIndexConfigRecords.filter(item => {
                // 关键字段模糊查询（condition）
                const matchCondition =
                    !condition ||
                    item.configName.toLowerCase().includes(condition) ||
                    item.ruleCode.toLowerCase().includes(condition) ||
                    (item.description || '').toLowerCase().includes(condition)

                // 配置名称筛选
                const matchConfigName =
                    !configName || item.configName.toLowerCase().includes(configName)

                // 规则编码筛选
                const matchRuleCode =
                    !ruleCode || item.ruleCode.toLowerCase().includes(ruleCode)

                // 生成方式筛选
                const matchGenerateType =
                    typeof generateType !== 'number' ? true : item.generateType === generateType

                // 状态筛选
                const matchStatus =
                    typeof status !== 'number' ? true : item.status === status

                return (
                    matchCondition &&
                    matchConfigName &&
                    matchRuleCode &&
                    matchGenerateType &&
                    matchStatus
                )
            })

            const start = (pageNum - 1) * pageSize
            const paged = filtered.slice(start, start + pageSize)

            return createMockResponse({
                code: 200,
                msg: '操作成功',
                data: {
                    records: paged,
                    total: String(filtered.length),
                    size: String(pageSize),
                    current: String(pageNum),
                    pages: String(Math.max(1, Math.ceil(filtered.length / pageSize))),
                },
            })
        }

        // 新增接口
        if (url.includes('/index/master-index-config/add')) {
            const data = config.data as {
                configName?: string
                ruleCode?: string
                generateType?: number
                prefix?: string
                length?: number
                configInfo?: string
                description?: string
                status?: number
                remark?: string
            } || {}

            // 生成新ID
            const newId = String(Date.now())

            const generateTypeName = data.generateType === 1 ? '固定生成' : '随机生成'
            const statusName = data.status === 1 ? '启用' : '禁用'
            
            // 使用传入的configInfo，如果没有则自动生成
            let configInfo = data.configInfo || ''
            if (!configInfo) {
                if (data.generateType === 1 && data.prefix) {
                    configInfo = `以${data.prefix}为起始，长度为${data.length}位`
                } else if (data.generateType === 2) {
                    configInfo = `随机生成${data.length}位主索引`
                } else {
                    configInfo = `长度为${data.length}位`
                }
            }

            const newRecord = {
                id: newId,
                configName: data.configName || '',
                ruleCode: data.ruleCode || '',
                generateType: data.generateType || 1,
                generateTypeName,
                prefix: data.prefix || null,
                length: data.length || 0,
                configInfo,
                description: data.description || '',
                status: data.status ?? 1,
                statusName,
                createBy: 'admin',
                createTime: new Date().toISOString(),
                updateBy: null,
                updateTime: new Date().toISOString(),
                remark: data.remark || null,
                delFlag: 0,
            }

            mockMasterIndexConfigRecords.unshift(newRecord)

            return createMockResponse({
                code: 200,
                msg: '操作成功',
                data: null,
            })
        }

        // 修改接口
        if (url.includes('/index/master-index-config/update')) {
            const data = config.data as {
                id?: string
                configName?: string
                ruleCode?: string
                generateType?: number
                prefix?: string
                length?: number
                configInfo?: string
                description?: string
                status?: number
                remark?: string
            } || {}

            const id = data.id || ''
            const index = mockMasterIndexConfigRecords.findIndex(r => r.id === id)

            if (index === -1) {
                return createMockResponse({
                    code: 400,
                    msg: '未找到要修改的记录',
                    data: null,
                })
            }

            const existingRecord = mockMasterIndexConfigRecords[index]!
            const generateType = data.generateType ?? existingRecord.generateType
            const generateTypeName = generateType === 1 ? '固定生成' : '随机生成'
            const status = data.status ?? existingRecord.status
            const statusName = status === 1 ? '启用' : '禁用'
            const prefix = data.prefix !== undefined ? data.prefix : existingRecord.prefix
            const length = data.length ?? existingRecord.length
            
            // 使用传入的configInfo，如果没有则自动生成
            let configInfo = data.configInfo || ''
            if (!configInfo) {
                if (generateType === 1 && prefix) {
                    configInfo = `以${prefix}为起始，长度为${length}位`
                } else if (generateType === 2) {
                    configInfo = `随机生成${length}位主索引`
                } else {
                    configInfo = `长度为${length}位`
                }
            }

            // 更新记录
            mockMasterIndexConfigRecords[index] = {
                ...existingRecord,
                configName: data.configName ?? existingRecord.configName,
                ruleCode: data.ruleCode ?? existingRecord.ruleCode,
                generateType,
                generateTypeName,
                prefix,
                length,
                configInfo,
                description: data.description !== undefined ? data.description : existingRecord.description,
                status,
                statusName,
                remark: data.remark !== undefined ? data.remark : existingRecord.remark,
                updateBy: 'admin',
                updateTime: new Date().toISOString(),
            }

            return createMockResponse({
                code: 200,
                msg: '操作成功',
                data: null,
            })
        }

        // 删除接口 DELETE /index/master-index-config/{id}
        if (
            url.includes('/index/master-index-config/') &&
            config.method?.toUpperCase() === 'DELETE'
        ) {
            const urlParts = url.split('/')
            const id = urlParts[urlParts.length - 1]

            if (!id) {
                return createMockResponse({
                    code: 400,
                    msg: 'ID参数不能为空',
                    data: null,
                })
            }

            const index = mockMasterIndexConfigRecords.findIndex(r => r.id === id)

            if (index === -1) {
                return createMockResponse({
                    code: 404,
                    msg: '未找到要删除的记录',
                    data: null,
                })
            }

            mockMasterIndexConfigRecords.splice(index, 1)

            return createMockResponse({
                code: 200,
                msg: '操作成功',
                data: null,
            })
        }

        throw new Error(`未实现的模拟数据: ${url}`)
    },
}

/**
 * 认证模块模拟数据
 */
const authMockProvider = {
    getMockData: async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
        const url = config.url || ''
        
        // 登录接口 /auth/login
        if ((url.includes('/auth/login') || url.includes('/api/auth/login')) && config.method?.toUpperCase() === 'POST') {
            const data = config.data as { username?: string; password?: string } || {}
            const username = data.username || ''
            const password = data.password || ''
            
            // 模拟账号验证
            const mockAccounts: Record<string, { password: string; userId: number }> = {
                admin: {
                    password: '123456',
                    userId: 1,
                },
                doctor: {
                    password: '123456',
                    userId: 2,
                },
                researcher: {
                    password: '123456',
                    userId: 3,
                },
            }
            
            const account = mockAccounts[username]
            
            if (account && account.password === password) {
                const timestamp = Date.now()
                const accessToken = `mock_jwt_token_${username}_${timestamp}`
                const refreshToken = `mock_refresh_token_${username}_${timestamp}`
                const mqttKey = `mock_mqtt_key_${username}_${timestamp}`
                
                return createMockResponse({
                    accessToken,
                    refreshToken,
                    expiresIn: 7200, // 2小时，单位：秒
                    tokenType: 'Bearer',
                    mqttKey,
                    userId: account.userId,
                })
            } else {
                return createMockResponse(
                    {
                        code: 401,
                        msg: '用户名或密码错误',
                        data: null,
                    },
                    401,
                    'Unauthorized'
                )
            }
        }
        
        // 获取用户详细信息接口 /auth/info
        if ((url.includes('/auth/info') || url.includes('/api/auth/info')) && config.method?.toUpperCase() === 'GET') {
            // 从token中解析用户名（简化处理）
            const token = config.headers?.Authorization?.toString().replace('Bearer ', '') || localStorage.getItem('access_token') || ''
            const usernameMatch = token.match(/mock_jwt_token_(\w+)_/)
            const username = usernameMatch ? usernameMatch[1] : 'admin'
            
            // 用户信息映射
            const userInfoMap: Record<string, any> = {
                admin: {
                    userId: 1,
                    deptId: 1,
                    token: token || `mock_jwt_token_${username}_${Date.now()}`,
                    loginTime: Date.now(),
                    expireTime: Date.now() + 7200 * 1000, // 2小时后过期
                    ipaddr: '127.0.0.1',
                    loginLocation: '本地',
                    browser: 'Chrome',
                    os: 'Windows',
                    permissions: ['*:*:*'],
                    roles: ['admin'],
                    user: {
                        id: 1,
                        createBy: 'system',
                        createTime: new Date().toISOString(),
                        updateBy: null,
                        updateTime: null,
                        remark: null,
                        delFlag: 0,
                        username: 'admin',
                        nickName: '管理员',
                        email: 'admin@example.com',
                        phoneNumber: '13800000001',
                        sex: '0',
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                        password: '',
                        status: '0',
                        deptId: 1,
                        postId: 0,
                    },
                    mqttKey: localStorage.getItem('mqtt_key') || `mock_mqtt_key_${username}_${Date.now()}`,
                },
                doctor: {
                    userId: 2,
                    deptId: 2,
                    token: token || `mock_jwt_token_${username}_${Date.now()}`,
                    loginTime: Date.now(),
                    expireTime: Date.now() + 7200 * 1000,
                    ipaddr: '127.0.0.1',
                    loginLocation: '本地',
                    browser: 'Chrome',
                    os: 'Windows',
                    permissions: ['user:view', 'data:view'],
                    roles: ['user'],
                    user: {
                        id: 2,
                        createBy: 'admin',
                        createTime: new Date().toISOString(),
                        updateBy: null,
                        updateTime: null,
                        remark: null,
                        delFlag: 0,
                        username: 'doctor',
                        nickName: '医生',
                        email: 'doctor@example.com',
                        phoneNumber: '13800000002',
                        sex: '1',
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor',
                        password: '',
                        status: '0',
                        deptId: 2,
                        postId: 0,
                    },
                    mqttKey: localStorage.getItem('mqtt_key') || `mock_mqtt_key_${username}_${Date.now()}`,
                },
                researcher: {
                    userId: 3,
                    deptId: 3,
                    token: token || `mock_jwt_token_${username}_${Date.now()}`,
                    loginTime: Date.now(),
                    expireTime: Date.now() + 7200 * 1000,
                    ipaddr: '127.0.0.1',
                    loginLocation: '本地',
                    browser: 'Chrome',
                    os: 'Windows',
                    permissions: ['user:view', 'data:view', 'research:view'],
                    roles: ['user', 'researcher'],
                    user: {
                        id: 3,
                        createBy: 'admin',
                        createTime: new Date().toISOString(),
                        updateBy: null,
                        updateTime: null,
                        remark: null,
                        delFlag: 0,
                        username: 'researcher',
                        nickName: '研究员',
                        email: 'researcher@example.com',
                        phoneNumber: '13800000003',
                        sex: '0',
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher',
                        password: '',
                        status: '0',
                        deptId: 3,
                        postId: 0,
                    },
                    mqttKey: localStorage.getItem('mqtt_key') || `mock_mqtt_key_${username}_${Date.now()}`,
                },
            }
            
            return createMockResponse(userInfoMap[username] || userInfoMap.admin)
        }
        
        // 获取当前用户信息（兼容旧接口）
        if ((url.includes('/auth/me') || url.includes('/api/auth/me')) && config.method?.toUpperCase() === 'GET') {
            // 从token中解析用户名（简化处理）
            const token = config.headers?.Authorization?.toString().replace('Bearer ', '') || ''
            const usernameMatch = token.match(/mock_jwt_token_(\w+)_/)
            const username = usernameMatch ? usernameMatch[1] : 'admin'
            
            const mockUsers: Record<string, any> = {
                admin: {
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                },
                doctor: {
                    id: 2,
                    username: 'doctor',
                    email: 'doctor@example.com',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor',
                    role: 'user',
                    createdAt: new Date().toISOString(),
                },
                researcher: {
                    id: 3,
                    username: 'researcher',
                    email: 'researcher@example.com',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher',
                    role: 'user',
                    createdAt: new Date().toISOString(),
                },
            }
            
            return createMockResponse(mockUsers[username] || mockUsers.admin)
        }
        
        // 登出接口
        if ((url.includes('/auth/logout') || url.includes('/api/auth/logout')) && config.method?.toUpperCase() === 'POST') {
            return createMockResponse(null)
        }
        
        throw new Error(`未实现的模拟数据: ${url}`)
    },
}

/**
 * 注册所有模拟数据提供者
 */
export const registerAllMockProviders = (): void => {
    // 注册认证模块（支持 /auth 和 /api/auth 两种路径）
    registerMockData('/auth', authMockProvider)
    registerMockData('/api/auth', authMockProvider)
    
    // 注册仪表盘模块
    registerMockData('/dashboard', dashboardMockProvider)
    registerMockData('/task/log/page', dashboardMockProvider)
    
    // 注册数据管理模块
    registerMockData('/data/primary-index', dataManagementMockProvider)
    registerMockData('/patient/empi', dataManagementMockProvider)

    // 注册类别标准管理模块
    registerMockData('/data/standard', categoryStandardMockProvider)
    
    // 注册数据库连接模块
    registerMockData('/database/connection', databaseConnectionMockProvider)
    
    // 注册主索引配置模块
    registerMockData('/index/master-index-config', masterIndexConfigMockProvider)
    
    // 可以继续注册其他模块的模拟数据提供者
}

