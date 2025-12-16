import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
    Layout,
    Tree,
    Input,
    Button,
    Card,
    Table,
    Space,
    Modal,
    Form,
    Select,
    Typography,
    Descriptions,
    Tag,
    message,
    Empty,
    Divider,
    Dropdown,
    MenuProps,
    Tabs,
    Alert,
    Spin,
} from 'antd'
import type { DataNode } from 'antd/es/tree'
import {
    DatabaseOutlined,
    FolderOutlined,
    TableOutlined,
    FieldTimeOutlined,
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    MoreOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons'
import { useDebounce } from '../../hooks/useDebounce'
import { showConfirm } from '../../utils/showConfirm'
import { dataManagementService } from '../../services/dataManagementService'
import { isDevVersion } from '../../utils/versionControl'
import { logger } from '../../utils/logger'
import type { AssetTreeNode, DatabaseOption, AddAssetRequest, UpdateAssetRequest, TableInfoItem } from '../../types'
import styles from './DataAssetManagement.module.scss'

const { Sider, Content } = Layout
const { Search } = Input
const { Option } = Select
const { Title, Text } = Typography

// 数据源类型
interface DataSource {
    id: string
    name: string
    type: 'mysql' | 'postgresql' | 'oracle' | 'sqlserver'
    host: string
    port: number
    database: string
    status: 'connected' | 'disconnected'
    description?: string // 描述信息
    dbStatus?: number | null // 数据库连接状态（0-未连接，1-已连接，2-连接中）
}

// 资产类别
interface AssetCategory {
    id: string
    name: string
    dataSourceId: string
    database: string
    tables: string[]
    description?: string // 描述信息
}

// 表信息
interface TableInfo {
    name: string
    schema: string
    comment?: string
    rowCount?: number
    fields: FieldInfo[]
}

// 字段信息
interface FieldInfo {
    name: string
    type: string
    length?: number
    nullable: boolean
    default?: string
    comment?: string
    primaryKey?: boolean
}

// 树节点扩展
interface ExtendedDataNode extends DataNode {
    nodeType: 'dataSource' | 'category' | 'table' | 'field'
    data?: DataSource | AssetCategory | TableInfo | FieldInfo
    dataSourceId?: string
    categoryId?: string
    tableName?: string
}

// 医学科研领域相关的模拟数据 - 真实医院数据资产
const mockDataSources: DataSource[] = [
    {
        id: 'ds1',
        name: 'HIS核心业务数据资产',
        type: 'mysql',
        host: '192.168.1.100',
        port: 3306,
        database: 'hospital_his',
        status: 'connected',
        description: '医院信息系统的核心业务数据资产，包含患者基本信息、诊疗记录、医嘱、费用等核心业务数据，支持医院日常运营管理。数据量约500万条记录，每日新增约2万条，是医院最重要的数据资产之一。',
    },
    {
        id: 'ds2',
        name: '科研数据仓库',
        type: 'postgresql',
        host: '192.168.1.101',
        port: 5432,
        database: 'research_warehouse',
        status: 'connected',
        description: '用于存储和管理科研项目相关的数据资产，支持多维度数据分析和挖掘，包含临床试验、样本数据、研究结果等。数据量约200万条记录，支持复杂查询和分析，是医院科研工作的核心数据资产。',
    },
    {
        id: 'ds3',
        name: 'EMR医疗记录数据资产',
        type: 'mysql',
        host: '192.168.1.102',
        port: 3306,
        database: 'emr_system',
        status: 'connected',
        description: '电子病历医疗记录数据资产，存储患者的完整医疗记录和病历信息，包括病程记录、护理记录、手术记录等。数据量约800万条记录，符合HL7标准，是医院医疗质量评估的重要数据来源。',
    },
    {
        id: 'ds4',
        name: 'PACS影像数据资产',
        type: 'oracle',
        host: '192.168.1.103',
        port: 1521,
        database: 'pacs_db',
        status: 'connected',
        description: '医学影像存储与通信数据资产，存储CT、MRI、X光、超声等各类医学影像数据及报告。数据量约150万条记录，支持DICOM标准，是医院影像诊断和教学的重要数据资产。',
    },
    {
        id: 'ds5',
        name: 'LIS检验数据资产',
        type: 'mysql',
        host: '192.168.1.104',
        port: 3306,
        database: 'lis_system',
        status: 'connected',
        description: '检验信息数据资产，管理检验申请、标本信息、检验结果、质控数据等，支持检验全流程管理。数据量约600万条记录，每日新增约1.5万条，是医院检验质量控制和科研分析的重要数据资产。',
    },
    {
        id: 'ds6',
        name: '手术麻醉数据资产',
        type: 'mysql',
        host: '192.168.1.105',
        port: 3306,
        database: 'anesthesia_system',
        status: 'connected',
        description: '手术麻醉信息数据资产，记录手术安排、麻醉方案、术中监测数据、术后恢复等信息。数据量约80万条记录，支持实时监测数据存储，是医院手术安全和质量分析的重要数据资产。',
    },
    {
        id: 'ds7',
        name: '药事管理数据资产',
        type: 'mysql',
        host: '192.168.1.106',
        port: 3306,
        database: 'pharmacy_system',
        status: 'connected',
        description: '医院药事管理数据资产，管理药品库存、采购、配送、处方审核、用药监测等全流程数据。数据量约300万条记录，支持药品追溯，是医院合理用药和药品安全的重要数据资产。',
    },
    {
        id: 'ds8',
        name: '病理诊断数据资产',
        type: 'mysql',
        host: '192.168.1.107',
        port: 3306,
        database: 'pathology_system',
        status: 'connected',
        description: '病理诊断数据资产，存储病理检查申请、标本信息、病理诊断报告、免疫组化结果等数据。数据量约45万条记录，是医院病理诊断和肿瘤研究的重要数据资产。',
    },
    {
        id: 'ds9',
        name: '输血管理数据资产',
        type: 'mysql',
        host: '192.168.1.108',
        port: 3306,
        database: 'blood_transfusion',
        status: 'connected',
        description: '输血管理数据资产，记录血液申请、配血结果、输血记录、不良反应等数据。数据量约12万条记录，是医院输血安全和质量管理的重要数据资产。',
    },
    {
        id: 'ds10',
        name: '体检中心数据资产',
        type: 'mysql',
        host: '192.168.1.109',
        port: 3306,
        database: 'health_examination',
        status: 'connected',
        description: '体检中心数据资产，存储体检预约、体检项目、体检结果、健康评估等数据。数据量约180万条记录，是医院健康管理和慢病筛查的重要数据资产。',
    },
    {
        id: 'ds11',
        name: '财务运营数据资产',
        type: 'mysql',
        host: '192.168.1.110',
        port: 3306,
        database: 'finance_system',
        status: 'connected',
        description: '财务运营数据资产，包含收入、支出、成本核算、财务报表等数据。数据量约250万条记录，是医院运营分析和决策支持的重要数据资产。',
    },
    {
        id: 'ds12',
        name: '设备管理数据资产',
        type: 'mysql',
        host: '192.168.1.111',
        port: 3306,
        database: 'equipment_management',
        status: 'connected',
        description: '医疗设备管理数据资产，记录设备信息、采购、维护、使用、报废等全生命周期数据。数据量约15万条记录，是医院设备管理和成本控制的重要数据资产。',
    },
]

const mockCategories: AssetCategory[] = [
    {
        id: 'cat1',
        name: '患者基础信息资产',
        dataSourceId: 'ds1',
        database: 'hospital_his',
        tables: ['patient_info', 'patient_contact', 'patient_insurance', 'patient_allergy', 'patient_family_history'],
        description: '包含患者的基本身份信息、联系方式、保险信息、过敏史、家族史等核心数据资产，是医院数据治理的基础，支持患者主索引(EMPI)管理',
    },
    {
        id: 'cat2',
        name: '临床诊疗数据资产',
        dataSourceId: 'ds1',
        database: 'hospital_his',
        tables: ['diagnosis_record', 'treatment_plan', 'prescription', 'medical_order', 'outpatient_visit'],
        description: '记录患者的诊断信息、治疗方案、处方数据和医嘱信息的数据资产，用于临床决策支持和医疗质量分析，支持ICD-10编码标准',
    },
    {
        id: 'cat3',
        name: '住院管理数据资产',
        dataSourceId: 'ds1',
        database: 'hospital_his',
        tables: ['admission_record', 'bed_info', 'discharge_record', 'ward_transfer', 'nursing_plan'],
        description: '管理患者住院相关信息的数据资产，包括入院记录、床位信息、出院记录、转科记录、护理计划等，支持床位资源优化',
    },
    {
        id: 'cat4',
        name: '检验检查数据资产',
        dataSourceId: 'ds2',
        database: 'research_warehouse',
        tables: ['lab_result', 'imaging_report', 'pathology_report', 'exam_report', 'vital_signs'],
        description: '包含各类检验结果、影像报告、病理报告、检查报告和生命体征数据的数据资产，用于疾病诊断、科研分析和数据挖掘，支持多维度统计分析',
    },
    {
        id: 'cat5',
        name: '科研项目数据资产',
        dataSourceId: 'ds2',
        database: 'research_warehouse',
        tables: ['research_project', 'clinical_trial', 'sample_data', 'research_result', 'ethics_approval'],
        description: '科研项目和临床试验相关的数据资产，包括项目信息、试验方案、样本数据、研究结果、伦理审批等，支持医学研究和数据分析，符合GCP规范',
    },
    {
        id: 'cat6',
        name: '病历文档数据资产',
        dataSourceId: 'ds3',
        database: 'emr_system',
        tables: ['medical_record', 'progress_note', 'nursing_record', 'surgery_record', 'consultation_record'],
        description: '电子病历系统中的各类医疗文档数据资产，包括病历、病程记录、护理记录、手术记录、会诊记录等结构化文档数据，符合电子病历规范',
    },
    {
        id: 'cat7',
        name: '影像数据资产',
        dataSourceId: 'ds4',
        database: 'pacs_db',
        tables: ['image_study', 'image_series', 'image_instance', 'radiology_report', 'image_annotation'],
        description: '医学影像系统的核心数据资产，包括影像检查、影像序列、影像实例、影像报告和影像标注，支持影像数据的存储、检索和分析，符合DICOM标准',
    },
    {
        id: 'cat8',
        name: '检验数据资产',
        dataSourceId: 'ds5',
        database: 'lis_system',
        tables: ['test_request', 'specimen_info', 'test_result', 'quality_control', 'instrument_data'],
        description: '检验信息系统的核心数据资产，包括检验申请、标本信息、检验结果、质控数据和仪器数据，支持检验全流程管理和质量追溯',
    },
    {
        id: 'cat9',
        name: '手术麻醉数据资产',
        dataSourceId: 'ds6',
        database: 'anesthesia_system',
        tables: ['surgery_schedule', 'anesthesia_plan', 'monitoring_data', 'recovery_record'],
        description: '手术麻醉信息管理数据资产，包括手术安排、麻醉方案、术中监测数据、术后恢复记录等，支持手术安全管理和质量监控',
    },
    {
        id: 'cat10',
        name: '药事管理数据资产',
        dataSourceId: 'ds7',
        database: 'pharmacy_system',
        tables: ['drug_inventory', 'prescription_audit', 'drug_dispensing', 'adverse_reaction'],
        description: '医院药事管理数据资产，包括药品库存、处方审核、药品配送、不良反应监测等，支持合理用药和药品安全追溯',
    },
    {
        id: 'cat11',
        name: '病理诊断数据资产',
        dataSourceId: 'ds8',
        database: 'pathology_system',
        tables: ['pathology_request', 'specimen_info', 'pathology_report', 'immunohistochemistry', 'molecular_pathology'],
        description: '病理诊断数据资产，包括病理检查申请、标本信息、病理诊断报告、免疫组化结果、分子病理数据等，支持病理诊断和肿瘤研究',
    },
    {
        id: 'cat12',
        name: '输血管理数据资产',
        dataSourceId: 'ds9',
        database: 'blood_transfusion',
        tables: ['blood_request', 'blood_matching', 'transfusion_record', 'adverse_reaction', 'blood_inventory'],
        description: '输血管理数据资产，包括血液申请、配血结果、输血记录、不良反应、血液库存等，支持输血安全和质量管理',
    },
    {
        id: 'cat13',
        name: '体检数据资产',
        dataSourceId: 'ds10',
        database: 'health_examination',
        tables: ['exam_appointment', 'exam_item', 'exam_result', 'health_assessment', 'follow_up_plan'],
        description: '体检中心数据资产，包括体检预约、体检项目、体检结果、健康评估、随访计划等，支持健康管理和慢病筛查',
    },
    {
        id: 'cat14',
        name: '财务运营数据资产',
        dataSourceId: 'ds11',
        database: 'finance_system',
        tables: ['revenue_record', 'expense_record', 'cost_accounting', 'financial_report', 'budget_plan'],
        description: '财务运营数据资产，包括收入记录、支出记录、成本核算、财务报表、预算计划等，支持医院运营分析和决策支持',
    },
    {
        id: 'cat15',
        name: '设备管理数据资产',
        dataSourceId: 'ds12',
        database: 'equipment_management',
        tables: ['equipment_info', 'equipment_procurement', 'equipment_maintenance', 'equipment_usage', 'equipment_scrap'],
        description: '医疗设备管理数据资产，包括设备信息、采购记录、维护记录、使用记录、报废记录等，支持设备全生命周期管理',
    },
]

const mockTables: Record<string, TableInfo> = {
    patient_info: {
        name: 'patient_info',
        schema: 'hospital_his',
        comment: '患者基本信息表',
        rowCount: 125680,
        fields: [
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者唯一标识',
                primaryKey: true,
            },
            {
                name: 'name',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '患者姓名',
            },
            {
                name: 'gender',
                type: 'CHAR',
                length: 1,
                nullable: false,
                default: 'M',
                comment: '性别：M-男，F-女',
            },
            {
                name: 'birth_date',
                type: 'DATE',
                nullable: true,
                comment: '出生日期',
            },
            {
                name: 'id_card',
                type: 'VARCHAR',
                length: 18,
                nullable: true,
                comment: '身份证号',
            },
            {
                name: 'phone',
                type: 'VARCHAR',
                length: 20,
                nullable: true,
                comment: '联系电话',
            },
            {
                name: 'address',
                type: 'VARCHAR',
                length: 200,
                nullable: true,
                comment: '住址',
            },
            {
                name: 'create_time',
                type: 'DATETIME',
                nullable: false,
                comment: '创建时间',
            },
        ],
    },
    diagnosis_record: {
        name: 'diagnosis_record',
        schema: 'hospital_his',
        comment: '诊断记录表',
        rowCount: 456230,
        fields: [
            {
                name: 'record_id',
                type: 'BIGINT',
                nullable: false,
                comment: '记录ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'diagnosis_code',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '诊断编码（ICD-10）',
            },
            {
                name: 'diagnosis_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '诊断名称',
            },
            {
                name: 'diagnosis_type',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '诊断类型：主要诊断、次要诊断',
            },
            {
                name: 'diagnosis_date',
                type: 'DATE',
                nullable: false,
                comment: '诊断日期',
            },
            {
                name: 'doctor_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '医生ID',
            },
            {
                name: 'department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '科室',
            },
        ],
    },
    lab_result: {
        name: 'lab_result',
        schema: 'research_warehouse',
        comment: '检验结果表',
        rowCount: 892450,
        fields: [
            {
                name: 'result_id',
                type: 'BIGINT',
                nullable: false,
                comment: '结果ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'test_code',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '检验项目编码',
            },
            {
                name: 'test_name',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '检验项目名称',
            },
            {
                name: 'test_value',
                type: 'DECIMAL',
                length: 10,
                nullable: true,
                comment: '检验数值',
            },
            {
                name: 'test_unit',
                type: 'VARCHAR',
                length: 20,
                nullable: true,
                comment: '检验单位',
            },
            {
                name: 'reference_range',
                type: 'VARCHAR',
                length: 50,
                nullable: true,
                comment: '参考范围',
            },
            {
                name: 'test_date',
                type: 'DATETIME',
                nullable: false,
                comment: '检验日期',
            },
        ],
    },
    research_project: {
        name: 'research_project',
        schema: 'research_warehouse',
        comment: '科研项目表',
        rowCount: 1250,
        fields: [
            {
                name: 'project_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '项目ID',
                primaryKey: true,
            },
            {
                name: 'project_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '项目名称',
            },
            {
                name: 'project_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '项目类型',
            },
            {
                name: 'principal_investigator',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '项目负责人',
            },
            {
                name: 'start_date',
                type: 'DATE',
                nullable: false,
                comment: '开始日期',
            },
            {
                name: 'end_date',
                type: 'DATE',
                nullable: true,
                comment: '结束日期',
            },
            {
                name: 'status',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '项目状态',
            },
        ],
    },
    patient_contact: {
        name: 'patient_contact',
        schema: 'hospital_his',
        comment: '患者联系方式表',
        rowCount: 125680,
        fields: [
            {
                name: 'contact_id',
                type: 'BIGINT',
                nullable: false,
                comment: '联系方式ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'contact_type',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '联系方式类型：手机、固定电话、邮箱等',
            },
            {
                name: 'contact_value',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '联系方式值',
            },
            {
                name: 'is_primary',
                type: 'TINYINT',
                nullable: false,
                default: '0',
                comment: '是否主要联系方式：0-否，1-是',
            },
        ],
    },
    patient_insurance: {
        name: 'patient_insurance',
        schema: 'hospital_his',
        comment: '患者保险信息表',
        rowCount: 118500,
        fields: [
            {
                name: 'insurance_id',
                type: 'BIGINT',
                nullable: false,
                comment: '保险ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'insurance_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '保险类型：医保、商业保险等',
            },
            {
                name: 'insurance_number',
                type: 'VARCHAR',
                length: 50,
                nullable: true,
                comment: '保险号',
            },
            {
                name: 'insurance_company',
                type: 'VARCHAR',
                length: 100,
                nullable: true,
                comment: '保险公司',
            },
        ],
    },
    patient_allergy: {
        name: 'patient_allergy',
        schema: 'hospital_his',
        comment: '患者过敏史表',
        rowCount: 45680,
        fields: [
            {
                name: 'allergy_id',
                type: 'BIGINT',
                nullable: false,
                comment: '过敏ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'allergen',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '过敏原',
            },
            {
                name: 'allergy_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '过敏类型：药物、食物、其他',
            },
            {
                name: 'severity',
                type: 'VARCHAR',
                length: 20,
                nullable: true,
                comment: '严重程度：轻度、中度、重度',
            },
        ],
    },
    treatment_plan: {
        name: 'treatment_plan',
        schema: 'hospital_his',
        comment: '治疗方案表',
        rowCount: 234560,
        fields: [
            {
                name: 'plan_id',
                type: 'BIGINT',
                nullable: false,
                comment: '方案ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'plan_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '方案名称',
            },
            {
                name: 'plan_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '方案类型',
            },
            {
                name: 'start_date',
                type: 'DATE',
                nullable: false,
                comment: '开始日期',
            },
            {
                name: 'end_date',
                type: 'DATE',
                nullable: true,
                comment: '结束日期',
            },
        ],
    },
    prescription: {
        name: 'prescription',
        schema: 'hospital_his',
        comment: '处方表',
        rowCount: 567890,
        fields: [
            {
                name: 'prescription_id',
                type: 'BIGINT',
                nullable: false,
                comment: '处方ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'doctor_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '医生ID',
            },
            {
                name: 'prescription_date',
                type: 'DATETIME',
                nullable: false,
                comment: '处方日期',
            },
            {
                name: 'total_amount',
                type: 'DECIMAL',
                length: 10,
                nullable: true,
                comment: '总金额',
            },
        ],
    },
    medical_order: {
        name: 'medical_order',
        schema: 'hospital_his',
        comment: '医嘱表',
        rowCount: 1234567,
        fields: [
            {
                name: 'order_id',
                type: 'BIGINT',
                nullable: false,
                comment: '医嘱ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'order_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '医嘱类型：长期、临时',
            },
            {
                name: 'order_content',
                type: 'TEXT',
                nullable: false,
                comment: '医嘱内容',
            },
            {
                name: 'order_date',
                type: 'DATETIME',
                nullable: false,
                comment: '医嘱日期',
            },
        ],
    },
    admission_record: {
        name: 'admission_record',
        schema: 'hospital_his',
        comment: '入院记录表',
        rowCount: 234567,
        fields: [
            {
                name: 'admission_id',
                type: 'BIGINT',
                nullable: false,
                comment: '入院ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'admission_date',
                type: 'DATETIME',
                nullable: false,
                comment: '入院日期',
            },
            {
                name: 'department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '科室',
            },
            {
                name: 'ward',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '病区',
            },
        ],
    },
    bed_info: {
        name: 'bed_info',
        schema: 'hospital_his',
        comment: '床位信息表',
        rowCount: 500,
        fields: [
            {
                name: 'bed_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '床位ID',
                primaryKey: true,
            },
            {
                name: 'ward',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '病区',
            },
            {
                name: 'bed_number',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '床位号',
            },
            {
                name: 'bed_type',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '床位类型',
            },
            {
                name: 'status',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '床位状态：空闲、占用',
            },
        ],
    },
    discharge_record: {
        name: 'discharge_record',
        schema: 'hospital_his',
        comment: '出院记录表',
        rowCount: 223456,
        fields: [
            {
                name: 'discharge_id',
                type: 'BIGINT',
                nullable: false,
                comment: '出院ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'discharge_date',
                type: 'DATETIME',
                nullable: false,
                comment: '出院日期',
            },
            {
                name: 'discharge_type',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '出院类型：治愈、好转、未愈等',
            },
        ],
    },
    ward_transfer: {
        name: 'ward_transfer',
        schema: 'hospital_his',
        comment: '转科记录表',
        rowCount: 45678,
        fields: [
            {
                name: 'transfer_id',
                type: 'BIGINT',
                nullable: false,
                comment: '转科ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'from_department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '转出科室',
            },
            {
                name: 'to_department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '转入科室',
            },
            {
                name: 'transfer_date',
                type: 'DATETIME',
                nullable: false,
                comment: '转科日期',
            },
        ],
    },
    imaging_report: {
        name: 'imaging_report',
        schema: 'research_warehouse',
        comment: '影像报告表',
        rowCount: 345678,
        fields: [
            {
                name: 'report_id',
                type: 'BIGINT',
                nullable: false,
                comment: '报告ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'exam_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '检查类型：CT、MRI、X光等',
            },
            {
                name: 'report_content',
                type: 'TEXT',
                nullable: true,
                comment: '报告内容',
            },
            {
                name: 'report_date',
                type: 'DATETIME',
                nullable: false,
                comment: '报告日期',
            },
        ],
    },
    pathology_report: {
        name: 'pathology_report',
        schema: 'research_warehouse',
        comment: '病理报告表',
        rowCount: 123456,
        fields: [
            {
                name: 'report_id',
                type: 'BIGINT',
                nullable: false,
                comment: '报告ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'specimen_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '标本类型',
            },
            {
                name: 'diagnosis',
                type: 'TEXT',
                nullable: true,
                comment: '病理诊断',
            },
            {
                name: 'report_date',
                type: 'DATETIME',
                nullable: false,
                comment: '报告日期',
            },
        ],
    },
    exam_report: {
        name: 'exam_report',
        schema: 'research_warehouse',
        comment: '检查报告表',
        rowCount: 234567,
        fields: [
            {
                name: 'report_id',
                type: 'BIGINT',
                nullable: false,
                comment: '报告ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'exam_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '检查类型',
            },
            {
                name: 'report_content',
                type: 'TEXT',
                nullable: true,
                comment: '报告内容',
            },
            {
                name: 'report_date',
                type: 'DATETIME',
                nullable: false,
                comment: '报告日期',
            },
        ],
    },
    clinical_trial: {
        name: 'clinical_trial',
        schema: 'research_warehouse',
        comment: '临床试验表',
        rowCount: 234,
        fields: [
            {
                name: 'trial_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '试验ID',
                primaryKey: true,
            },
            {
                name: 'trial_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '试验名称',
            },
            {
                name: 'trial_phase',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '试验阶段：I期、II期、III期',
            },
            {
                name: 'start_date',
                type: 'DATE',
                nullable: false,
                comment: '开始日期',
            },
            {
                name: 'status',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '试验状态',
            },
        ],
    },
    sample_data: {
        name: 'sample_data',
        schema: 'research_warehouse',
        comment: '样本数据表',
        rowCount: 56789,
        fields: [
            {
                name: 'sample_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '样本ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'sample_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '样本类型',
            },
            {
                name: 'collection_date',
                type: 'DATETIME',
                nullable: false,
                comment: '采集日期',
            },
            {
                name: 'storage_location',
                type: 'VARCHAR',
                length: 100,
                nullable: true,
                comment: '存储位置',
            },
        ],
    },
    research_result: {
        name: 'research_result',
        schema: 'research_warehouse',
        comment: '研究结果表',
        rowCount: 1234,
        fields: [
            {
                name: 'result_id',
                type: 'BIGINT',
                nullable: false,
                comment: '结果ID',
                primaryKey: true,
            },
            {
                name: 'project_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '项目ID',
            },
            {
                name: 'result_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '结果类型',
            },
            {
                name: 'result_content',
                type: 'TEXT',
                nullable: true,
                comment: '结果内容',
            },
            {
                name: 'publish_date',
                type: 'DATE',
                nullable: true,
                comment: '发布日期',
            },
        ],
    },
    medical_record: {
        name: 'medical_record',
        schema: 'emr_system',
        comment: '病历表',
        rowCount: 345678,
        fields: [
            {
                name: 'record_id',
                type: 'BIGINT',
                nullable: false,
                comment: '病历ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'record_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '病历类型',
            },
            {
                name: 'record_content',
                type: 'TEXT',
                nullable: false,
                comment: '病历内容',
            },
            {
                name: 'create_date',
                type: 'DATETIME',
                nullable: false,
                comment: '创建日期',
            },
        ],
    },
    progress_note: {
        name: 'progress_note',
        schema: 'emr_system',
        comment: '病程记录表',
        rowCount: 567890,
        fields: [
            {
                name: 'note_id',
                type: 'BIGINT',
                nullable: false,
                comment: '记录ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'note_date',
                type: 'DATETIME',
                nullable: false,
                comment: '记录日期',
            },
            {
                name: 'note_content',
                type: 'TEXT',
                nullable: false,
                comment: '记录内容',
            },
            {
                name: 'doctor_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '医生ID',
            },
        ],
    },
    nursing_record: {
        name: 'nursing_record',
        schema: 'emr_system',
        comment: '护理记录表',
        rowCount: 1234567,
        fields: [
            {
                name: 'record_id',
                type: 'BIGINT',
                nullable: false,
                comment: '记录ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'record_date',
                type: 'DATETIME',
                nullable: false,
                comment: '记录日期',
            },
            {
                name: 'record_content',
                type: 'TEXT',
                nullable: false,
                comment: '记录内容',
            },
            {
                name: 'nurse_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '护士ID',
            },
        ],
    },
    surgery_record: {
        name: 'surgery_record',
        schema: 'emr_system',
        comment: '手术记录表',
        rowCount: 123456,
        fields: [
            {
                name: 'surgery_id',
                type: 'BIGINT',
                nullable: false,
                comment: '手术ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'surgery_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '手术名称',
            },
            {
                name: 'surgery_date',
                type: 'DATETIME',
                nullable: false,
                comment: '手术日期',
            },
            {
                name: 'surgeon',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '主刀医生',
            },
        ],
    },
    image_study: {
        name: 'image_study',
        schema: 'pacs_db',
        comment: '影像检查表',
        rowCount: 456789,
        fields: [
            {
                name: 'study_id',
                type: 'VARCHAR',
                length: 64,
                nullable: false,
                comment: '检查ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'study_date',
                type: 'DATETIME',
                nullable: false,
                comment: '检查日期',
            },
            {
                name: 'modality',
                type: 'VARCHAR',
                length: 10,
                nullable: false,
                comment: '检查设备：CT、MR、CR等',
            },
            {
                name: 'body_part',
                type: 'VARCHAR',
                length: 50,
                nullable: true,
                comment: '检查部位',
            },
        ],
    },
    image_series: {
        name: 'image_series',
        schema: 'pacs_db',
        comment: '影像序列表',
        rowCount: 1234567,
        fields: [
            {
                name: 'series_id',
                type: 'VARCHAR',
                length: 64,
                nullable: false,
                comment: '序列ID',
                primaryKey: true,
            },
            {
                name: 'study_id',
                type: 'VARCHAR',
                length: 64,
                nullable: false,
                comment: '检查ID',
            },
            {
                name: 'series_number',
                type: 'INT',
                nullable: false,
                comment: '序列号',
            },
            {
                name: 'series_description',
                type: 'VARCHAR',
                length: 200,
                nullable: true,
                comment: '序列描述',
            },
        ],
    },
    image_instance: {
        name: 'image_instance',
        schema: 'pacs_db',
        comment: '影像实例表',
        rowCount: 5678901,
        fields: [
            {
                name: 'instance_id',
                type: 'VARCHAR',
                length: 64,
                nullable: false,
                comment: '实例ID',
                primaryKey: true,
            },
            {
                name: 'series_id',
                type: 'VARCHAR',
                length: 64,
                nullable: false,
                comment: '序列ID',
            },
            {
                name: 'instance_number',
                type: 'INT',
                nullable: false,
                comment: '实例号',
            },
            {
                name: 'file_path',
                type: 'VARCHAR',
                length: 500,
                nullable: false,
                comment: '文件路径',
            },
        ],
    },
    radiology_report: {
        name: 'radiology_report',
        schema: 'pacs_db',
        comment: '影像报告表',
        rowCount: 456789,
        fields: [
            {
                name: 'report_id',
                type: 'BIGINT',
                nullable: false,
                comment: '报告ID',
                primaryKey: true,
            },
            {
                name: 'study_id',
                type: 'VARCHAR',
                length: 64,
                nullable: false,
                comment: '检查ID',
            },
            {
                name: 'report_content',
                type: 'TEXT',
                nullable: true,
                comment: '报告内容',
            },
            {
                name: 'report_date',
                type: 'DATETIME',
                nullable: false,
                comment: '报告日期',
            },
            {
                name: 'radiologist',
                type: 'VARCHAR',
                length: 50,
                nullable: true,
                comment: '报告医生',
            },
        ],
    },
    test_request: {
        name: 'test_request',
        schema: 'lis_system',
        comment: '检验申请表',
        rowCount: 1234567,
        fields: [
            {
                name: 'request_id',
                type: 'BIGINT',
                nullable: false,
                comment: '申请ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'request_date',
                type: 'DATETIME',
                nullable: false,
                comment: '申请日期',
            },
            {
                name: 'test_items',
                type: 'TEXT',
                nullable: false,
                comment: '检验项目',
            },
            {
                name: 'doctor_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '申请医生ID',
            },
        ],
    },
    specimen_info: {
        name: 'specimen_info',
        schema: 'lis_system',
        comment: '标本信息表',
        rowCount: 1234567,
        fields: [
            {
                name: 'specimen_id',
                type: 'BIGINT',
                nullable: false,
                comment: '标本ID',
                primaryKey: true,
            },
            {
                name: 'request_id',
                type: 'BIGINT',
                nullable: false,
                comment: '申请ID',
            },
            {
                name: 'specimen_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '标本类型：血液、尿液、粪便等',
            },
            {
                name: 'collection_date',
                type: 'DATETIME',
                nullable: false,
                comment: '采集日期',
            },
            {
                name: 'collection_method',
                type: 'VARCHAR',
                length: 50,
                nullable: true,
                comment: '采集方法',
            },
        ],
    },
    test_result: {
        name: 'test_result',
        schema: 'lis_system',
        comment: '检验结果表',
        rowCount: 5678901,
        fields: [
            {
                name: 'result_id',
                type: 'BIGINT',
                nullable: false,
                comment: '结果ID',
                primaryKey: true,
            },
            {
                name: 'specimen_id',
                type: 'BIGINT',
                nullable: false,
                comment: '标本ID',
            },
            {
                name: 'test_item',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '检验项目',
            },
            {
                name: 'test_value',
                type: 'VARCHAR',
                length: 100,
                nullable: true,
                comment: '检验值',
            },
            {
                name: 'result_date',
                type: 'DATETIME',
                nullable: false,
                comment: '结果日期',
            },
        ],
    },
    quality_control: {
        name: 'quality_control',
        schema: 'lis_system',
        comment: '质控数据表',
        rowCount: 123456,
        fields: [
            {
                name: 'qc_id',
                type: 'BIGINT',
                nullable: false,
                comment: '质控ID',
                primaryKey: true,
            },
            {
                name: 'test_item',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '检验项目',
            },
            {
                name: 'qc_date',
                type: 'DATETIME',
                nullable: false,
                comment: '质控日期',
            },
            {
                name: 'qc_value',
                type: 'DECIMAL',
                length: 10,
                nullable: false,
                comment: '质控值',
            },
            {
                name: 'qc_status',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '质控状态：正常、异常',
            },
        ],
    },
    patient_family_history: {
        name: 'patient_family_history',
        schema: 'hospital_his',
        comment: '患者家族史表',
        rowCount: 67890,
        fields: [
            {
                name: 'history_id',
                type: 'BIGINT',
                nullable: false,
                comment: '家族史ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'relation',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '亲属关系：父亲、母亲、兄弟姐妹等',
            },
            {
                name: 'disease_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '疾病名称',
            },
            {
                name: 'disease_code',
                type: 'VARCHAR',
                length: 20,
                nullable: true,
                comment: '疾病编码（ICD-10）',
            },
            {
                name: 'record_date',
                type: 'DATETIME',
                nullable: false,
                comment: '记录日期',
            },
        ],
    },
    outpatient_visit: {
        name: 'outpatient_visit',
        schema: 'hospital_his',
        comment: '门诊就诊记录表',
        rowCount: 2345678,
        fields: [
            {
                name: 'visit_id',
                type: 'BIGINT',
                nullable: false,
                comment: '就诊ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'visit_date',
                type: 'DATETIME',
                nullable: false,
                comment: '就诊日期',
            },
            {
                name: 'department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '就诊科室',
            },
            {
                name: 'doctor_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '医生ID',
            },
            {
                name: 'visit_type',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '就诊类型：初诊、复诊',
            },
            {
                name: 'chief_complaint',
                type: 'VARCHAR',
                length: 500,
                nullable: true,
                comment: '主诉',
            },
        ],
    },
    nursing_plan: {
        name: 'nursing_plan',
        schema: 'hospital_his',
        comment: '护理计划表',
        rowCount: 345678,
        fields: [
            {
                name: 'plan_id',
                type: 'BIGINT',
                nullable: false,
                comment: '计划ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'admission_id',
                type: 'BIGINT',
                nullable: false,
                comment: '入院ID',
            },
            {
                name: 'nursing_diagnosis',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '护理诊断',
            },
            {
                name: 'nursing_goal',
                type: 'TEXT',
                nullable: true,
                comment: '护理目标',
            },
            {
                name: 'nursing_measures',
                type: 'TEXT',
                nullable: true,
                comment: '护理措施',
            },
            {
                name: 'create_date',
                type: 'DATETIME',
                nullable: false,
                comment: '创建日期',
            },
        ],
    },
    vital_signs: {
        name: 'vital_signs',
        schema: 'research_warehouse',
        comment: '生命体征监测表',
        rowCount: 4567890,
        fields: [
            {
                name: 'record_id',
                type: 'BIGINT',
                nullable: false,
                comment: '记录ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'measure_time',
                type: 'DATETIME',
                nullable: false,
                comment: '测量时间',
            },
            {
                name: 'temperature',
                type: 'DECIMAL',
                length: 4,
                nullable: true,
                comment: '体温（℃）',
            },
            {
                name: 'pulse',
                type: 'INT',
                nullable: true,
                comment: '脉搏（次/分）',
            },
            {
                name: 'respiration',
                type: 'INT',
                nullable: true,
                comment: '呼吸（次/分）',
            },
            {
                name: 'blood_pressure_systolic',
                type: 'INT',
                nullable: true,
                comment: '收缩压（mmHg）',
            },
            {
                name: 'blood_pressure_diastolic',
                type: 'INT',
                nullable: true,
                comment: '舒张压（mmHg）',
            },
            {
                name: 'oxygen_saturation',
                type: 'DECIMAL',
                length: 4,
                nullable: true,
                comment: '血氧饱和度（%）',
            },
        ],
    },
    ethics_approval: {
        name: 'ethics_approval',
        schema: 'research_warehouse',
        comment: '伦理审批记录表',
        rowCount: 1234,
        fields: [
            {
                name: 'approval_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '审批ID',
                primaryKey: true,
            },
            {
                name: 'project_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '项目ID',
            },
            {
                name: 'approval_number',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '审批编号',
            },
            {
                name: 'approval_date',
                type: 'DATE',
                nullable: false,
                comment: '审批日期',
            },
            {
                name: 'approval_status',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '审批状态：已通过、待审批、已拒绝',
            },
            {
                name: 'expiry_date',
                type: 'DATE',
                nullable: true,
                comment: '有效期至',
            },
        ],
    },
    consultation_record: {
        name: 'consultation_record',
        schema: 'emr_system',
        comment: '会诊记录表',
        rowCount: 123456,
        fields: [
            {
                name: 'consultation_id',
                type: 'BIGINT',
                nullable: false,
                comment: '会诊ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'request_department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '申请科室',
            },
            {
                name: 'consultation_department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '会诊科室',
            },
            {
                name: 'consultation_date',
                type: 'DATETIME',
                nullable: false,
                comment: '会诊日期',
            },
            {
                name: 'consultation_opinion',
                type: 'TEXT',
                nullable: true,
                comment: '会诊意见',
            },
            {
                name: 'consultant_doctor',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '会诊医生',
            },
        ],
    },
    image_annotation: {
        name: 'image_annotation',
        schema: 'pacs_db',
        comment: '影像标注表',
        rowCount: 234567,
        fields: [
            {
                name: 'annotation_id',
                type: 'BIGINT',
                nullable: false,
                comment: '标注ID',
                primaryKey: true,
            },
            {
                name: 'study_id',
                type: 'VARCHAR',
                length: 64,
                nullable: false,
                comment: '检查ID',
            },
            {
                name: 'series_id',
                type: 'VARCHAR',
                length: 64,
                nullable: false,
                comment: '序列ID',
            },
            {
                name: 'annotation_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '标注类型：测量、标记、ROI等',
            },
            {
                name: 'annotation_data',
                type: 'TEXT',
                nullable: true,
                comment: '标注数据（JSON格式）',
            },
            {
                name: 'annotator',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '标注人',
            },
            {
                name: 'annotation_date',
                type: 'DATETIME',
                nullable: false,
                comment: '标注日期',
            },
        ],
    },
    instrument_data: {
        name: 'instrument_data',
        schema: 'lis_system',
        comment: '检验仪器数据表',
        rowCount: 2345678,
        fields: [
            {
                name: 'data_id',
                type: 'BIGINT',
                nullable: false,
                comment: '数据ID',
                primaryKey: true,
            },
            {
                name: 'specimen_id',
                type: 'BIGINT',
                nullable: false,
                comment: '标本ID',
            },
            {
                name: 'instrument_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '仪器ID',
            },
            {
                name: 'test_item',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '检验项目',
            },
            {
                name: 'raw_value',
                type: 'VARCHAR',
                length: 200,
                nullable: true,
                comment: '原始值',
            },
            {
                name: 'test_time',
                type: 'DATETIME',
                nullable: false,
                comment: '检验时间',
            },
        ],
    },
    surgery_schedule: {
        name: 'surgery_schedule',
        schema: 'anesthesia_system',
        comment: '手术安排表',
        rowCount: 123456,
        fields: [
            {
                name: 'schedule_id',
                type: 'BIGINT',
                nullable: false,
                comment: '安排ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'surgery_date',
                type: 'DATETIME',
                nullable: false,
                comment: '手术日期',
            },
            {
                name: 'surgery_room',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '手术室',
            },
            {
                name: 'surgery_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '手术名称',
            },
            {
                name: 'surgeon',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '主刀医生',
            },
            {
                name: 'anesthesiologist',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '麻醉医生',
            },
            {
                name: 'surgery_status',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '手术状态：已安排、进行中、已完成、已取消',
            },
        ],
    },
    anesthesia_plan: {
        name: 'anesthesia_plan',
        schema: 'anesthesia_system',
        comment: '麻醉方案表',
        rowCount: 123456,
        fields: [
            {
                name: 'plan_id',
                type: 'BIGINT',
                nullable: false,
                comment: '方案ID',
                primaryKey: true,
            },
            {
                name: 'schedule_id',
                type: 'BIGINT',
                nullable: false,
                comment: '手术安排ID',
            },
            {
                name: 'anesthesia_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '麻醉方式：全麻、局麻、腰麻等',
            },
            {
                name: 'anesthesia_drugs',
                type: 'TEXT',
                nullable: true,
                comment: '麻醉药物',
            },
            {
                name: 'risk_assessment',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '风险评估：低、中、高',
            },
            {
                name: 'create_date',
                type: 'DATETIME',
                nullable: false,
                comment: '创建日期',
            },
        ],
    },
    monitoring_data: {
        name: 'monitoring_data',
        schema: 'anesthesia_system',
        comment: '术中监测数据表',
        rowCount: 4567890,
        fields: [
            {
                name: 'monitor_id',
                type: 'BIGINT',
                nullable: false,
                comment: '监测ID',
                primaryKey: true,
            },
            {
                name: 'schedule_id',
                type: 'BIGINT',
                nullable: false,
                comment: '手术安排ID',
            },
            {
                name: 'monitor_time',
                type: 'DATETIME',
                nullable: false,
                comment: '监测时间',
            },
            {
                name: 'heart_rate',
                type: 'INT',
                nullable: true,
                comment: '心率（次/分）',
            },
            {
                name: 'blood_pressure',
                type: 'VARCHAR',
                length: 20,
                nullable: true,
                comment: '血压（mmHg）',
            },
            {
                name: 'spo2',
                type: 'DECIMAL',
                length: 4,
                nullable: true,
                comment: '血氧饱和度（%）',
            },
            {
                name: 'etco2',
                type: 'DECIMAL',
                length: 4,
                nullable: true,
                comment: '呼气末二氧化碳（mmHg）',
            },
        ],
    },
    recovery_record: {
        name: 'recovery_record',
        schema: 'anesthesia_system',
        comment: '术后恢复记录表',
        rowCount: 123456,
        fields: [
            {
                name: 'recovery_id',
                type: 'BIGINT',
                nullable: false,
                comment: '恢复ID',
                primaryKey: true,
            },
            {
                name: 'schedule_id',
                type: 'BIGINT',
                nullable: false,
                comment: '手术安排ID',
            },
            {
                name: 'recovery_time',
                type: 'DATETIME',
                nullable: false,
                comment: '恢复时间',
            },
            {
                name: 'recovery_status',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '恢复状态：清醒、恢复中、异常',
            },
            {
                name: 'pain_score',
                type: 'INT',
                nullable: true,
                comment: '疼痛评分（0-10）',
            },
            {
                name: 'nurse_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '护士ID',
            },
        ],
    },
    drug_inventory: {
        name: 'drug_inventory',
        schema: 'pharmacy_system',
        comment: '药品库存表',
        rowCount: 45678,
        fields: [
            {
                name: 'inventory_id',
                type: 'BIGINT',
                nullable: false,
                comment: '库存ID',
                primaryKey: true,
            },
            {
                name: 'drug_code',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '药品编码',
            },
            {
                name: 'drug_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '药品名称',
            },
            {
                name: 'batch_number',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '批号',
            },
            {
                name: 'quantity',
                type: 'DECIMAL',
                length: 10,
                nullable: false,
                comment: '库存数量',
            },
            {
                name: 'unit',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '单位',
            },
            {
                name: 'expiry_date',
                type: 'DATE',
                nullable: false,
                comment: '有效期至',
            },
            {
                name: 'storage_location',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '存储位置',
            },
        ],
    },
    prescription_audit: {
        name: 'prescription_audit',
        schema: 'pharmacy_system',
        comment: '处方审核记录表',
        rowCount: 1234567,
        fields: [
            {
                name: 'audit_id',
                type: 'BIGINT',
                nullable: false,
                comment: '审核ID',
                primaryKey: true,
            },
            {
                name: 'prescription_id',
                type: 'BIGINT',
                nullable: false,
                comment: '处方ID',
            },
            {
                name: 'auditor_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '审核人ID',
            },
            {
                name: 'audit_result',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '审核结果：通过、拒绝、待复核',
            },
            {
                name: 'audit_opinion',
                type: 'TEXT',
                nullable: true,
                comment: '审核意见',
            },
            {
                name: 'audit_date',
                type: 'DATETIME',
                nullable: false,
                comment: '审核日期',
            },
        ],
    },
    drug_dispensing: {
        name: 'drug_dispensing',
        schema: 'pharmacy_system',
        comment: '药品配送表',
        rowCount: 2345678,
        fields: [
            {
                name: 'dispensing_id',
                type: 'BIGINT',
                nullable: false,
                comment: '配送ID',
                primaryKey: true,
            },
            {
                name: 'prescription_id',
                type: 'BIGINT',
                nullable: false,
                comment: '处方ID',
            },
            {
                name: 'drug_code',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '药品编码',
            },
            {
                name: 'quantity',
                type: 'DECIMAL',
                length: 10,
                nullable: false,
                comment: '配送数量',
            },
            {
                name: 'dispensing_date',
                type: 'DATETIME',
                nullable: false,
                comment: '配送日期',
            },
            {
                name: 'dispenser_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '配送人ID',
            },
        ],
    },
    adverse_reaction: {
        name: 'adverse_reaction',
        schema: 'pharmacy_system',
        comment: '药品不良反应记录表',
        rowCount: 12345,
        fields: [
            {
                name: 'reaction_id',
                type: 'BIGINT',
                nullable: false,
                comment: '反应ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'drug_code',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '药品编码',
            },
            {
                name: 'reaction_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '反应类型',
            },
            {
                name: 'severity',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '严重程度：轻度、中度、重度',
            },
            {
                name: 'occurrence_date',
                type: 'DATETIME',
                nullable: false,
                comment: '发生日期',
            },
            {
                name: 'report_date',
                type: 'DATETIME',
                nullable: false,
                comment: '报告日期',
            },
        ],
    },
    pathology_request: {
        name: 'pathology_request',
        schema: 'pathology_system',
        comment: '病理检查申请表',
        rowCount: 123456,
        fields: [
            {
                name: 'request_id',
                type: 'BIGINT',
                nullable: false,
                comment: '申请ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'request_date',
                type: 'DATETIME',
                nullable: false,
                comment: '申请日期',
            },
            {
                name: 'specimen_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '标本类型',
            },
            {
                name: 'clinical_diagnosis',
                type: 'VARCHAR',
                length: 200,
                nullable: true,
                comment: '临床诊断',
            },
        ],
    },
    immunohistochemistry: {
        name: 'immunohistochemistry',
        schema: 'pathology_system',
        comment: '免疫组化结果表',
        rowCount: 45678,
        fields: [
            {
                name: 'ihc_id',
                type: 'BIGINT',
                nullable: false,
                comment: '免疫组化ID',
                primaryKey: true,
            },
            {
                name: 'pathology_report_id',
                type: 'BIGINT',
                nullable: false,
                comment: '病理报告ID',
            },
            {
                name: 'marker_name',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '标记物名称',
            },
            {
                name: 'result',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '结果：阳性、阴性、弱阳性',
            },
            {
                name: 'test_date',
                type: 'DATETIME',
                nullable: false,
                comment: '检测日期',
            },
        ],
    },
    molecular_pathology: {
        name: 'molecular_pathology',
        schema: 'pathology_system',
        comment: '分子病理检测表',
        rowCount: 23456,
        fields: [
            {
                name: 'molecular_id',
                type: 'BIGINT',
                nullable: false,
                comment: '分子检测ID',
                primaryKey: true,
            },
            {
                name: 'pathology_report_id',
                type: 'BIGINT',
                nullable: false,
                comment: '病理报告ID',
            },
            {
                name: 'test_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '检测类型：基因突变、FISH、PCR等',
            },
            {
                name: 'test_result',
                type: 'TEXT',
                nullable: true,
                comment: '检测结果',
            },
            {
                name: 'test_date',
                type: 'DATETIME',
                nullable: false,
                comment: '检测日期',
            },
        ],
    },
    blood_request: {
        name: 'blood_request',
        schema: 'blood_transfusion',
        comment: '血液申请表',
        rowCount: 45678,
        fields: [
            {
                name: 'request_id',
                type: 'BIGINT',
                nullable: false,
                comment: '申请ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'blood_type',
                type: 'VARCHAR',
                length: 10,
                nullable: false,
                comment: '血型：A、B、AB、O',
            },
            {
                name: 'rh_type',
                type: 'VARCHAR',
                length: 5,
                nullable: false,
                comment: 'Rh血型：阳性、阴性',
            },
            {
                name: 'request_date',
                type: 'DATETIME',
                nullable: false,
                comment: '申请日期',
            },
            {
                name: 'blood_component',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '血液成分：全血、红细胞、血小板等',
            },
        ],
    },
    blood_matching: {
        name: 'blood_matching',
        schema: 'blood_transfusion',
        comment: '配血结果表',
        rowCount: 45678,
        fields: [
            {
                name: 'matching_id',
                type: 'BIGINT',
                nullable: false,
                comment: '配血ID',
                primaryKey: true,
            },
            {
                name: 'request_id',
                type: 'BIGINT',
                nullable: false,
                comment: '申请ID',
            },
            {
                name: 'matching_result',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '配血结果：相合、不相合',
            },
            {
                name: 'matching_date',
                type: 'DATETIME',
                nullable: false,
                comment: '配血日期',
            },
            {
                name: 'technician',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '配血技师',
            },
        ],
    },
    transfusion_record: {
        name: 'transfusion_record',
        schema: 'blood_transfusion',
        comment: '输血记录表',
        rowCount: 45678,
        fields: [
            {
                name: 'transfusion_id',
                type: 'BIGINT',
                nullable: false,
                comment: '输血ID',
                primaryKey: true,
            },
            {
                name: 'request_id',
                type: 'BIGINT',
                nullable: false,
                comment: '申请ID',
            },
            {
                name: 'transfusion_date',
                type: 'DATETIME',
                nullable: false,
                comment: '输血日期',
            },
            {
                name: 'blood_unit_number',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '血袋编号',
            },
            {
                name: 'transfusion_amount',
                type: 'DECIMAL',
                length: 10,
                nullable: false,
                comment: '输血量（ml）',
            },
            {
                name: 'nurse_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '护士ID',
            },
        ],
    },
    blood_inventory: {
        name: 'blood_inventory',
        schema: 'blood_transfusion',
        comment: '血液库存表',
        rowCount: 5678,
        fields: [
            {
                name: 'inventory_id',
                type: 'BIGINT',
                nullable: false,
                comment: '库存ID',
                primaryKey: true,
            },
            {
                name: 'blood_type',
                type: 'VARCHAR',
                length: 10,
                nullable: false,
                comment: '血型',
            },
            {
                name: 'rh_type',
                type: 'VARCHAR',
                length: 5,
                nullable: false,
                comment: 'Rh血型',
            },
            {
                name: 'blood_component',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '血液成分',
            },
            {
                name: 'quantity',
                type: 'INT',
                nullable: false,
                comment: '库存数量（单位）',
            },
            {
                name: 'expiry_date',
                type: 'DATE',
                nullable: false,
                comment: '有效期至',
            },
        ],
    },
    exam_appointment: {
        name: 'exam_appointment',
        schema: 'health_examination',
        comment: '体检预约表',
        rowCount: 234567,
        fields: [
            {
                name: 'appointment_id',
                type: 'BIGINT',
                nullable: false,
                comment: '预约ID',
                primaryKey: true,
            },
            {
                name: 'patient_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '患者ID',
            },
            {
                name: 'appointment_date',
                type: 'DATETIME',
                nullable: false,
                comment: '预约日期',
            },
            {
                name: 'package_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '体检套餐类型',
            },
            {
                name: 'status',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '预约状态：已预约、已完成、已取消',
            },
        ],
    },
    exam_item: {
        name: 'exam_item',
        schema: 'health_examination',
        comment: '体检项目表',
        rowCount: 1234567,
        fields: [
            {
                name: 'item_id',
                type: 'BIGINT',
                nullable: false,
                comment: '项目ID',
                primaryKey: true,
            },
            {
                name: 'appointment_id',
                type: 'BIGINT',
                nullable: false,
                comment: '预约ID',
            },
            {
                name: 'item_name',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '项目名称',
            },
            {
                name: 'item_result',
                type: 'VARCHAR',
                length: 200,
                nullable: true,
                comment: '项目结果',
            },
            {
                name: 'exam_date',
                type: 'DATETIME',
                nullable: false,
                comment: '检查日期',
            },
        ],
    },
    health_assessment: {
        name: 'health_assessment',
        schema: 'health_examination',
        comment: '健康评估表',
        rowCount: 234567,
        fields: [
            {
                name: 'assessment_id',
                type: 'BIGINT',
                nullable: false,
                comment: '评估ID',
                primaryKey: true,
            },
            {
                name: 'appointment_id',
                type: 'BIGINT',
                nullable: false,
                comment: '预约ID',
            },
            {
                name: 'overall_health',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '总体健康状况：良好、一般、需关注',
            },
            {
                name: 'risk_factors',
                type: 'TEXT',
                nullable: true,
                comment: '风险因素',
            },
            {
                name: 'recommendations',
                type: 'TEXT',
                nullable: true,
                comment: '健康建议',
            },
            {
                name: 'assessment_date',
                type: 'DATETIME',
                nullable: false,
                comment: '评估日期',
            },
        ],
    },
    follow_up_plan: {
        name: 'follow_up_plan',
        schema: 'health_examination',
        comment: '随访计划表',
        rowCount: 123456,
        fields: [
            {
                name: 'plan_id',
                type: 'BIGINT',
                nullable: false,
                comment: '计划ID',
                primaryKey: true,
            },
            {
                name: 'appointment_id',
                type: 'BIGINT',
                nullable: false,
                comment: '预约ID',
            },
            {
                name: 'follow_up_date',
                type: 'DATE',
                nullable: false,
                comment: '随访日期',
            },
            {
                name: 'follow_up_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '随访类型：电话、门诊、复查',
            },
            {
                name: 'plan_content',
                type: 'TEXT',
                nullable: true,
                comment: '随访内容',
            },
        ],
    },
    revenue_record: {
        name: 'revenue_record',
        schema: 'finance_system',
        comment: '收入记录表',
        rowCount: 3456789,
        fields: [
            {
                name: 'revenue_id',
                type: 'BIGINT',
                nullable: false,
                comment: '收入ID',
                primaryKey: true,
            },
            {
                name: 'revenue_date',
                type: 'DATE',
                nullable: false,
                comment: '收入日期',
            },
            {
                name: 'revenue_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '收入类型：门诊收入、住院收入、其他',
            },
            {
                name: 'amount',
                type: 'DECIMAL',
                length: 12,
                nullable: false,
                comment: '收入金额',
            },
            {
                name: 'department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '科室',
            },
        ],
    },
    expense_record: {
        name: 'expense_record',
        schema: 'finance_system',
        comment: '支出记录表',
        rowCount: 2345678,
        fields: [
            {
                name: 'expense_id',
                type: 'BIGINT',
                nullable: false,
                comment: '支出ID',
                primaryKey: true,
            },
            {
                name: 'expense_date',
                type: 'DATE',
                nullable: false,
                comment: '支出日期',
            },
            {
                name: 'expense_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '支出类型：人员成本、设备采购、药品采购等',
            },
            {
                name: 'amount',
                type: 'DECIMAL',
                length: 12,
                nullable: false,
                comment: '支出金额',
            },
            {
                name: 'department',
                type: 'VARCHAR',
                length: 50,
                nullable: true,
                comment: '科室',
            },
        ],
    },
    cost_accounting: {
        name: 'cost_accounting',
        schema: 'finance_system',
        comment: '成本核算表',
        rowCount: 123456,
        fields: [
            {
                name: 'accounting_id',
                type: 'BIGINT',
                nullable: false,
                comment: '核算ID',
                primaryKey: true,
            },
            {
                name: 'accounting_period',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '核算期间：2024-01',
            },
            {
                name: 'department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '科室',
            },
            {
                name: 'total_cost',
                type: 'DECIMAL',
                length: 12,
                nullable: false,
                comment: '总成本',
            },
            {
                name: 'cost_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '成本类型：直接成本、间接成本',
            },
        ],
    },
    financial_report: {
        name: 'financial_report',
        schema: 'finance_system',
        comment: '财务报表表',
        rowCount: 1234,
        fields: [
            {
                name: 'report_id',
                type: 'BIGINT',
                nullable: false,
                comment: '报告ID',
                primaryKey: true,
            },
            {
                name: 'report_period',
                type: 'VARCHAR',
                length: 20,
                nullable: false,
                comment: '报告期间',
            },
            {
                name: 'report_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '报告类型：资产负债表、损益表、现金流量表',
            },
            {
                name: 'total_revenue',
                type: 'DECIMAL',
                length: 12,
                nullable: false,
                comment: '总收入',
            },
            {
                name: 'total_expense',
                type: 'DECIMAL',
                length: 12,
                nullable: false,
                comment: '总支出',
            },
            {
                name: 'net_profit',
                type: 'DECIMAL',
                length: 12,
                nullable: false,
                comment: '净利润',
            },
        ],
    },
    budget_plan: {
        name: 'budget_plan',
        schema: 'finance_system',
        comment: '预算计划表',
        rowCount: 5678,
        fields: [
            {
                name: 'budget_id',
                type: 'BIGINT',
                nullable: false,
                comment: '预算ID',
                primaryKey: true,
            },
            {
                name: 'budget_year',
                type: 'INT',
                nullable: false,
                comment: '预算年度',
            },
            {
                name: 'department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '科室',
            },
            {
                name: 'budget_amount',
                type: 'DECIMAL',
                length: 12,
                nullable: false,
                comment: '预算金额',
            },
            {
                name: 'budget_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '预算类型：人员、设备、药品等',
            },
        ],
    },
    equipment_info: {
        name: 'equipment_info',
        schema: 'equipment_management',
        comment: '设备信息表',
        rowCount: 12345,
        fields: [
            {
                name: 'equipment_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '设备ID',
                primaryKey: true,
            },
            {
                name: 'equipment_name',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '设备名称',
            },
            {
                name: 'equipment_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '设备类型：CT、MRI、超声等',
            },
            {
                name: 'manufacturer',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '生产厂家',
            },
            {
                name: 'model',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '型号',
            },
            {
                name: 'purchase_date',
                type: 'DATE',
                nullable: false,
                comment: '采购日期',
            },
            {
                name: 'department',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '所属科室',
            },
        ],
    },
    equipment_procurement: {
        name: 'equipment_procurement',
        schema: 'equipment_management',
        comment: '设备采购表',
        rowCount: 2345,
        fields: [
            {
                name: 'procurement_id',
                type: 'BIGINT',
                nullable: false,
                comment: '采购ID',
                primaryKey: true,
            },
            {
                name: 'equipment_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '设备ID',
            },
            {
                name: 'procurement_date',
                type: 'DATE',
                nullable: false,
                comment: '采购日期',
            },
            {
                name: 'procurement_amount',
                type: 'DECIMAL',
                length: 12,
                nullable: false,
                comment: '采购金额',
            },
            {
                name: 'supplier',
                type: 'VARCHAR',
                length: 100,
                nullable: false,
                comment: '供应商',
            },
        ],
    },
    equipment_maintenance: {
        name: 'equipment_maintenance',
        schema: 'equipment_management',
        comment: '设备维护表',
        rowCount: 34567,
        fields: [
            {
                name: 'maintenance_id',
                type: 'BIGINT',
                nullable: false,
                comment: '维护ID',
                primaryKey: true,
            },
            {
                name: 'equipment_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '设备ID',
            },
            {
                name: 'maintenance_type',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '维护类型：日常保养、故障维修、定期检修',
            },
            {
                name: 'maintenance_date',
                type: 'DATETIME',
                nullable: false,
                comment: '维护日期',
            },
            {
                name: 'maintenance_cost',
                type: 'DECIMAL',
                length: 10,
                nullable: true,
                comment: '维护费用',
            },
            {
                name: 'maintenance_company',
                type: 'VARCHAR',
                length: 100,
                nullable: true,
                comment: '维护公司',
            },
        ],
    },
    equipment_usage: {
        name: 'equipment_usage',
        schema: 'equipment_management',
        comment: '设备使用记录表',
        rowCount: 456789,
        fields: [
            {
                name: 'usage_id',
                type: 'BIGINT',
                nullable: false,
                comment: '使用ID',
                primaryKey: true,
            },
            {
                name: 'equipment_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '设备ID',
            },
            {
                name: 'usage_date',
                type: 'DATETIME',
                nullable: false,
                comment: '使用日期',
            },
            {
                name: 'usage_duration',
                type: 'INT',
                nullable: false,
                comment: '使用时长（分钟）',
            },
            {
                name: 'operator',
                type: 'VARCHAR',
                length: 50,
                nullable: false,
                comment: '操作人员',
            },
            {
                name: 'patient_count',
                type: 'INT',
                nullable: false,
                comment: '检查患者数',
            },
        ],
    },
    equipment_scrap: {
        name: 'equipment_scrap',
        schema: 'equipment_management',
        comment: '设备报废表',
        rowCount: 234,
        fields: [
            {
                name: 'scrap_id',
                type: 'BIGINT',
                nullable: false,
                comment: '报废ID',
                primaryKey: true,
            },
            {
                name: 'equipment_id',
                type: 'VARCHAR',
                length: 32,
                nullable: false,
                comment: '设备ID',
            },
            {
                name: 'scrap_date',
                type: 'DATE',
                nullable: false,
                comment: '报废日期',
            },
            {
                name: 'scrap_reason',
                type: 'VARCHAR',
                length: 200,
                nullable: false,
                comment: '报废原因',
            },
            {
                name: 'scrap_amount',
                type: 'DECIMAL',
                length: 10,
                nullable: true,
                comment: '残值',
            },
        ],
    },
}

