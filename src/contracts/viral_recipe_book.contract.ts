import templates from '../../docs/features/viral-recipe-book/templates/contracts.json'
import analyzer from '../../docs/features/viral-recipe-book/analyzer/contracts.json'
import abtest from '../../docs/features/viral-recipe-book/ab-test/contracts.json'
import validate from '../../docs/features/viral-recipe-book/validate/contracts.json'
import dashboard from '../../docs/features/viral-recipe-book/dashboard/contracts.json'
import scripts from '../../docs/features/viral-recipe-book/scripts/contracts.json'
import optimize from '../../docs/features/viral-recipe-book/optimize/contracts.json'
import inception from '../../docs/features/viral-recipe-book/inception/contracts.json'

export type HttpMethod = 'GET'|'POST'|'PUT'|'DELETE'|'PATCH'

export interface EndpointSpec { method: HttpMethod; path: string; status?: 'to-implement' | 'ok' }
export interface FeatureContract {
	slug: string
	tab: string
	testIds: string[]
	states: string[]
	endpoints: EndpointSpec[]
	rbac?: string[]
	observability?: { logs?: string[]; metrics?: string[]; alerts?: string[]; audit?: boolean }
}

export interface ViralRecipeBookMachineContract {
	ownerObjectives: number[]
	features: FeatureContract[]
	tabs: string[]
	testIds: string[]
	endpoints: EndpointSpec[]
}

const features: FeatureContract[] = [
	templates as FeatureContract,
	analyzer as FeatureContract,
	abtest as FeatureContract,
	validate as FeatureContract,
	dashboard as FeatureContract,
	scripts as FeatureContract,
	optimize as FeatureContract,
	inception as FeatureContract
]

const tabs = Array.from(new Set(features.map(f => f.tab)))
const testIds = Array.from(new Set(features.flatMap(f => f.testIds)))
const endpoints: EndpointSpec[] = features.flatMap(f => f.endpoints.map(e => ({ ...e })))

export const ViralRecipeBookMachineContract: ViralRecipeBookMachineContract = {
	ownerObjectives: [2, 3, 4, 6, 11],
	features,
	tabs,
	testIds,
	endpoints
}

export default ViralRecipeBookMachineContract
