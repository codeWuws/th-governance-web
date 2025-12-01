import moment from 'moment'
import {
    PatientRecord,
    SearchResponse,
    StatisticalAnalysis,
    SearchAggregations,
    TimeSeriesData,
} from '../types'

// 复杂逻辑说明：
// 本文件提供数据检索模块的模拟数据生成器，用于在开发环境或后端接口不可用时提供可交互的演示数据。
// 所有生成逻辑均产生稳定结构的数据，并控制字段一致性以避免前端类型错误。

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => {
    const index = randomInt(0, arr.length - 1)
    const item = arr[index]
    if (item === undefined) {
        throw new Error('Array is empty or index out of bounds')
    }
    return item
}

const DIAGNOSES = ['高血压', '糖尿病', '冠心病', '慢性肾病', '哮喘', '甲状腺功能异常']
const MEDICATIONS = ['阿司匹林', '二甲双胍', '氯沙坦', '他汀类', '胰岛素', '布洛芬']
const DEPARTMENTS = ['内科', '外科', '儿科', '妇产科', '急诊科']

export function generateMockPatient(id: number): PatientRecord {
    const gender = pick(['male', 'female', 'unknown']) as PatientRecord['gender']
    const age = randomInt(18, 85)
    const diagnosisCount = randomInt(1, 3)
    const diag = Array.from({ length: diagnosisCount }, () => pick(DIAGNOSES))

    const medCount = randomInt(1, 5)
    const meds = Array.from({ length: medCount }, (_, i) => ({
        id: `${id}-med-${i}`,
        name: pick(MEDICATIONS),
        dosage: `${randomInt(5, 50)}mg`,
        frequency: pick(['qd', 'bid', 'tid']),
        startDate: moment().subtract(randomInt(10, 300), 'days').format('YYYY-MM-DD'),
        endDate:
            Math.random() < 0.5
                ? moment().subtract(randomInt(1, 9), 'days').format('YYYY-MM-DD')
                : undefined,
        status: pick(['active', 'completed', 'discontinued'] as const) as 'active' | 'completed' | 'discontinued',
    }))

    const surgeries = Array.from({ length: randomInt(0, 2) }, (_, i) => ({
        id: `${id}-surgery-${i}`,
        name: pick(['阑尾切除', '胆囊切除', '冠脉支架', '白内障手术']),
        date: moment().subtract(randomInt(30, 600), 'days').format('YYYY-MM-DD'),
        type: 'surgery' as const,
        status: pick(['scheduled', 'completed', 'cancelled'] as const) as 'completed' | 'cancelled' | 'scheduled',
    }))

    const labs = Array.from({ length: randomInt(2, 6) }, (_, i) => ({
        id: `${id}-lab-${i}`,
        name: pick(['血常规', '肝功能', '肾功能', '血脂', '血糖']),
        date: moment().subtract(randomInt(1, 120), 'days').format('YYYY-MM-DD'),
        result: `${randomInt(1, 10)}`,
        unit: pick(['mmol/L', 'mg/dL', 'g/L']),
        referenceRange: '正常范围',
        status: pick(['normal', 'abnormal', 'critical'] as const) as 'normal' | 'abnormal' | 'critical',
    }))

    return {
        id: `${id}`,
        patientId: `P${100000 + id}`,
        patientName: `患者${id}`,
        gender,
        age,
        admissionDate: moment().subtract(randomInt(1, 365), 'days').format('YYYY-MM-DD'),
        visitDate: moment().format('YYYY-MM-DD'),
        department: pick(DEPARTMENTS),
        doctor: `医生${randomInt(1, 50)}`,
        diagnosis: diag,
        medications: meds,
        procedures: surgeries,
        surgeries,
        labTests: labs,
        labResults: labs,
        dataQuality: {
            completeness: randomInt(60, 100),
            accuracy: randomInt(60, 100),
            consistency: randomInt(60, 100),
            timeliness: randomInt(60, 100),
            overall: randomInt(60, 100),
        },
        createdAt: moment().subtract(randomInt(10, 100), 'days').toISOString(),
        updatedAt: moment().toISOString(),
    }
}

