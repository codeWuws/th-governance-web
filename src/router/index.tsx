import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from '../components/Layout/MainLayout'

// 懒加载组件
const Dashboard = lazy(() => import('../pages/Dashboard'))
const DatabaseConnection = lazy(() => import('../pages/DatabaseConnection'))
const DataGovernance = lazy(() => import('../pages/DataGovernance'))
const ExecutionHistory = lazy(() => import('../pages/DataGovernance/ExecutionHistory').then(module => ({ default: module.ExecutionHistory })))
const WorkflowConfig = lazy(() => import('../pages/DataGovernance/WorkflowConfig'))
const WorkflowDetail = lazy(() => import('../pages/DataGovernance/WorkflowDetail'))
const DataQualityControl = lazy(() => import('../pages/DataQualityControl'))
const IntegratedQualityControlManagement = lazy(() => import('../pages/DataQualityControl/IntegratedQualityControlManagement'))
const FlowManagement = lazy(() => import('../pages/DataQualityControl/FlowManagement'))
const QCExecutionHistory = lazy(() => import('../pages/DataQualityControl/ExecutionHistory'))
const QualityControlFlowDetail = lazy(() => import('../pages/DataQualityControl/QualityControlFlowDetail'))

const DataManagement = lazy(() => import('../pages/DataManagement'))
const DataAssetManagement = lazy(() => import('../pages/DataManagement/DataAssetManagement'))
const CategoryManagement = lazy(() => import('../pages/DataManagement/CategoryManagement'))
const IndexGenerationRules = lazy(() => import('../pages/DataManagement/IndexGenerationRules'))
const IndexMergeRules = lazy(() => import('../pages/DataManagement/IndexMergeRules'))
const IndexProcessingManagement = lazy(() => import('../pages/DataManagement/IndexProcessingManagement'))
const BusinessDatasetManagement = lazy(() => import('../pages/DataManagement/BusinessDatasetManagement'))
const MedicalDictionaryManagement = lazy(() => import('../pages/DataManagement/MedicalDictionaryManagement'))
const StateDictionaryManagement = lazy(() => import('../pages/DataManagement/StateDictionaryManagement'))
const StandardDictionaryMapping = lazy(() => import('../pages/DataManagement/StandardDictionaryMapping'))

const DataParsing = lazy(() => import('../pages/DataParsing'))
const DataAnnotation = lazy(() => import('../pages/DataParsing/DataAnnotation'))
const MedicalRecordParsing = lazy(() => import('../pages/DataParsing/MedicalRecordParsing'))

const FullTextSearch = lazy(() => import('../pages/DataRetrieval/FullTextSearch'))
const AdvancedSearch = lazy(() => import('../pages/DataRetrieval/AdvancedSearch'))
const ConditionTreeSearch = lazy(() => import('../pages/DataRetrieval/ConditionTreeSearch'))
const SearchAnalysis = lazy(() => import('../pages/DataRetrieval/SearchAnalysis'))
const VisualizationView = lazy(() => import('../pages/DataRetrieval/VisualizationView'))

const SystemSettings = lazy(() => import('../pages/SystemSettings'))
const UserSettings = lazy(() => import('../pages/SystemSettings/UserSettings'))
const RoleSettings = lazy(() => import('../pages/SystemSettings/RoleSettings'))
const PermissionSettings = lazy(() => import('../pages/SystemSettings/PermissionSettings'))

// 加载中组件
const LoadingFallback = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="加载中..." />
    </div>
)

// 包装懒加载组件为 React 元素
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Component />
        </Suspense>
    )
}

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <MainLayout />,
            children: [
            {
                index: true,
                element: withSuspense(Dashboard),
            },
            {
                path: 'dashboard',
                element: withSuspense(Dashboard),
            },
            {
                path: 'database-connection',
                element: withSuspense(DatabaseConnection),
            },
            {
                path: 'data-governance',
                element: withSuspense(DataGovernance),
            },
            {
                path: 'data-governance/workflow-config',
                element: withSuspense(WorkflowConfig),
            },
            {
                path: 'data-governance/execution-history',
                element: withSuspense(ExecutionHistory),
            },
            {
                path: 'data-governance/workflow/:taskId',
                element: withSuspense(WorkflowDetail),
            },
            {
                path: 'data-quality-control',
                element: withSuspense(DataQualityControl),
            },
            {
                path: 'data-quality-control/flow-management',
                element: withSuspense(FlowManagement),
            },
            {
                path: 'data-quality-control/execution-history',
                element: withSuspense(QCExecutionHistory),
            },
            {
                path: 'data-quality-control/integrated',
                element: withSuspense(IntegratedQualityControlManagement),
            },
            {
                path: 'data-quality-control/flow/:taskId',
                element: withSuspense(QualityControlFlowDetail),
            },
            {
                path: 'data-management',
                element: withSuspense(DataManagement),
                children: [
                    {
                        path: 'data-asset',
                        element: withSuspense(DataAssetManagement),
                    },
                    {
                        path: 'category-management',
                        element: withSuspense(CategoryManagement),
                    },
                    {
                        path: 'business-datasets',
                        element: withSuspense(BusinessDatasetManagement),
                    },
                    {
                        path: 'medical-dictionaries',
                        element: withSuspense(MedicalDictionaryManagement),
                    },
                    {
                        path: 'state-dictionaries',
                        element: withSuspense(StateDictionaryManagement),
                    },
                    {
                        path: 'standard-dictionary-mapping',
                        element: withSuspense(StandardDictionaryMapping),
                    },
                    {
                        path: 'index-rules',
                        element: withSuspense(IndexGenerationRules),
                    },
                    {
                        path: 'merge-rules',
                        element: withSuspense(IndexMergeRules),
                    },
                    {
                        path: 'index-processing',
                        element: withSuspense(IndexProcessingManagement),
                    },
                ],
            },
            {
                path: 'data-parsing',
                element: withSuspense(DataParsing),
            },
            {
                path: 'data-parsing/annotation',
                element: withSuspense(DataAnnotation),
            },
            {
                path: 'data-parsing/medical-record',
                element: withSuspense(MedicalRecordParsing),
            },
            // 数据检索模块
            {
                path: 'data-retrieval',
                children: [
                    {
                        index: true,
                        element: withSuspense(FullTextSearch),
                    },
                    {
                        path: 'fulltext',
                        element: withSuspense(FullTextSearch),
                    },
                    {
                        path: 'advanced',
                        element: withSuspense(AdvancedSearch),
                    },
                    {
                        path: 'condition-tree',
                        element: withSuspense(ConditionTreeSearch),
                    },
                    {
                        path: 'analysis',
                        element: withSuspense(SearchAnalysis),
                    },
                    // 支持无 ID 的可视化路由，用于演示或回退到模拟数据
                    {
                        path: 'visualization',
                        element: withSuspense(VisualizationView),
                    },
                    {
                        path: 'visualization/:id',
                        element: withSuspense(VisualizationView),
                    },
                ],
            },
            // 系统设置模块
            {
                path: 'system-settings',
                element: withSuspense(SystemSettings),
                children: [
                    {
                        index: true,
                        element: withSuspense(UserSettings),
                    },
                    {
                        path: 'users',
                        element: withSuspense(UserSettings),
                    },
                    {
                        path: 'roles',
                        element: withSuspense(RoleSettings),
                    },
                    {
                        path: 'permissions',
                        element: withSuspense(PermissionSettings),
                    },
                ],
            },
        ],
    },
    ],
    {
        basename: '/dataflow',
    }
)

export default router