// 视图状态类型
type ViewMode = 'empty' | 'category' | 'tableFields'

const DataAssetManagement: React.FC = () => {
    const [dataSources, setDataSources] = useState<DataSource[]>(mockDataSources)
    const [categories, setCategories] = useState<AssetCategory[]>(mockCategories)
    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
    const [searchText, setSearchText] = useState('')
    const [addAssetModalVisible, setAddAssetModalVisible] = useState(false)
    const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false)
    const [editingAsset, setEditingAsset] = useState<DataSource | null>(null)
    const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null)
    const [selectedNode, setSelectedNode] = useState<ExtendedDataNode | null>(null)
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>('')
    const [selectedDatabase, setSelectedDatabase] = useState<string>('')
    const [form] = Form.useForm()
    const [categoryForm] = Form.useForm()
    // 视图状态管理
    const [viewMode, setViewMode] = useState<ViewMode>('empty')
    const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null)
    const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [tableList, setTableList] = useState<Array<{
        key: string
        name: string
        schema: string
        comment: string
        rowCount: string | number
        fieldCount: number
        createTime: string
        updateTime: string | null
        tableType: string
        engine: string
    }>>([])
    const [contentLoading, setContentLoading] = useState(false) // 查看表和查看字段公用一个loading
    const [databaseOptions, setDatabaseOptions] = useState<DatabaseOption[]>([])
    const [databaseOptionsLoading, setDatabaseOptionsLoading] = useState(false)
    const [tableInfoList, setTableInfoList] = useState<TableInfoItem[]>([])
    const [tableInfoLoading, setTableInfoLoading] = useState(false)
    const [columnDetailsData, setColumnDetailsData] = useState<{
        schema: string
        size: string
        tableName: string
        fields: Array<{
            name: string
            type: string
            nullable: boolean
            default: string | null
            comment: string
        }>
    } | null>(null)

    const debouncedSearchText = useDebounce(searchText, 300)

    // 模拟数据：每个数据源下的数据库列表
    const getDatabasesByDataSource = useCallback((dataSourceId: string): string[] => {
        const dataSource = dataSources.find(ds => ds.id === dataSourceId)
        if (!dataSource) return []
        
        // 根据数据源返回可用的数据库列表
        // 支持多种ID格式：'ds1', '1', '7' 等
        const databaseMap: Record<string, string[]> = {
            'ds1': ['hospital_his', 'hospital_emr', 'hospital_pacs', 'hospital_archive'],
            '1': ['hospital_his', 'hospital_emr', 'hospital_pacs', 'hospital_archive'],
            'ds2': ['research_warehouse', 'research_archive', 'research_temp', 'research_analysis'],
            '2': ['research_warehouse', 'research_archive', 'research_temp', 'research_analysis'],
            'ds3': ['emr_system', 'emr_backup', 'emr_archive'],
            '3': ['emr_system', 'emr_backup', 'emr_archive'],
            'ds4': ['pacs_db', 'pacs_archive', 'pacs_backup'],
            '4': ['pacs_db', 'pacs_archive', 'pacs_backup'],
            'ds5': ['lis_system', 'lis_backup', 'lis_archive'],
            '5': ['lis_system', 'lis_backup', 'lis_archive'],
            'ds6': ['anesthesia_system', 'anesthesia_backup'],
            '6': ['anesthesia_system', 'anesthesia_backup'],
            'ds7': ['pharmacy_system', 'pharmacy_backup', 'pharmacy_archive'],
            '7': ['pharmacy_system', 'pharmacy_backup', 'pharmacy_archive'],
            'ds8': ['pathology_system', 'pathology_backup', 'pathology_archive'],
            '8': ['pathology_system', 'pathology_backup', 'pathology_archive'],
            'ds9': ['blood_transfusion', 'blood_transfusion_backup'],
            '9': ['blood_transfusion', 'blood_transfusion_backup'],
            'ds10': ['health_examination', 'health_examination_backup', 'health_examination_archive'],
            '10': ['health_examination', 'health_examination_backup', 'health_examination_archive'],
            'ds11': ['finance_system', 'finance_backup', 'finance_archive'],
            '11': ['finance_system', 'finance_backup', 'finance_archive'],
            'ds12': ['equipment_management', 'equipment_backup'],
            '12': ['equipment_management', 'equipment_backup'],
        }
        
        // 优先使用精确匹配，如果没有则尝试提取数字部分匹配
        if (databaseMap[dataSourceId]) {
            return databaseMap[dataSourceId]
        }
        
        // 尝试提取数字部分进行匹配（处理 'ds1' -> '1' 的情况）
        const numericId = dataSourceId.replace(/[^0-9]/g, '')
        if (numericId && databaseMap[numericId]) {
            return databaseMap[numericId]
        }
        
        // 如果都没有匹配到，返回数据源的默认数据库
        return dataSource.database ? [dataSource.database] : []
    }, [dataSources])

    // 模拟数据：根据数据库获取表列表
    const getTablesByDatabase = (database: string): string[] => {
        // 返回该数据库下所有可用的表
        const allTables = Object.keys(mockTables)
        // 可以根据数据库名称过滤，这里简化处理，返回所有表
        return allTables
    }

    // 处理点击添加资产类别按钮/右键菜单
    const handleAddCategoryClick = useCallback((dataSource: DataSource) => {
        // 直接打开表单弹窗
        // 处理数据源ID匹配：需要找到对应的 databaseOptions 中的 ID
        let matchedDataSourceId = dataSource.id
        if (isDevVersion() && databaseOptions.length > 0) {
            // 开发版本：尝试在 databaseOptions 中匹配
            const directMatch = databaseOptions.find(db => db.id === dataSource.id)
            if (directMatch) {
                matchedDataSourceId = directMatch.id
            } else {
                // 尝试提取数字部分进行匹配（处理 "ds1" -> "1" 的情况）
                const numericId = dataSource.id.replace(/[^0-9]/g, '')
                if (numericId) {
                    const numericMatch = databaseOptions.find(db => db.id === numericId)
                    if (numericMatch) {
                        matchedDataSourceId = numericMatch.id
                    }
                }
            }
        }
        
        categoryForm.setFieldsValue({
            dataSourceId: matchedDataSourceId,
            tables: [],
        })
        setAddCategoryModalVisible(true)
    }, [categoryForm, dataSources, databaseOptions])

    /**
     * 将接口返回的资产树数据转换为页面需要的格式
     * @param treeNodes 接口返回的资产树节点数组
     * @returns 转换后的数据源和资产类别数组
     */
    const convertAssetTreeToPageData = useCallback((treeNodes: AssetTreeNode[]): {
        dataSources: DataSource[]
        categories: AssetCategory[]
    } => {
        const convertedDataSources: DataSource[] = []
        const convertedCategories: AssetCategory[] = []

        /**
         * 递归处理资产类别节点
         * @param categoryNode 资产类别节点
         * @param dataSourceId 数据源ID
         * @param categories 资产类别数组（用于收集结果）
         */
        const processCategoryNode = (
            categoryNode: AssetTreeNode,
            dataSourceId: string,
            categories: AssetCategory[]
        ) => {
            // 节点类型为 1 表示资产类别
            if (categoryNode.nodeType === 1) {
                const category: AssetCategory = {
                    id: categoryNode.id,
                    name: categoryNode.name,
                    dataSourceId: dataSourceId,
                    database: categoryNode.dbName || '',
                    tables: categoryNode.tables || [],
                    description: categoryNode.description || '',
                }
                categories.push(category)

                // 递归处理子节点（资产类别可能有嵌套的子类别）
                if (categoryNode.children && categoryNode.children.length > 0) {
                    categoryNode.children.forEach((childNode) => {
                        processCategoryNode(childNode, dataSourceId, categories)
                    })
                }
            }
        }

        treeNodes.forEach((node) => {
            // 节点类型为 0 表示数据源
            if (node.nodeType === 0) {
                // 将数据库类型字符串转换为 DataSource 的 type 类型
                const getDataSourceType = (dbType: string | null): 'mysql' | 'postgresql' | 'oracle' | 'sqlserver' => {
                    if (!dbType) return 'mysql'
                    const lowerType = dbType.toLowerCase()
                    if (lowerType.includes('mysql')) return 'mysql'
                    if (lowerType.includes('postgres')) return 'postgresql'
                    if (lowerType.includes('oracle')) return 'oracle'
                    if (lowerType.includes('sqlserver') || lowerType.includes('sql server')) return 'sqlserver'
                    return 'mysql' // 默认值
                }

                // 将数据源节点转换为 DataSource 格式
                const dataSource: DataSource = {
                    id: node.id,
                    name: node.name,
                    type: getDataSourceType(node.dbType),
                    host: node.dbHost || '',
                    port: node.dbPort ? parseInt(node.dbPort, 10) : 3306,
                    database: node.dbName || '',
                    status: node.status === 1 ? 'connected' : 'disconnected',
                    description: node.description || '',
                    dbStatus: node.dbStatus,
                }
                convertedDataSources.push(dataSource)

                // 处理子节点（资产类别，支持递归处理嵌套结构）
                if (node.children && node.children.length > 0) {
                    node.children.forEach((childNode) => {
                        processCategoryNode(childNode, node.id, convertedCategories)
                    })
                }
            }
        })

        return {
            dataSources: convertedDataSources,
            categories: convertedCategories,
        }
    }, [])

    // 使用 ref 跟踪是否正在加载，防止重复调用
    const isLoadingTree = useRef(false)

    /**
     * 加载资产树数据（仅在开发版本中调用）
     */
    const loadAssetTree = useCallback(async (searchName?: string) => {
        // 仅在开发版本中调用接口
        if (!isDevVersion()) {
            return
        }

        // 如果正在加载，直接返回，避免重复调用
        if (isLoadingTree.current) {
            return
        }

        try {
            isLoadingTree.current = true
            setLoading(true)
            const response = await dataManagementService.getAssetTree({
                name: searchName,
            })

            if (response.code === 200 && response.data) {
                const { dataSources: convertedDataSources, categories: convertedCategories } =
                    convertAssetTreeToPageData(response.data)
                setDataSources(convertedDataSources)
                setCategories(convertedCategories)
            } else {
                message.error(response.msg || '加载资产树失败')
            }
        } catch (error) {
            console.error('加载资产树失败:', error)
            message.error('加载资产树失败，请稍后重试')
        } finally {
            isLoadingTree.current = false
            setLoading(false)
        }
    }, [convertAssetTreeToPageData])

    // 使用 ref 跟踪是否已经初始化加载
    const hasInitialized = useRef(false)
    // 使用 ref 跟踪上一次的搜索文本，避免重复调用
    const lastSearchText = useRef<string | undefined>(undefined)

    // 开发版本：初始加载资产树数据（仅在组件挂载时调用一次）
    useEffect(() => {
        if (!isDevVersion()) {
            return
        }

        // 如果是首次加载，执行初始加载
        // 使用请求锁确保即使 StrictMode 导致多次挂载，也只调用一次
        if (!hasInitialized.current && !isLoadingTree.current) {
            hasInitialized.current = true
            lastSearchText.current = debouncedSearchText || undefined
            loadAssetTree()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // 空依赖数组，确保只在组件挂载时调用一次

    // 开发版本：搜索时重新加载资产树数据
    useEffect(() => {
        if (!isDevVersion() || !hasInitialized.current) {
            return
        }

        // 如果搜索文本发生变化，才重新加载
        const currentSearchText = debouncedSearchText || undefined
        if (lastSearchText.current !== currentSearchText && !isLoadingTree.current) {
            lastSearchText.current = currentSearchText
            loadAssetTree(currentSearchText)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchText]) // 只依赖 debouncedSearchText

    /**
     * 加载数据库选项列表
     * @description 在组件初始化时调用，获取可用的数据库选项
     */
    const loadDatabaseOptions = useCallback(async () => {
        try {
            setDatabaseOptionsLoading(true)
            const response = await dataManagementService.getDatabaseOptions()
            
            if (response.code === 200 && response.data) {
                setDatabaseOptions(response.data)
            } else {
                message.error(response.msg || '加载数据库选项失败')
                setDatabaseOptions([])
            }
        } catch (error) {
            console.error('加载数据库选项失败:', error)
            message.error('加载数据库选项失败，请稍后重试')
            setDatabaseOptions([])
        } finally {
            setDatabaseOptionsLoading(false)
        }
    }, [])

    // 初始化时加载数据库选项列表
    useEffect(() => {
        loadDatabaseOptions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // 空依赖数组，确保只在组件挂载时调用一次

    // 当 databaseOptions 加载完成后，如果正在编辑资产，重新设置表单值以确保正确回显
    useEffect(() => {
        if (isDevVersion() && editingAsset && databaseOptions.length > 0 && addAssetModalVisible) {
            // 重新匹配数据源ID
            let matchedDataSourceId = editingAsset.id
            const directMatch = databaseOptions.find(db => db.id === editingAsset.id)
            if (directMatch) {
                matchedDataSourceId = directMatch.id
            } else {
                const numericId = editingAsset.id.replace(/[^0-9]/g, '')
                if (numericId) {
                    const numericMatch = databaseOptions.find(db => db.id === numericId)
                    if (numericMatch) {
                        matchedDataSourceId = numericMatch.id
                    }
                }
            }
            // 更新表单值
            form.setFieldsValue({
                dataSourceId: matchedDataSourceId,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [databaseOptions, editingAsset, addAssetModalVisible])

    // 当 databaseOptions 加载完成后，如果正在编辑类别，重新设置数据源ID以确保正确显示
    useEffect(() => {
        if (isDevVersion() && editingCategory && databaseOptions.length > 0 && addCategoryModalVisible) {
            // 重新匹配数据源ID
            let matchedDataSourceId = editingCategory.dataSourceId
            const directMatch = databaseOptions.find(db => db.id === editingCategory.dataSourceId)
            if (directMatch) {
                matchedDataSourceId = directMatch.id
            } else {
                const numericId = editingCategory.dataSourceId.replace(/[^0-9]/g, '')
                if (numericId) {
                    const numericMatch = databaseOptions.find(db => db.id === numericId)
                    if (numericMatch) {
                        matchedDataSourceId = numericMatch.id
                    }
                }
            }
            // 更新表单值
            categoryForm.setFieldsValue({
                dataSourceId: matchedDataSourceId,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [databaseOptions, editingCategory, addCategoryModalVisible])

    /**
     * 加载表信息列表
     * @description 当新增资产类别弹窗打开且选择了数据源时，调用接口获取表信息
     */
    const loadTableInfo = useCallback(async () => {
        // 仅在开发版本中调用接口
        if (!isDevVersion()) {
            return
        }

        try {
            setTableInfoLoading(true)
            setTableInfoList([])
            const response = await dataManagementService.getTableInfo()
            
            if (response.code === 200 && response.data) {
                setTableInfoList(response.data)
            } else {
                message.error(response.msg || '获取表信息失败')
                setTableInfoList([])
            }
        } catch (error) {
            logger.error('获取表信息失败:', error instanceof Error ? error : new Error(String(error)))
            message.error('获取表信息失败，请稍后重试')
            setTableInfoList([])
        } finally {
            setTableInfoLoading(false)
        }
    }, [])

    // 当新增资产类别弹窗打开时，加载表信息
    useEffect(() => {
        if (addCategoryModalVisible && isDevVersion()) {
            loadTableInfo()
        } else {
            // 弹窗关闭时清空表信息列表
            setTableInfoList([])
        }
    }, [addCategoryModalVisible, loadTableInfo])

    /**
     * 加载表列表数据（仅在开发版本中调用）
     * @param categoryId 资产类别ID
     */
    const loadTableList = useCallback(async (categoryId: string) => {
        // 仅在开发版本中调用接口
        if (!isDevVersion()) {
            return
        }

        try {
            setContentLoading(true)
            // 先清空列表，避免显示旧数据
            setTableList([])
            const response = await dataManagementService.getAssetTableList(categoryId)

            if (response.code === 200 && response.data) {
                // 转换接口返回的数据格式
                const convertedTableList = response.data.map((table, index) => ({
                    key: `${categoryId}-${index}`,
                    name: table.tableName,
                    schema: table.databaseName,
                    comment: table.tableComment || '-',
                    rowCount: table.rowCount,
                    fieldCount: table.columnCount,
                    createTime: table.createTime
                        ? new Date(table.createTime).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                          })
                        : '-',
                    updateTime: table.updateTime
                        ? new Date(table.updateTime).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                          })
                        : null,
                    tableType: table.tableType,
                    engine: table.storageEngine,
                }))
                setTableList(convertedTableList)
            } else {
                message.error(response.msg || '加载表列表失败')
                setTableList([])
            }
        } catch (error) {
            console.error('加载表列表失败:', error)
            message.error('加载表列表失败，请稍后重试')
            setTableList([])
        } finally {
            setContentLoading(false)
        }
    }, [])

    // 构建树形数据
    const treeData = useMemo(() => {
        const buildTree = (): ExtendedDataNode[] => {
            const nodes: ExtendedDataNode[] = []

            dataSources.forEach(ds => {
                const dsNode: ExtendedDataNode = {
                    title: ds.name, // 先设置简单的标题，稍后通过 titleRender 自定义
                    key: `ds-${ds.id}`,
                    nodeType: 'dataSource',
                    data: ds,
                    children: [],
                }

                // 添加资产类别（仅显示两个层级：资产 -> 资产类别）
                const dsCategories = categories.filter(cat => cat.dataSourceId === ds.id)
                dsCategories.forEach(cat => {
                    const catNode: ExtendedDataNode = {
                        title: (
                            <span>
                                <FolderOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                                {cat.name}
                            </span>
                        ),
                        key: `cat-${cat.id}`,
                        nodeType: 'category',
                        data: cat,
                        dataSourceId: ds.id,
                        children: [], // 不再包含表和字段子节点
                    }

                    dsNode.children!.push(catNode)
                })

                nodes.push(dsNode)
            })

            return nodes
        }

        return buildTree()
    }, [dataSources, categories, handleAddCategoryClick])

    // 计算当前选中数据源的显示名称（用于新增资产类别弹窗）
    // 注意：这里使用 selectedDataSourceId，因为表单值会在弹窗打开时通过 setFieldsValue 设置
    const currentDataSourceDisplayName = useMemo(() => {
        if (!selectedDataSourceId) {
            return ''
        }
        
        if (isDevVersion()) {
            // 开发版本：从 databaseOptions 中查找对应的 dbName
            const matchedOption = databaseOptions.find(db => db.id === selectedDataSourceId)
            return matchedOption ? matchedOption.dbName : ''
        } else {
            // 演示版本：从 dataSources 中查找对应的名称
            const matchedDataSource = dataSources.find(ds => ds.id === selectedDataSourceId)
            return matchedDataSource ? matchedDataSource.name : ''
        }
    }, [selectedDataSourceId, databaseOptions, dataSources])

    // 过滤树形数据
    // 开发版本：接口已返回过滤后的数据，不需要前端再过滤
    // 演示版本：使用前端过滤逻辑
    const filteredTreeData = useMemo(() => {
        // 开发版本中，接口已经根据搜索条件返回了过滤后的数据，直接返回 treeData
        if (isDevVersion()) {
            return treeData
        }

        // 演示版本：使用前端过滤逻辑
        if (!debouncedSearchText) return treeData

        const filterTree = (nodes: ExtendedDataNode[]): ExtendedDataNode[] => {
            return nodes
                .map(node => {
                    const title = String(node.title)
                    const matches = title.toLowerCase().includes(debouncedSearchText.toLowerCase())

                    let filteredChildren: ExtendedDataNode[] = []
                    if (node.children) {
                        filteredChildren = filterTree(node.children as ExtendedDataNode[])
                    }

                    if (matches || filteredChildren.length > 0) {
                        return {
                            ...node,
                            children: filteredChildren.length > 0 ? filteredChildren : node.children,
                        }
                    }
                    return null
                })
                .filter(Boolean) as ExtendedDataNode[]
        }

        return filterTree(treeData)
    }, [treeData, debouncedSearchText])

    // 查找选中的节点并更新视图状态
    useEffect(() => {
        if (selectedKeys.length > 0) {
            const findNode = (
                nodes: ExtendedDataNode[],
                key: React.Key
            ): ExtendedDataNode | null => {
                for (const node of nodes) {
                    if (node.key === key) {
                        return node
                    }
                    if (node.children) {
                        const found = findNode(node.children as ExtendedDataNode[], key)
                        if (found) return found
                    }
                }
                return null
            }

            if (selectedKeys[0] !== undefined) {
                const node = findNode(treeData, selectedKeys[0])
                setSelectedNode(node || null)
                
                // 根据节点类型更新视图状态
                if (node) {
                    if (node.nodeType === 'category') {
                        const cat = node.data as AssetCategory
                        setSelectedCategory(cat)
                        setViewMode('category')
                        setSelectedTable(null) // 重置选中的表
                        // 开发版本：加载表列表数据
                        if (isDevVersion()) {
                            loadTableList(cat.id)
                        } else {
                            // 演示版本：使用mock数据，添加loading效果
                            setContentLoading(true)
                            setTableList([])
                            // 模拟异步加载
                            setTimeout(() => {
                                setTableList(
                                    cat.tables.map((table, index) => {
                                        const tableInfo = mockTables[table]
                                        return {
                                            key: `${cat.id}-${index}`,
                                            name: table,
                                            schema: tableInfo?.schema || cat.database,
                                            comment: tableInfo?.comment || '-',
                                            rowCount: tableInfo?.rowCount || 0,
                                            fieldCount: tableInfo?.fields?.length || 0,
                                            createTime: '2024-01-15 10:00:00',
                                            updateTime: '2024-01-20 14:30:00',
                                            tableType: 'BASE TABLE',
                                            engine: 'InnoDB',
                                        }
                                    })
                                )
                                setContentLoading(false)
                            }, 300)
                        }
                    } else if (node.nodeType === 'dataSource') {
                        // 点击数据源时显示详情
                        setViewMode('empty')
                        setSelectedCategory(null)
                        setSelectedTable(null)
                        setTableList([])
                    }
                }
            } else {
                setSelectedNode(null)
                setViewMode('empty')
                setSelectedCategory(null)
                setSelectedTable(null)
            }
        } else {
            setSelectedNode(null)
            setViewMode('empty')
            setSelectedCategory(null)
            setSelectedTable(null)
        }
    }, [selectedKeys, treeData])

    // 处理新增/编辑资产
    const handleAddAsset = async () => {
        try {
            const values = await form.validateFields()
            
            setSaving(true)

            // 开发版本：调用真实接口
            if (isDevVersion()) {
                if (editingAsset) {
                    // 编辑模式：调用更新接口
                    // 将资产ID转换为数字
                    let assetId = 0
                    const directParse = parseInt(editingAsset.id, 10)
                    if (!isNaN(directParse)) {
                        assetId = directParse
                    } else {
                        // 如果直接转换失败，尝试提取数字部分（处理"ds1"等格式）
                        const numericId = editingAsset.id.replace(/[^0-9]/g, '')
                        if (numericId) {
                            const extractedId = parseInt(numericId, 10)
                            if (!isNaN(extractedId)) {
                                assetId = extractedId
                            }
                        }
                    }

                    // 处理数据源ID转换
                    let sourceId: number | null = null
                    if (values.dataSourceId) {
                        const directParse = parseInt(values.dataSourceId, 10)
                        if (!isNaN(directParse)) {
                            sourceId = directParse
                        }
                    }

                    // 从 databaseOptions 中查找选中的数据源，获取状态信息
                    const selectedDatabaseOption = databaseOptions.find(db => db.id === values.dataSourceId)
                    const status = selectedDatabaseOption ? 1 : 0 // 默认已连接

                    const updateParams: UpdateAssetRequest = {
                        id: assetId,
                        assetName: values.name,
                        nodeType: 0, // 0表示资产
                        status: status,
                        sourceId: sourceId,
                        sort: 0,
                        description: values.description || null,
                    }

                    const response = await dataManagementService.updateAsset(updateParams)
                    
                    if (response.code === 200) {
                        message.success('资产修改成功')
                        // 重新加载资产树数据
                        await loadAssetTree()
                        setAddAssetModalVisible(false)
                        setEditingAsset(null)
                        form.resetFields()
                    } else {
                        message.error(response.msg || '资产修改失败')
                    }
                } else {
                    // 新增模式：调用接口
                    // 在开发版本中，dataSourceId 来自 databaseOptions，直接使用其 id（已经是字符串格式的数字）
                    let sourceId = 1 // 默认值
                    if (values.dataSourceId) {
                        // 直接转换为数字（databaseOptions 的 id 是字符串格式的数字，如 "1", "2"）
                        const directParse = parseInt(values.dataSourceId, 10)
                        if (!isNaN(directParse)) {
                            sourceId = directParse
                        }
                    }

                    // 从 databaseOptions 中查找选中的数据源，获取状态信息
                    const selectedDatabaseOption = databaseOptions.find(db => db.id === values.dataSourceId)
                    const status = selectedDatabaseOption ? 1 : 0 // 默认已连接

                    const requestParams: AddAssetRequest = {
                        parentId: 0, // 根节点
                        assetName: values.name,
                        nodeType: 0, // 0表示库节点
                        sourceId: sourceId,
                        status: status,
                        sort: 0,
                        tableNames: [] as string[],
                        description: values.description || null,
                    }

                    const response = await dataManagementService.addAsset(requestParams)
                    
                    if (response.code === 200) {
                        message.success('资产添加成功')
                        // 重新加载资产树数据
                        await loadAssetTree()
                        setAddAssetModalVisible(false)
                        form.resetFields()
                    } else {
                        message.error(response.msg || '资产添加失败')
                    }
                }
            } else {
                // 演示版本或编辑模式：使用mock数据
                await new Promise(resolve => setTimeout(resolve, 300))
                
                // 从选中的数据源获取信息（演示版本使用 dataSources）
                const selectedDataSource = dataSources.find(ds => ds.id === values.dataSourceId)
                if (!selectedDataSource) {
                    message.error('请选择数据源')
                    return
                }
                
                if (editingAsset) {
                    // 编辑模式（演示版本）
                    const updatedDataSource: DataSource = {
                        ...editingAsset,
                        name: values.name,
                        description: values.description,
                    }
                    setDataSources(dataSources.map(ds => ds.id === editingAsset.id ? updatedDataSource : ds))
                    message.success('资产修改成功')
                    setEditingAsset(null)
                } else {
                    // 新增模式（演示版本）
                    const newDataSource: DataSource = {
                        id: `ds${Date.now()}`,
                        name: values.name,
                        type: selectedDataSource.type,
                        host: selectedDataSource.host,
                        port: selectedDataSource.port,
                        database: selectedDataSource.database,
                        status: selectedDataSource.status,
                        description: values.description,
                    }
                    setDataSources([...dataSources, newDataSource])
                    message.success('资产添加成功')
                }
                setAddAssetModalVisible(false)
                form.resetFields()
            }
        } catch (error) {
            console.error('操作失败:', error)
            message.error(error instanceof Error ? error.message : '操作失败，请稍后重试')
        } finally {
            setSaving(false)
        }
    }

    // 处理编辑资产
    const handleEditAsset = (dataSource: DataSource) => {
        setEditingAsset(dataSource)
        
        // 处理数据源ID匹配：需要找到对应的 databaseOptions 中的 ID
        let matchedDataSourceId = dataSource.id
        if (isDevVersion()) {
            // 开发版本：尝试在 databaseOptions 中匹配
            if (databaseOptions.length > 0) {
                // 先尝试直接匹配
                const directMatch = databaseOptions.find(db => db.id === dataSource.id)
                if (directMatch) {
                    matchedDataSourceId = directMatch.id
                } else {
                    // 尝试提取数字部分进行匹配（处理 "ds1" -> "1" 的情况）
                    const numericId = dataSource.id.replace(/[^0-9]/g, '')
                    if (numericId) {
                        const numericMatch = databaseOptions.find(db => db.id === numericId)
                        if (numericMatch) {
                            matchedDataSourceId = numericMatch.id
                        }
                    }
                }
            }
            // 如果 databaseOptions 还没加载完成，使用原始ID，等待加载完成后再更新
        } else {
            // 演示版本：直接使用数据源ID
            matchedDataSourceId = dataSource.id
        }
        
        form.setFieldsValue({
            name: dataSource.name,
            dataSourceId: matchedDataSourceId,
            description: dataSource.description || '',
        })
        setAddAssetModalVisible(true)
    }

    // 处理新增/编辑资产类别表单提交
    const handleAddCategory = async () => {
        try {
            const values = await categoryForm.validateFields()
            
            // 确保使用正确的数据源ID（从表单值获取）
            const dataSourceId = values.dataSourceId
            if (!dataSourceId) {
                message.error('请选择数据源')
                return
            }

            if (!values.tables || values.tables.length === 0) {
                message.error('请至少选择一个表')
                return
            }
            
            // 资产类别不需要数据库字段，从表单值中移除
            delete values.database

            setSaving(true)

            // 开发版本：调用真实接口
            if (isDevVersion()) {
                if (editingCategory) {
                    // 编辑模式：调用更新接口
                    // 将类别ID转换为数字
                    let categoryId = 0
                    const directParse = parseInt(editingCategory.id, 10)
                    if (!isNaN(directParse)) {
                        categoryId = directParse
                    } else {
                        // 如果直接转换失败，尝试提取数字部分（处理"cat1"等格式）
                        const numericId = editingCategory.id.replace(/[^0-9]/g, '')
                        if (numericId) {
                            const extractedId = parseInt(numericId, 10)
                            if (!isNaN(extractedId)) {
                                categoryId = extractedId
                            }
                        }
                    }

                    const updateParams: UpdateAssetRequest = {
                        id: categoryId,
                        assetName: values.name,
                        nodeType: 1, // 1表示类别
                        status: 0, // 类别节点的连接状态，0为未连接
                        sourceId: null, // 类别节点不使用数据源ID
                        sort: 0,
                        description: values.description || null,
                    }

                    const response = await dataManagementService.updateAsset(updateParams)
                    
                    if (response.code === 200) {
                        message.success('资产类别修改成功')
                        // 重新加载资产树数据
                        await loadAssetTree()
                        // 自动展开对应的数据源节点，确保修改后的类别可见
                        const dsKey = `ds-${dataSourceId}`
                        if (!expandedKeys.includes(dsKey)) {
                            setExpandedKeys([...expandedKeys, dsKey])
                        }
                        setAddCategoryModalVisible(false)
                        setEditingCategory(null)
                        categoryForm.resetFields()
                    } else {
                        message.error(response.msg || '资产类别修改失败')
                    }
                } else {
                    // 新增模式：调用接口
                    // 处理数据源ID转换：接口需要数字类型的parentId
                    let parentId = 1 // 默认值
                    if (dataSourceId) {
                        // 先尝试直接转换为数字（处理纯数字字符串，如"7"）
                        const directParse = parseInt(dataSourceId, 10)
                        if (!isNaN(directParse)) {
                            parentId = directParse
                        } else {
                            // 如果直接转换失败，尝试提取数字部分（处理"ds1"等格式）
                            const numericId = dataSourceId.replace(/[^0-9]/g, '')
                            if (numericId) {
                                const extractedId = parseInt(numericId, 10)
                                if (!isNaN(extractedId)) {
                                    parentId = extractedId
                                }
                            }
                        }
                    }

                    const requestParams: AddAssetRequest = {
                        parentId: parentId, // 父节点ID，指向库节点ID
                        assetName: values.name, // 类别名称
                        nodeType: 1, // 1表示类别节点
                        sourceId: null, // 类别节点不使用数据源ID
                        status: 0, // 类别节点的连接状态，0为未连接
                        sort: 0, // 排序字段
                        tableNames: values.tables || [], // 多选表节点名称
                        description: values.description || null,
                    }

                    const response = await dataManagementService.addAssetCategory(requestParams)
                    
                    if (response.code === 200) {
                        message.success('资产类别添加成功')
                        // 重新加载资产树数据
                        await loadAssetTree()
                        // 自动展开对应的数据源节点，确保新添加的类别可见
                        const dsKey = `ds-${dataSourceId}`
                        if (!expandedKeys.includes(dsKey)) {
                            setExpandedKeys([...expandedKeys, dsKey])
                        }
                        setAddCategoryModalVisible(false)
                        categoryForm.resetFields()
                    } else {
                        message.error(response.msg || '资产类别添加失败')
                    }
                }
            } else {
                // 演示版本或编辑模式：使用mock数据
                await new Promise(resolve => setTimeout(resolve, 300))

                if (editingCategory) {
                    // 编辑模式（演示版本）
                    const updatedCategory: AssetCategory = {
                        ...editingCategory,
                        name: values.name,
                        description: values.description,
                        tables: values.tables || [],
                    }
                    setCategories(categories.map(cat => cat.id === editingCategory.id ? updatedCategory : cat))
                    message.success('资产类别修改成功')
                    setEditingCategory(null)
                } else {
                    // 新增模式（演示版本）
                    const newCategory: AssetCategory = {
                        id: `cat${Date.now()}`,
                        name: values.name,
                        dataSourceId: dataSourceId,
                        database: '', // 资产类别不需要数据库字段
                        tables: values.tables || [],
                        description: values.description,
                    }
                    setCategories([...categories, newCategory])
                    message.success('资产类别添加成功')
                    
                    // 自动展开对应的数据源节点，确保新添加的类别可见
                    const dsKey = `ds-${dataSourceId}`
                    if (!expandedKeys.includes(dsKey)) {
                        setExpandedKeys([...expandedKeys, dsKey])
                    }
                }
                
                setAddCategoryModalVisible(false)
                setSelectedDataSourceId('')
                categoryForm.resetFields()
            }
        } catch (error) {
            console.error('操作失败:', error)
            // 显示表单验证错误
            if (error && typeof error === 'object' && 'errorFields' in error) {
                message.error('请检查表单填写是否正确')
                return
            }
            message.error(error instanceof Error ? error.message : '操作失败，请稍后重试')
        } finally {
            setSaving(false)
        }
    }

    // 处理编辑资产类别
    const handleEditCategory = (category: AssetCategory) => {
        setEditingCategory(category)
        
        // 处理数据源ID匹配：需要找到对应的数据源
        let matchedDataSourceId = category.dataSourceId
        if (isDevVersion()) {
            // 开发版本：尝试在 databaseOptions 中匹配
            if (databaseOptions.length > 0) {
                // 先尝试直接匹配
                const directMatch = databaseOptions.find(db => db.id === category.dataSourceId)
                if (directMatch) {
                    matchedDataSourceId = directMatch.id
                } else {
                    // 尝试提取数字部分进行匹配（处理 "ds1" -> "1" 的情况）
                    const numericId = category.dataSourceId.replace(/[^0-9]/g, '')
                    if (numericId) {
                        const numericMatch = databaseOptions.find(db => db.id === numericId)
                        if (numericMatch) {
                            matchedDataSourceId = numericMatch.id
                        }
                    }
                }
            }
            // 如果 databaseOptions 还没加载完成，使用原始ID，等待加载完成后再更新
        } else {
            // 演示版本：尝试在 dataSources 中匹配
            const dataSourceMatch = dataSources.find(ds => ds.id === category.dataSourceId)
            if (dataSourceMatch) {
                matchedDataSourceId = dataSourceMatch.id
            }
        }
        
        categoryForm.setFieldsValue({
            name: category.name,
            dataSourceId: matchedDataSourceId,
            tables: category.tables,
            description: category.description || '',
        })
        setAddCategoryModalVisible(true)
    }

    // 处理表行点击
    const handleTableRowClick = async (tableName: string) => {
        if (!selectedCategory) {
            message.error('请先选择资产类别')
            return
        }

        if (isDevVersion()) {
            // 开发版本：调用接口获取字段详情
            try {
                setContentLoading(true)
                const response = await dataManagementService.getColumnDetails({
                    id: selectedCategory.id,
                    tableName: tableName,
                })

                if (response.code === 200 && response.data) {
                    // 转换接口返回的数据格式为页面需要的格式
                    const tableInfo: TableInfo = {
                        name: response.data.tableName,
                        schema: response.data.schema,
                        rowCount: parseInt(response.data.size, 10) || 0,
                        fields: response.data.list.map(col => ({
                            name: col.columnName,
                            type: col.dataType,
                            nullable: col.isNullable === 'YES',
                            default: col.columnDefault || undefined,
                            comment: col.columnComment || undefined,
                            primaryKey: false, // 接口未返回主键信息，默认为false
                        })),
                    }

                    setSelectedTable(tableInfo)
                    setColumnDetailsData({
                        schema: response.data.schema,
                        size: response.data.size,
                        tableName: response.data.tableName,
                        fields: response.data.list.map(col => ({
                            name: col.columnName,
                            type: col.dataType,
                            nullable: col.isNullable === 'YES',
                            default: col.columnDefault,
                            comment: col.columnComment,
                        })),
                    })
                    setViewMode('tableFields')
                } else {
                    message.error(response.msg || '获取字段详情失败')
                }
            } catch (error) {
                console.error('获取字段详情失败:', error)
                message.error(error instanceof Error ? error.message : '获取字段详情失败，请稍后重试')
            } finally {
                setContentLoading(false)
            }
        } else {
            // 演示版本：使用mock数据，添加loading效果
            setContentLoading(true)
            // 模拟异步加载
            setTimeout(() => {
                const tableInfo = mockTables[tableName]
                if (tableInfo) {
                    setSelectedTable(tableInfo)
                    setViewMode('tableFields')
                }
                setContentLoading(false)
            }, 300)
        }
    }

    // 返回到表列表
    const handleBackToTableList = () => {
        setSelectedTable(null)
        setColumnDetailsData(null)
        setViewMode('category')
    }

    // 渲染右侧详情区域
    const renderDetailContent = () => {
        // 数据源视图 - 显示资产详情（优先检查）
        if (selectedNode && selectedNode.nodeType === 'dataSource') {
            const ds = selectedNode.data as DataSource
            const dsCategories = categories.filter(cat => cat.dataSourceId === ds.id)
            
            return (
                <>
                    <div className={styles.detailHeader}>
                        <DatabaseOutlined style={{ fontSize: 20, color: '#0c63e4' }} />
                        <Title level={4} className={styles.detailTitle}>
                            {ds.name}
                        </Title>
                        {ds.description && (
                            <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 12 }}>
                                {ds.description}
                            </span>
                        )}
                    </div>
                    <div className={styles.detailContent}>
                        <div className={styles.infoSection}>
                            <div className={styles.sectionTitle}>基本信息</div>
                            <Descriptions bordered column={2} size='small'>
                                <Descriptions.Item label='资产名称'>{ds.name}</Descriptions.Item>
                                <Descriptions.Item label='数据库类型'>
                                    {ds.type ? ds.type.toUpperCase() : <span style={{ color: '#bfbfbf' }}>-</span>}
                                </Descriptions.Item>
                                <Descriptions.Item label='主机地址'>
                                    {ds.host || <span style={{ color: '#bfbfbf' }}>-</span>}
                                </Descriptions.Item>
                                <Descriptions.Item label='端口'>
                                    {ds.port || <span style={{ color: '#bfbfbf' }}>-</span>}
                                </Descriptions.Item>
                                <Descriptions.Item label='数据库名'>
                                    {ds.database || <span style={{ color: '#bfbfbf' }}>-</span>}
                                </Descriptions.Item>
                                <Descriptions.Item label='连接状态'>
                                    {ds.dbStatus !== undefined && ds.dbStatus !== null ? (
                                        <Tag color={
                                            ds.dbStatus === 1 ? 'success' : 
                                            ds.dbStatus === 2 ? 'processing' : 
                                            'default'
                                        }>
                                            {ds.dbStatus === 1 ? '已连接' : 
                                             ds.dbStatus === 2 ? '连接中' : 
                                             '未连接'}
                                        </Tag>
                                    ) : (
                                        <Tag color={ds.status === 'connected' ? 'success' : 'default'}>
                                            {ds.status === 'connected' ? '已连接' : '未连接'}
                                        </Tag>
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label='描述' span={2}>
                                    {ds.description || <span style={{ color: '#bfbfbf' }}>暂无描述</span>}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                        <div className={styles.infoSection}>
                            <div className={styles.sectionTitle}>资产类别 ({dsCategories.length})</div>
                            {dsCategories.length > 0 ? (
                                <Table
                                    className={styles.infoTable}
                                    dataSource={dsCategories}
                                    columns={[
                                        {
                                            title: '类别名称',
                                            dataIndex: 'name',
                                            key: 'name',
                                            width: 200,
                                        },
                                        {
                                            title: '数据库',
                                            dataIndex: 'database',
                                            key: 'database',
                                            width: 150,
                                        },
                                        {
                                            title: '包含表数量',
                                            dataIndex: 'tables',
                                            key: 'tables',
                                            width: 120,
                                            render: (tables: string[]) => tables.length,
                                        },
                                        {
                                            title: '描述',
                                            dataIndex: 'description',
                                            key: 'description',
                                            ellipsis: true,
                                            render: (text: string) => text || <span style={{ color: '#bfbfbf' }}>-</span>,
                                        },
                                    ]}
                                    rowKey='id'
                                    pagination={false}
                                    size='small'
                                    onRow={(record) => ({
                                        onClick: () => {
                                            const catKey = `cat-${record.id}`
                                            setSelectedKeys([catKey])
                                        },
                                        style: {
                                            cursor: 'pointer',
                                        },
                                    })}
                                />
                            ) : (
                                <Empty description='暂无资产类别' style={{ marginTop: 40 }} />
                            )}
                        </div>
                    </div>
                </>
            )
        }

        // 字段详情视图
        if (viewMode === 'tableFields' && selectedTable) {
            const columns = [
                {
                    title: '字段名',
                    dataIndex: 'name',
                    key: 'name',
                    width: 180,
                    fixed: 'left' as const,
                    render: (text: string, record: FieldInfo) => (
                        <span style={{ fontWeight: record.primaryKey ? 600 : 400 }}>
                            {text}
                            {record.primaryKey && (
                                <Tag color='gold' style={{ marginLeft: 8, fontSize: 11 }}>PK</Tag>
                            )}
                        </span>
                    ),
                },
                {
                    title: '数据类型',
                    dataIndex: 'type',
                    key: 'type',
                    width: 200,
                    render: (type: string) => {
                        return <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>{type}</code>
                    },
                },
                {
                    title: '允许为空',
                    dataIndex: 'nullable',
                    key: 'nullable',
                    width: 100,
                    align: 'center' as const,
                    render: (nullable: boolean) => (
                        nullable ? <span style={{ color: '#52c41a' }}>✓</span> : <span style={{ color: '#ff4d4f' }}>✗</span>
                    ),
                },
                {
                    title: '默认值',
                    dataIndex: 'default',
                    key: 'default',
                    width: 150,
                    render: (value: string | null | undefined) => {
                        if (value === null || value === undefined || value === '') {
                            return <span style={{ color: '#bfbfbf' }}>-</span>
                        }
                        return <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>{value}</code>
                    },
                },
                {
                    title: '说明',
                    dataIndex: 'comment',
                    key: 'comment',
                    ellipsis: true,
                    render: (text: string) => text || <span style={{ color: '#bfbfbf' }}>-</span>,
                },
            ]

            // 获取表大小信息（如果从接口获取）
            const tableSize = columnDetailsData?.size
            const tableSchema = columnDetailsData?.schema || selectedTable.schema

            return (
                <>
                    <div className={styles.detailHeader}>
                        <Button
                            type='text'
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBackToTableList}
                            style={{ marginRight: 8 }}
                        >
                            返回
                        </Button>
                        <TableOutlined style={{ fontSize: 20, color: '#0c63e4' }} />
                        <Title level={4} className={styles.detailTitle}>
                            {selectedTable.name}
                        </Title>
                        {selectedTable.comment && (
                            <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 12 }}>
                                {selectedTable.comment}
                            </span>
                        )}
                    </div>
                    <div className={styles.detailContent}>
                        <div className={styles.infoSection}>
                            <div className={styles.sectionTitle}>基本信息</div>
                            <Descriptions bordered column={3} size='small' style={{ marginBottom: 20 }}>
                                <Descriptions.Item label='表名'>{selectedTable.name}</Descriptions.Item>
                                <Descriptions.Item label='模式'>{tableSchema}</Descriptions.Item>
                                {tableSize && (
                                    <Descriptions.Item label='表大小'>{tableSize}</Descriptions.Item>
                                )}
                                {!tableSize && (
                                    <Descriptions.Item label='记录数'>
                                        {selectedTable.rowCount?.toLocaleString() || '-'}
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </div>
                        <div className={styles.infoSection}>
                            <div className={styles.sectionTitle}>字段列表 ({selectedTable.fields.length})</div>
                            <Spin spinning={contentLoading}>
                                <Table
                                    className={styles.infoTable}
                                    dataSource={selectedTable.fields}
                                    columns={columns}
                                    rowKey='name'
                                    pagination={false}
                                    size='small'
                                    scroll={{ 
                                        x: 800,
                                        y: 500, // 设置表格高度，超出部分显示滚动条
                                    }}
                                />
                            </Spin>
                        </div>
                    </div>
                </>
            )
        }

        // 资产类别视图 - 显示表列表
        if (viewMode === 'category' && selectedCategory) {
            const cat = selectedCategory
            const ds = dataSources.find(d => d.id === cat.dataSourceId)
            
            return (
                <>
                    <div className={styles.detailHeader}>
                        <FolderOutlined style={{ fontSize: 20, color: '#0c63e4' }} />
                        <Title level={4} className={styles.detailTitle}>
                            {cat.name}
                        </Title>
                        {cat.description && (
                            <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 12 }}>
                                {cat.description}
                            </span>
                        )}
                    </div>
                    <div className={styles.detailContent}>
                        <Tabs
                            defaultActiveKey='tables'
                            items={[
                                {
                                    key: 'tables',
                                    label: `表 (${isDevVersion() ? tableList.length : cat.tables.length})`,
                                    children: (
                                        <div className={styles.infoSection}>
                                            <Spin spinning={contentLoading}>
                                                <Table
                                                    className={styles.infoTable}
                                                    dataSource={tableList}
                                                    columns={[
                                                    { 
                                                        title: '表名', 
                                                        dataIndex: 'name', 
                                                        key: 'name',
                                                        width: 180,
                                                        fixed: 'left' as const,
                                                    },
                                                    { 
                                                        title: '模式/数据库', 
                                                        dataIndex: 'schema', 
                                                        key: 'schema',
                                                        width: 150,
                                                    },
                                                    { 
                                                        title: '说明', 
                                                        dataIndex: 'comment', 
                                                        key: 'comment',
                                                        ellipsis: true,
                                                        width: 200,
                                                    },
                                                    {
                                                        title: '记录数',
                                                        dataIndex: 'rowCount',
                                                        key: 'rowCount',
                                                        width: 120,
                                                        align: 'right' as const,
                                                        render: (count: string | number) => {
                                                            if (typeof count === 'string') {
                                                                return count
                                                            }
                                                            return count.toLocaleString()
                                                        },
                                                    },
                                                    {
                                                        title: '字段数',
                                                        dataIndex: 'fieldCount',
                                                        key: 'fieldCount',
                                                        width: 100,
                                                        align: 'right' as const,
                                                    },
                                                    {
                                                        title: '表类型',
                                                        dataIndex: 'tableType',
                                                        key: 'tableType',
                                                        width: 120,
                                                    },
                                                    {
                                                        title: '存储引擎',
                                                        dataIndex: 'engine',
                                                        key: 'engine',
                                                        width: 120,
                                                    },
                                                    {
                                                        title: '创建时间',
                                                        dataIndex: 'createTime',
                                                        key: 'createTime',
                                                        width: 160,
                                                    },
                                                    {
                                                        title: '更新时间',
                                                        dataIndex: 'updateTime',
                                                        key: 'updateTime',
                                                        width: 160,
                                                        render: (time: string | null) => time || '-',
                                                    },
                                                ]}
                                                pagination={false}
                                                size='small'
                                                scroll={{ x: 1200 }}
                                                onRow={(record) => ({
                                                    onClick: () => {
                                                        handleTableRowClick(record.name)
                                                    },
                                                    style: {
                                                        cursor: 'pointer',
                                                    },
                                                })}
                                            />
                                            </Spin>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'info',
                                    label: '信息',
                                    children: (
                                        <div className={styles.infoSection}>
                                            <div className={styles.sectionTitle}>基本信息</div>
                                            <Descriptions bordered column={2} size='small'>
                                                <Descriptions.Item label='类别名称'>{cat.name}</Descriptions.Item>
                                                <Descriptions.Item label='所属数据源'>{ds?.name || '-'}</Descriptions.Item>
                                                <Descriptions.Item label='数据库'>
                                                    {cat.database || <span style={{ color: '#bfbfbf' }}>-</span>}
                                                </Descriptions.Item>
                                                <Descriptions.Item label='包含表数量'>{cat.tables.length}</Descriptions.Item>
                                                {ds && (
                                                    <>
                                                        <Descriptions.Item label='数据源主机地址'>
                                                            {ds.host || <span style={{ color: '#bfbfbf' }}>-</span>}
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label='数据源端口'>
                                                            {ds.port || <span style={{ color: '#bfbfbf' }}>-</span>}
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label='数据源类型'>
                                                            {ds.type ? ds.type.toUpperCase() : <span style={{ color: '#bfbfbf' }}>-</span>}
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label='数据源连接状态'>
                                                            {ds.dbStatus !== undefined && ds.dbStatus !== null ? (
                                                                <Tag color={
                                                                    ds.dbStatus === 1 ? 'success' : 
                                                                    ds.dbStatus === 2 ? 'processing' : 
                                                                    'default'
                                                                }>
                                                                    {ds.dbStatus === 1 ? '已连接' : 
                                                                     ds.dbStatus === 2 ? '连接中' : 
                                                                     '未连接'}
                                                                </Tag>
                                                            ) : (
                                                                <Tag color={ds.status === 'connected' ? 'success' : 'default'}>
                                                                    {ds.status === 'connected' ? '已连接' : '未连接'}
                                                                </Tag>
                                                            )}
                                                        </Descriptions.Item>
                                                    </>
                                                )}
                                                <Descriptions.Item label='描述' span={2}>
                                                    {cat.description || <span style={{ color: '#bfbfbf' }}>暂无描述</span>}
                                                </Descriptions.Item>
                                            </Descriptions>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </>
            )
        }

        // 空状态
        if (viewMode === 'empty' && !selectedNode) {
            return (
                <div className={styles.detailContent}>
                    <Empty
                        description='请从左侧选择资产或资产类别查看详情'
                        style={{ marginTop: 100 }}
                    />
                </div>
            )
        }

        return null
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title level={2} style={{ margin: 0 }}>
                    <DatabaseOutlined style={{ marginRight: 8 }} />
                    数据资产管理
                </Title>
            </div>
            <Alert
                message='数据资产管理'
                description='管理数据源、资产类别、表和字段的层级结构，支持树形浏览和详情查看。'
                type='info'
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Layout className={styles.layout} hasSider>
                <Sider width={400} className={styles.sider}>
                    <div className={styles.toolbar}>
                        <Search
                            placeholder='搜索数据源、类别、表'
                            allowClear
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            prefix={<SearchOutlined />}
                            style={{ flex: 1 }}
                        />
                        <Button
                            type='primary'
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingAsset(null)
                                form.resetFields()
                                setAddAssetModalVisible(true)
                            }}
                            style={{ marginLeft: 8 }}
                        >
                            新增资产
                        </Button>
                    </div>
                    <div className={styles.treeContainer}>
                        <Tree
                            treeData={filteredTreeData as DataNode[]}
                            selectedKeys={selectedKeys}
                            expandedKeys={expandedKeys}
                            onSelect={keys => setSelectedKeys(keys)}
                            onExpand={keys => setExpandedKeys(keys)}
                            showLine={{ showLeafIcon: false }}
                            defaultExpandAll={false}
                            blockNode
                            titleRender={(nodeData): React.ReactNode => {
                                const node = nodeData as ExtendedDataNode
                                if (node.nodeType === 'dataSource') {
                                    const ds = node.data as DataSource
                                    const menuItems: MenuProps['items'] = [
                                        {
                                            key: 'add-category',
                                            label: '添加资产类别',
                                            icon: <PlusOutlined />,
                                            onClick: () => {
                                                handleAddCategoryClick(ds)
                                            },
                                        },
                                        {
                                            type: 'divider',
                                        },
                                        {
                                            key: 'edit',
                                            label: '编辑',
                                            icon: <EditOutlined />,
                                            onClick: () => {
                                                handleEditAsset(ds)
                                            },
                                        },
                                        {
                                            key: 'delete',
                                            label: '删除',
                                            icon: <DeleteOutlined />,
                                            danger: true,
                                            onClick: () => {
                                                showConfirm({
                                                    title: '确认删除',
                                                    content: `确定要删除资产"${ds.name}"吗？删除后该资产下的所有类别也将被删除。`,
                                                    okText: '确定',
                                                    cancelText: '取消',
                                                    okType: 'danger',
                                                    onOk: async () => {
                                                        try {
                                                            if (isDevVersion()) {
                                                                // 开发版本：调用接口删除
                                                                const response = await dataManagementService.deleteAsset(ds.id)
                                                                
                                                                if (response.code === 200) {
                                                                    message.success('删除成功')
                                                                    // 重新加载资产树数据
                                                                    await loadAssetTree()
                                                                    
                                                                    // 清除所有相关状态
                                                                    setSelectedNode(null)
                                                                    setViewMode('empty')
                                                                    setSelectedCategory(null)
                                                                    setSelectedTable(null)
                                                                    setSelectedKeys([])
                                                                } else {
                                                                    message.error(response.msg || '删除失败')
                                                                }
                                                            } else {
                                                                // 演示版本：使用mock数据
                                                                // 使用函数式更新确保使用最新状态
                                                                setCategories(prev => {
                                                                    // 获取该资产下的所有类别ID，用于清除选中状态
                                                                    const relatedCategories = prev.filter(cat => cat.dataSourceId === ds.id)
                                                                    const relatedCategoryIds = relatedCategories.map(cat => `cat-${cat.id}`)
                                                                    
                                                                    // 清除展开的节点（包括该资产及其所有子类别）
                                                                    setExpandedKeys(prevKeys => {
                                                                        const keysToRemove = [`ds-${ds.id}`, ...relatedCategoryIds]
                                                                        return prevKeys.filter(key => !keysToRemove.includes(String(key)))
                                                                    })
                                                                    
                                                                    // 清除选中的节点（包括该资产及其所有子类别）
                                                                    setSelectedKeys(prevKeys => {
                                                                        const keysToRemove = [`ds-${ds.id}`, ...relatedCategoryIds]
                                                                        const filtered = prevKeys.filter(key => !keysToRemove.includes(String(key)))
                                                                        return filtered.length === 0 ? [] : filtered
                                                                    })
                                                                    
                                                                    // 返回过滤后的类别列表
                                                                    return prev.filter(cat => cat.dataSourceId !== ds.id)
                                                                })
                                                                
                                                                // 删除数据源
                                                                setDataSources(prev => prev.filter(d => d.id !== ds.id))
                                                                
                                                                // 清除所有相关状态
                                                                setSelectedNode(null)
                                                                setViewMode('empty')
                                                                setSelectedCategory(null)
                                                                setSelectedTable(null)
                                                                
                                                                message.success('删除成功')
                                                            }
                                                        } catch (error) {
                                                            console.error('删除资产失败:', error)
                                                            message.error(error instanceof Error ? error.message : '删除失败，请重试')
                                                        }
                                                    },
                                                })
                                            },
                                        },
                                    ]

                                    return (
                                        <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    paddingRight: 8,
                                                }}
                                            >
                                                <DatabaseOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                                <span style={{ flex: 1 }}>{ds.name}</span>
                                                <Tag
                                                    color={ds.status === 'connected' ? 'success' : 'default'}
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    {ds.status === 'connected' ? '已连接' : '未连接'}
                                                </Tag>
                                                <Button
                                                    type='text'
                                                    size='small'
                                                    icon={<PlusOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                        handleAddCategoryClick(ds)
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                    }}
                                                    onMouseUp={(e) => {
                                                        e.stopPropagation()
                                                        e.preventDefault()
                                                    }}
                                                    style={{
                                                        marginLeft: 8,
                                                        padding: '2px 6px',
                                                        height: 24,
                                                        fontSize: 12,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10,
                                                    }}
                                                    title='添加资产类别'
                                                />
                                            </div>
                                        </Dropdown>
                                    )
                                } else if (node.nodeType === 'category') {
                                    const cat = node.data as AssetCategory
                                    const menuItems: MenuProps['items'] = [
                                        {
                                            key: 'edit',
                                            label: '编辑',
                                            icon: <EditOutlined />,
                                            onClick: () => {
                                                handleEditCategory(cat)
                                            },
                                        },
                                        {
                                            key: 'delete',
                                            label: '删除',
                                            icon: <DeleteOutlined />,
                                            danger: true,
                                            onClick: () => {
                                                showConfirm({
                                                    title: '确认删除',
                                                    content: `确定要删除资产类别"${cat.name}"吗？`,
                                                    okText: '确定',
                                                    cancelText: '取消',
                                                    okType: 'danger',
                                                    onOk: async () => {
                                                        try {
                                                            if (isDevVersion()) {
                                                                // 开发版本：调用接口删除
                                                                const response = await dataManagementService.deleteAsset(cat.id)
                                                                
                                                                if (response.code === 200) {
                                                                    message.success('删除成功')
                                                                    // 重新加载资产树数据
                                                                    await loadAssetTree()
                                                                    
                                                                    // 清除所有相关状态
                                                                    setSelectedNode(null)
                                                                    setViewMode('empty')
                                                                    setSelectedCategory(null)
                                                                    setSelectedTable(null)
                                                                    setSelectedKeys([])
                                                                } else {
                                                                    message.error(response.msg || '删除失败')
                                                                }
                                                            } else {
                                                                // 演示版本：使用mock数据
                                                                const categoryKey = `cat-${cat.id}`
                                                                
                                                                // 使用函数式更新确保使用最新状态
                                                                setCategories(prev => prev.filter(c => c.id !== cat.id))
                                                                
                                                                // 清除展开的节点
                                                                setExpandedKeys(prev => prev.filter(key => key !== categoryKey))
                                                                
                                                                // 清除选中的节点
                                                                setSelectedKeys(prev => {
                                                                    const filtered = prev.filter(key => key !== categoryKey)
                                                                    // 如果删除的是当前选中的类别，清空选中状态
                                                                    if (prev.includes(categoryKey)) {
                                                                        return []
                                                                    }
                                                                    return filtered
                                                                })
                                                                
                                                                // 清除所有相关状态
                                                                setSelectedNode(null)
                                                                setViewMode('empty')
                                                                setSelectedCategory(null)
                                                                setSelectedTable(null)
                                                                
                                                                message.success('删除成功')
                                                            }
                                                        } catch (error) {
                                                            console.error('删除类别失败:', error)
                                                            message.error(error instanceof Error ? error.message : '删除失败，请重试')
                                                        }
                                                    },
                                                })
                                            },
                                        },
                                    ]

                                    return (
                                        <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
                                            <div style={{ width: '100%' }}>
                                                {node.title as React.ReactNode}
                                            </div>
                                        </Dropdown>
                                    )
                                }
                                return node.title as React.ReactNode
                            }}
                        />
                    </div>
                </Sider>
                <Content className={styles.content}>
                    <div className={styles.detailCard}>
                        {renderDetailContent()}
                    </div>
                </Content>
            </Layout>

            {/* 新增/编辑资产弹窗 */}
            <Modal
                title={editingAsset ? '编辑资产' : '新增资产'}
                open={addAssetModalVisible}
                onOk={handleAddAsset}
                onCancel={() => {
                    setAddAssetModalVisible(false)
                    setEditingAsset(null)
                    form.resetFields()
                }}
                confirmLoading={saving}
                width={600}
            >
                <Form form={form} layout='vertical'>
                    <Form.Item
                        name='name'
                        label='资产名称'
                        rules={[{ required: true, message: '请输入资产名称' }]}
                    >
                        <Input placeholder='请输入资产名称' />
                    </Form.Item>
                    <Form.Item
                        name='dataSourceId'
                        label='数据源'
                        rules={[{ required: true, message: '请选择数据源' }]}
                    >
                        <Select 
                            placeholder='请选择数据源' 
                            showSearch 
                            disabled={!!editingAsset}
                            loading={databaseOptionsLoading}
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                        >
                            {isDevVersion() 
                                ? databaseOptions.map(db => (
                                    <Option key={db.id} value={db.id} label={db.dbName}>
                                        {db.dbName} ({db.dbType})
                                    </Option>
                                ))
                                : dataSources.map(ds => (
                                    <Option key={ds.id} value={ds.id} label={ds.name}>
                                        {ds.name} ({ds.type.toUpperCase()})
                                    </Option>
                                ))
                            }
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ max: 500, message: '描述不能超过500个字符' }]}
                    >
                        <Input.TextArea 
                            placeholder='请输入资产描述信息' 
                            rows={4}
                            showCount
                            maxLength={500}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 新增/编辑资产类别弹窗 */}
            <Modal
                title={editingCategory ? '编辑资产类别' : '新增资产类别'}
                open={addCategoryModalVisible}
                onOk={handleAddCategory}
                onCancel={() => {
                    setAddCategoryModalVisible(false)
                    setEditingCategory(null)
                    categoryForm.resetFields()
                }}
                confirmLoading={saving}
                width={700}
            >
                <Form form={categoryForm} layout='vertical'>
                    <Form.Item
                        name='name'
                        label='类别名称'
                        rules={[{ required: true, message: '请输入类别名称' }]}
                    >
                        <Input placeholder='请输入类别名称' />
                    </Form.Item>
                    <Form.Item
                        name='dataSourceId'
                        label='所属数据源'
                        rules={[{ required: true, message: '请选择数据源' }]}
                    >
                        <Select 
                            placeholder='请选择数据源' 
                            showSearch 
                            loading={databaseOptionsLoading}
                            filterOption={(input, option) => {
                                const label = String(option?.label ?? '')
                                return label.toLowerCase().includes(input.toLowerCase())
                            }}
                            onChange={(value) => {
                                // 切换数据源时清空已选表
                                categoryForm.setFieldsValue({ tables: [] })
                                // 如果弹窗已打开，重新加载表信息
                                if (addCategoryModalVisible && isDevVersion()) {
                                    loadTableInfo()
                                }
                            }}
                        >
                            {isDevVersion() 
                                ? databaseOptions.map(db => (
                                    <Option key={db.id} value={db.id} label={db.dbName}>
                                        {db.dbName} ({db.dbType})
                                    </Option>
                                ))
                                : dataSources.map(ds => (
                                    <Option key={ds.id} value={ds.id} label={ds.name}>
                                        {ds.name} ({ds.type.toUpperCase()})
                                    </Option>
                                ))
                            }
                        </Select>
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => {
                            // 监听 dataSourceId 变化，强制更新表选择器
                            return prevValues.dataSourceId !== currentValues.dataSourceId
                        }}
                    >
                        {({ getFieldValue }) => {
                            const dataSourceId = getFieldValue('dataSourceId')
                            if (!dataSourceId) {
                                return (
                                    <Form.Item 
                                        name='tables' 
                                        label='选择表'
                                        rules={[{ required: true, message: '请至少选择一个表' }]}
                                    >
                                        <Select
                                            mode='multiple'
                                            placeholder='请先选择数据源'
                                            disabled
                                            showSearch
                                            allowClear
                                        />
                                    </Form.Item>
                                )
                            }
                            
                            // 开发版本：使用接口获取的表信息
                            if (isDevVersion()) {
                                return (
                                    <Form.Item 
                                        name='tables' 
                                        label='选择表'
                                        rules={[{ required: true, message: '请至少选择一个表' }]}
                                    >
                                        <Select
                                            mode='multiple'
                                            placeholder={tableInfoLoading ? '正在加载表信息...' : '请选择表（可多选）'}
                                            loading={tableInfoLoading}
                                            showSearch
                                            allowClear
                                            filterOption={(input, option) => {
                                                const label = String(option?.label ?? '')
                                                return label.toLowerCase().includes(input.toLowerCase())
                                            }}
                                        >
                                            {tableInfoList.map(table => (
                                                <Option 
                                                    key={table.tableName} 
                                                    value={table.tableName} 
                                                    label={table.tableName}
                                                >
                                                    {table.tableName} {table.tableComment ? `- ${table.tableComment}` : ''}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )
                            }
                            
                            // 演示版本：使用mock数据
                            // 获取该数据源下的所有数据库，然后获取所有表
                            const databases = getDatabasesByDataSource(dataSourceId)
                            
                            // 收集所有数据库下的表
                            const allTables: string[] = []
                            databases.forEach(db => {
                                const tables = getTablesByDatabase(db)
                                allTables.push(...tables)
                            })
                            
                            // 去重
                            const uniqueTables = Array.from(new Set(allTables))
                            
                            return (
                                <Form.Item 
                                    name='tables' 
                                    label='选择表'
                                    rules={[{ required: true, message: '请至少选择一个表' }]}
                                >
                                    <Select
                                        mode='multiple'
                                        placeholder='请选择表（可多选）'
                                        showSearch
                                        allowClear
                                        filterOption={(input, option) => {
                                            const label = String(option?.label ?? '')
                                            return label.toLowerCase().includes(input.toLowerCase())
                                        }}
                                    >
                                        {uniqueTables.map(tableName => {
                                            const table = mockTables[tableName]
                                            return (
                                                <Option key={tableName} value={tableName} label={tableName}>
                                                    {tableName} - {table?.comment || '-'}
                                                </Option>
                                            )
                                        })}
                                    </Select>
                                </Form.Item>
                            )
                        }}
                    </Form.Item>
                    <Form.Item
                        name='description'
                        label='描述'
                        rules={[{ max: 500, message: '描述不能超过500个字符' }]}
                    >
                        <Input.TextArea 
                            placeholder='请输入资产类别描述信息' 
                            rows={4}
                            showCount
                            maxLength={500}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default DataAssetManagement


