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
    
    // 注册数据库连接模块
    registerMockData('/database/connection', databaseConnectionMockProvider)
    
    // 可以继续注册其他模块的模拟数据提供者
}

