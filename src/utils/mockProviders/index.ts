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
                    categoryStatus?: number
                }) || {}
            const pageNum = data.pageNum || 1
            const pageSize = data.pageSize || 10
            const condition = (data.condition || '').toString().trim().toLowerCase()
            const status = data.categoryStatus

            // 按关键字与状态筛选
            const filtered = mockCategoryStandardRecords.filter(item => {
                const matchCondition =
                    !condition ||
                    item.categoryName.toLowerCase().includes(condition) ||
                    item.categoryCode.toLowerCase().includes(condition) ||
                    (item.remark || '').toLowerCase().includes(condition)
                const matchStatus =
                    typeof status !== 'number' ? true : item.categoryStatus === status
                return matchCondition && matchStatus
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
            const existingRecord = mockCategoryStandardRecords[index]
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
 * 注册所有模拟数据提供者
 */
export const registerAllMockProviders = (): void => {
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
    
    // 可以继续注册其他模块的模拟数据提供者
}

