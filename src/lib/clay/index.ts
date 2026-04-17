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