export function generateMockSearchResponse(count: number = 30): SearchResponse {
    const records = Array.from({ length: count }, (_, i) => generateMockPatient(i + 1))
    const aggregations: SearchAggregations = {
        gender: { male: 0, female: 0, unknown: 0 },
        ageGroups: { '0-18': 0, '19-35': 0, '36-60': 0, '60+': 0 },
        departments: {},
        medications: {},
        dataQuality: { high: 0, medium: 0, low: 0 },
        diagnosis: {},
    }

    records.forEach(r => {
        aggregations.gender[r.gender] = (aggregations.gender[r.gender] || 0) + 1
        const group = r.age <= 18 ? '0-18' : r.age <= 35 ? '19-35' : r.age <= 60 ? '36-60' : '60+'
        aggregations.ageGroups[group] = (aggregations.ageGroups[group] || 0) + 1
        aggregations.departments[r.department] = (aggregations.departments[r.department] || 0) + 1
        r.medications.forEach(m => {
            aggregations.medications[m.name] = (aggregations.medications[m.name] || 0) + 1
        })
        r.diagnosis.forEach(d => {
            aggregations.diagnosis[d] = (aggregations.diagnosis[d] || 0) + 1
        })
        const quality =
            r.dataQuality.overall >= 80 ? 'high' : r.dataQuality.overall >= 60 ? 'medium' : 'low'
        aggregations.dataQuality[quality] = (aggregations.dataQuality[quality] || 0) + 1
    })

    return {
        records,
        total: records.length,
        page: 1,
        pageSize: records.length,
        aggregations,
        searchTime: randomInt(50, 200),
    }
}

export function generateMockStatisticalAnalysis(records: PatientRecord[]): {
    analysis: StatisticalAnalysis
    aggregations: SearchAggregations
} {
    const aggregations = generateMockSearchResponse(records.length).aggregations

    const genderTotals = {
        male: aggregations.gender.male || 0,
        female: aggregations.gender.female || 0,
        unknown: aggregations.gender.unknown || 0,
    }
    const total = genderTotals.male + genderTotals.female + genderTotals.unknown || 1

    const analysis: StatisticalAnalysis = {
        genderDistribution: {
            ...genderTotals,
            percentages: {
                male: +((100 * genderTotals.male) / total).toFixed(1),
                female: +((100 * genderTotals.female) / total).toFixed(1),
                unknown: +((100 * genderTotals.unknown) / total).toFixed(1),
            },
        },
        ageDistribution: Object.entries(aggregations.ageGroups).map(([group, count]) => ({
            group,
            count,
            percentage: +((100 * (count as number)) / records.length).toFixed(1),
        })),
        medicationUsage: Object.entries(aggregations.medications)
            .slice(0, 15)
            .map(([medication, count]) => ({
                medication,
                count: count as number,
                frequency: randomInt(1, 100),
            })),
        dataQualityMetrics: {
            averageCompleteness: randomInt(60, 95),
            averageAccuracy: randomInt(60, 95),
            averageConsistency: randomInt(60, 95),
            averageTimeliness: randomInt(60, 95),
            overallAverage: randomInt(60, 95),
        },
        diagnosisFrequency: Object.entries(aggregations.diagnosis).map(([diagnosis, count]) => ({
            diagnosis,
            count: count as number,
            percentage: +((100 * (count as number)) / records.length).toFixed(1),
        })),
    }

    return { analysis, aggregations }
}

export function generateMockTimeSeriesData(days: number = 120): TimeSeriesData[] {
    const start = moment().subtract(days, 'days')
    return Array.from({ length: days }, (_, i) => ({
        timestamp: start.clone().add(i, 'days').toISOString(),
        value: randomInt(60, 140),
        type: pick(['blood_pressure', 'heart_rate', 'blood_sugar']),
        category: pick(['诊断', '用药', '手术', '检验检查', '治疗']),
        unit: 'units',
    }))
}

export function generateMockPatients(count: number = 30): PatientRecord[] {
    return Array.from({ length: count }, (_, i) => generateMockPatient(i + 1))
}
