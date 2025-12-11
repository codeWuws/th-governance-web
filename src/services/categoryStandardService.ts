/**
 * 类别标准服务
 * 提供类别标准数据的共享访问
 */

// 类别标准接口定义
export interface CategoryStandard {
    id: string
    name: string // 类别名称
    code: string // 类别编号
    description?: string // 描述
    status: 'active' | 'inactive' // 状态
    createTime: string
    updateTime: string
    creator: string
}

// 模拟数据存储（实际项目中应该从API获取）
let categoryStandards: CategoryStandard[] = [
    {
        id: '1',
        name: '科室分类',
        code: 'DEPT_001',
        description: '医院科室分类体系',
        status: 'active',
        createTime: '2024-01-10 09:00:00',
        updateTime: '2024-01-15 14:30:00',
        creator: '系统管理员',
    },
    {
        id: '2',
        name: '人员分类',
        code: 'PERSON_001',
        description: '医院人员分类体系',
        status: 'active',
        createTime: '2024-01-11 10:00:00',
        updateTime: '2024-01-16 16:45:00',
        creator: '系统管理员',
    },
    {
        id: '3',
        name: '疾病分类',
        code: 'DISEASE_001',
        description: '疾病分类体系',
        status: 'active',
        createTime: '2024-01-12 11:00:00',
        updateTime: '2024-01-17 10:20:00',
        creator: '系统管理员',
    },
    {
        id: '4',
        name: '性别',
        code: 'GENDER_001',
        description: '性别分类标准',
        status: 'active',
        createTime: '2024-01-13 09:00:00',
        updateTime: '2024-01-13 09:00:00',
        creator: '系统管理员',
    },
    {
        id: '5',
        name: '年龄',
        code: 'AGE_001',
        description: '年龄分类标准',
        status: 'active',
        createTime: '2024-01-13 10:00:00',
        updateTime: '2024-01-13 10:00:00',
        creator: '系统管理员',
    },
    {
        id: '6',
        name: '民族',
        code: 'ETHNICITY_001',
        description: '民族分类标准',
        status: 'active',
        createTime: '2024-01-13 11:00:00',
        updateTime: '2024-01-13 11:00:00',
        creator: '系统管理员',
    },
]

/**
 * 获取所有类别标准
 * @returns Promise<CategoryStandard[]>
 */
export const getCategoryStandards = async (): Promise<CategoryStandard[]> => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 100))
    return [...categoryStandards]
}

/**
 * 获取启用的类别标准
 * @returns Promise<CategoryStandard[]>
 */
export const getActiveCategoryStandards = async (): Promise<CategoryStandard[]> => {
    const all = await getCategoryStandards()
    return all.filter(item => item.status === 'active')
}

/**
 * 根据名称获取类别标准
 * @param name 类别名称
 * @returns Promise<CategoryStandard | undefined>
 */
export const getCategoryStandardByName = async (name: string): Promise<CategoryStandard | undefined> => {
    const all = await getCategoryStandards()
    return all.find(item => item.name === name && item.status === 'active')
}

/**
 * 更新类别标准数据（用于类别标准管理页面）
 * @param data 新的类别标准数据
 */
export const updateCategoryStandards = (data: CategoryStandard[]): void => {
    categoryStandards = [...data]
}

/**
 * 获取当前类别标准数据（同步方法，用于内部使用）
 * @returns CategoryStandard[]
 */
export const getCategoryStandardsSync = (): CategoryStandard[] => {
    return [...categoryStandards]
}

