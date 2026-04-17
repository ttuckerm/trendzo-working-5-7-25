/**
 * Clay — Formless UI module
 *
 * Dynamic component selection and rendering for the agency Clay UI.
 * The AI selects from the component catalog based on user intent,
 * and the renderer composes unique visual responses every time.
 */

export { ComponentType, type ComponentSpec, COMPONENT_CATALOG, getComponentsForIntent } from './component-registry'
export { ClayComponentRenderer, renderComponents } from './component-renderer'
export { classifyIntent, type IntentClassification, type RenderStrategy } from './intent-classifier'
export { handleComponentAction } from './action-handler'
export {
  ACTION_REGISTRY,
  ALL_ACTION_IDS,
  DEAD_ACTION_IDS,
  WRITE_ACTION_IDS,
  MORNING_BRIEF_ZONES,
  DESIGN_TOKEN_BINDINGS,
  STRATEGIC_DECISIONS,
  URGENCY_SCORING,
  TRIAGE_TYPE_PRIORITY,
  TRIAGE_MAX_ITEMS,
  TRIAGE_RETENTION_DAYS,
  type ActionDefinition,
  type ActionStatus,
  type ActionKind,
  type ConfirmationStyle,
  type TriageItem,
  type TriageItemType,
} from './intelligent-clay-registry'
