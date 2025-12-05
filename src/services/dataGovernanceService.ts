/**
 * 数据治理服务
 * 提供数据清洗、去重、标准对照、EMPI/EMOI定义发放等核心功能的API接口
 */

import type { DataGovernanceResult } from '@/types'
import { api } from '@/utils/request'

/**
 * 数据治理服务类
 * 封装所有数据治理相关的API调用
 */
export class DataGovernanceService {
    /**
     * 0、清空数据、初始化
     * @description 清空所有数据并进行系统初始化
     * @returns Promise<null>
     */
    static async init(): Promise<null> {
        try {
            return await api.post<null>('/data/governance/init')
        } catch (error) {
            throw new Error(
                `数据初始化失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 1、数据清洗、空格替换
     * @description 对数据进行清洗，替换多余空格
     * @returns Promise<DataGovernanceResult>
     */
    static async cleanDataFields(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/cleanDataFields')
        } catch (error) {
            throw new Error(`数据清洗失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 2、数据去重
     * @description 对数据进行去重处理
     * @returns Promise<DataGovernanceResult>
     */
    static async deduplicateData(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/deduplicateData')
        } catch (error) {
            throw new Error(`数据去重失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 4、标准对照
     * @description 应用标准映射规则
     * @returns Promise<DataGovernanceResult>
     */
    static async applyStandardMapping(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/applyStandardMapping')
        } catch (error) {
            throw new Error(`标准对照失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 5、EMPI 定义发放
     * @description 分配和发放EMPI（企业主索引）定义
     * @returns Promise<DataGovernanceResult>
     */
    static async assignEmpi(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/assignEmpi')
        } catch (error) {
            throw new Error(
                `EMPI定义发放失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 6、EMOI 定义发放
     * @description 分配和发放EMOI（企业对象索引）定义
     * @returns Promise<DataGovernanceResult>
     */
    static async assignEmoi(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/assignEmoi')
        } catch (error) {
            throw new Error(
                `EMOI定义发放失败: ${error instanceof Error ? error.message : '未知错误'}`
            )
        }
    }

    /**
     * 7、数据归一
     * @description 对数据进行归一化处理
     * @returns Promise<DataGovernanceResult>
     */
    static async normalizeData(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/normalizeData')
        } catch (error) {
            throw new Error(`数据归一失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 8、丢孤
     * @description 移除孤立记录
     * @returns Promise<DataGovernanceResult>
     */
    static async removeOrphanRecords(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/removeOrphanRecords')
        } catch (error) {
            throw new Error(`丢孤处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 9、数据脱敏
     * @description 对敏感数据进行脱敏处理
     * @returns Promise<DataGovernanceResult>
     */
    static async maskSensitiveData(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/maskSensitiveData')
        } catch (error) {
            throw new Error(`数据脱敏失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 10、同步数据
     * @description 同步数据到目标系统
     * @returns Promise<DataGovernanceResult>
     */
    static async sync(): Promise<DataGovernanceResult> {
        try {
            return await api.post<DataGovernanceResult>('/data/governance/sync')
        } catch (error) {
            throw new Error(`数据同步失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    // （已移除）数据录入（同步）封装方法 syncDataEntry

}

/**
 * 数据治理服务实例
 * 提供便捷的API调用方法
 */
export const dataGovernanceService = {
    // 数据处理操作
    init: DataGovernanceService.init,
    cleanDataFields: DataGovernanceService.cleanDataFields,
    deduplicateData: DataGovernanceService.deduplicateData,
    applyStandardMapping: DataGovernanceService.applyStandardMapping,
    assignEmpi: DataGovernanceService.assignEmpi,
    assignEmoi: DataGovernanceService.assignEmoi,
    normalizeData: DataGovernanceService.normalizeData,
    removeOrphanRecords: DataGovernanceService.removeOrphanRecords,
    maskSensitiveData: DataGovernanceService.maskSensitiveData,
    sync: DataGovernanceService.sync,
}

export default dataGovernanceService
